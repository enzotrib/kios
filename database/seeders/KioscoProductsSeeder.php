<?php

namespace Database\Seeders;

use App\Models\Collection;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductStock;
use App\Models\Store;
use Illuminate\Database\Seeder;

/**
 * Productos de prueba para probar POS, ventas y facturacion.
 *
 * Un producto NO alcanza para que aparezca en el POS. La consulta de
 * POSController::getProducts() hace:
 *
 *   products -> product_batches (is_active = 1) -> product_stocks (store_id)
 *
 * asi que cada producto necesita ademas un LOTE con precio y costo, y una fila
 * de STOCK en la sucursal. Este seeder crea las tres cosas y ademas engancha
 * cada producto a su categoria y a su marca en la tabla pivote, para que
 * tambien se pueda navegar por colecciones en el POS.
 *
 * Es idempotente: se busca por codigo de barras, asi que correrlo dos veces
 * actualiza los precios en lugar de duplicar productos.
 */
class KioscoProductsSeeder extends Seeder
{
    /**
     * Precios de referencia de kiosco (ago-2026). `cost` es lo que paga el
     * comercio y `price` lo que cobra: la diferencia da margen para que los
     * reportes de ganancia muestren numeros con sentido.
     */
    private array $products = [
        [
            'name' => 'Coca-Cola 1.5L',
            'barcode' => '7790895000997',
            'sku' => 'BEB-COCA-15',
            'unit' => 'un',
            'cost' => 1800.00,
            'price' => 2600.00,
            'quantity' => 24,
            'alert_quantity' => 6,
            'category' => 'Gaseosas',
            'brand' => 'Coca-Cola',
            'tags' => ['Descartable'],
        ],
        [
            'name' => 'Cerveza Quilmes Clásica 1L',
            'barcode' => '7792798003457',
            'sku' => 'BEB-QUIL-1L',
            'unit' => 'un',
            'cost' => 2100.00,
            'price' => 3100.00,
            'quantity' => 18,
            'alert_quantity' => 6,
            'category' => 'Cervezas',
            'brand' => 'Quilmes',
            'tags' => ['Retornable'],
        ],
        [
            'name' => 'Alfajor Jorgito Chocolate',
            'barcode' => '7790040999992',
            'sku' => 'GOL-JORG-CH',
            'unit' => 'un',
            'cost' => 700.00,
            'price' => 1100.00,
            'quantity' => 40,
            'alert_quantity' => 10,
            'category' => 'Alfajores',
            'brand' => 'Fantoche',
            'tags' => [],
        ],
        [
            'name' => "Papas Fritas Lay's Clásicas 130g",
            'barcode' => '7794000901025',
            'sku' => 'SNK-LAYS-130',
            'unit' => 'un',
            'cost' => 1900.00,
            'price' => 2900.00,
            'quantity' => 15,
            'alert_quantity' => 5,
            'category' => 'Papas fritas',
            'brand' => "Lay's",
            'tags' => ['Sin TACC'],
        ],
        [
            'name' => 'Yerba Mate Playadito 1kg',
            'barcode' => '7792180000123',
            'sku' => 'ALM-PLAY-1K',
            'unit' => 'kg',
            'cost' => 4200.00,
            'price' => 6000.00,
            'quantity' => 12,
            'alert_quantity' => 4,
            'category' => 'Yerba, café y té',
            'brand' => 'Playadito',
            'tags' => [],
        ],
        [
            'name' => 'Leche La Serenísima Entera 1L',
            'barcode' => '7791337000019',
            'sku' => 'LAC-SERE-1L',
            'unit' => 'un',
            'cost' => 1300.00,
            'price' => 1900.00,
            'quantity' => 3,          // deliberadamente bajo: dispara la alerta de stock
            'alert_quantity' => 6,
            'category' => 'Leches',
            'brand' => 'La Serenísima',
            'tags' => ['Frío'],
        ],
    ];

    public function run(): void
    {
        $store = Store::first();

        if (!$store) {
            $this->command->error('No hay ninguna sucursal cargada. Crea una antes de correr este seeder.');
            return;
        }

        foreach ($this->products as $row) {
            $categoryId = $this->collectionId($row['category']);
            $brandId = $this->collectionId($row['brand']);

            $product = Product::updateOrCreate(
                ['barcode' => $row['barcode']],
                [
                    'name' => $row['name'],
                    'sku' => $row['sku'],
                    'unit' => $row['unit'],
                    'quantity' => $row['quantity'],
                    'alert_quantity' => $row['alert_quantity'],
                    'is_stock_managed' => 1,
                    'is_active' => 1,
                    'is_featured' => 0,
                    'product_type' => 'simple',
                    'discount' => 0,
                    'category_id' => $categoryId,
                    'brand_id' => $brandId,
                ]
            );

            // El POS solo lista productos con un lote ACTIVO: ahi viven precio y costo.
            // is_featured = 1 es imprescindible: la grilla principal del POS filtra
            // por `pb.is_featured` (POSController::getProducts), asi que un lote sin
            // destacar solo aparece buscandolo o navegando por colecciones.
            $batch = ProductBatch::updateOrCreate(
                ['product_id' => $product->id, 'batch_number' => 'INICIAL'],
                [
                    'cost' => $row['cost'],
                    'price' => $row['price'],
                    'discount' => 0,
                    'is_active' => 1,
                    'is_featured' => 1,
                ]
            );

            // Y necesita stock en la sucursal, si no la consulta lo descarta.
            ProductStock::updateOrCreate(
                ['store_id' => $store->id, 'batch_id' => $batch->id, 'product_id' => $product->id],
                ['quantity' => $row['quantity']]
            );

            // Pivote para la navegacion por colecciones del POS
            $collectionIds = array_filter(array_merge(
                [$categoryId, $brandId],
                array_map(fn ($tag) => $this->collectionId($tag), $row['tags'])
            ));
            $product->collections()->sync($collectionIds);

            $margen = $row['price'] > 0
                ? round((($row['price'] - $row['cost']) / $row['price']) * 100)
                : 0;

            $this->command->info(sprintf(
                '%-38s $%8s  stock %3d  margen %2d%%',
                $row['name'],
                number_format($row['price'], 2, ',', '.'),
                $row['quantity'],
                $margen
            ));
        }

        $this->command->newLine();
        $this->command->info('Sucursal: ' . $store->name);
    }

    /** Busca una coleccion por nombre; devuelve null si no fue sembrada. */
    private function collectionId(?string $name): ?int
    {
        if (!$name) return null;

        return Collection::where('name', $name)->value('id');
    }
}
