<?php

namespace Database\Seeders;

use App\Models\Collection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Árbol de colecciones para kiosco / almacén argentino.
 *
 * Criterio de armado:
 *  - CATEGORÍA + SUBCATEGORÍA: solo 2 niveles, que es lo que navega el POS.
 *  - MARCA: no es un nivel del árbol, va en products.brand_id.
 *  - ETIQUETA: características transversales (retornable, sin TACC) que
 *    cruzan varias categorías y por eso no pueden vivir en el árbol.
 *
 * Es idempotente: se puede correr varias veces sin duplicar nada.
 */
class KioscoCollectionsSeeder extends Seeder
{
    /** Categorías padre => subcategorías */
    private array $categories = [
        'Bebidas' => [
            'Gaseosas',
            'Aguas y sodas',
            'Jugos e isotónicas',
            'Cervezas',
            'Vinos',
            'Bebidas blancas',
            'Aperitivos y espumantes',
            'Energizantes',
        ],
        'Golosinas' => [
            'Chocolates',
            'Alfajores',
            'Caramelos y chupetines',
            'Chicles',
            'Turrones y barras',
            'Gomitas',
        ],
        'Snacks' => [
            'Papas fritas',
            'Palitos y chizitos',
            'Maní y frutos secos',
            'Galletitas saladas',
            'Nachos y tortillas',
        ],
        'Galletitas' => [
            'Galletitas dulces',
            'Rellenas',
            'Obleas',
            'Bizcochos',
        ],
        'Almacén' => [
            'Yerba, café y té',
            'Azúcar y endulzantes',
            'Aceites y aderezos',
            'Fideos y arroz',
            'Harinas y premezclas',
            'Conservas',
            'Panificados',
            'Fiambres',
        ],
        'Lácteos' => [
            'Leches',
            'Yogures',
            'Quesos',
            'Manteca y cremas',
            'Postres y flanes',
        ],
        'Congelados' => [
            'Helados',
            'Hamburguesas y milanesas',
            'Papas congeladas',
        ],
        'Tabaquería' => [
            'Cigarrillos',
            'Tabaco y armados',
            'Encendedores y accesorios',
        ],
        'Limpieza' => [
            'Lavandina y desinfectantes',
            'Detergentes y jabones',
            'Rollos y papel higiénico',
            'Insecticidas',
            'Trapos y esponjas',
        ],
        'Perfumería' => [
            'Higiene personal',
            'Pañales',
            'Cuidado capilar',
            'Farmacia y preservativos',
        ],
        'Librería y varios' => [
            'Librería y escolar',
            'Pilas y electrónica',
            'Juguetería',
            'Bazar',
        ],
        'Recargas y servicios' => [
            'Recarga celular',
            'Recarga SUBE',
            'Pago de servicios',
        ],
    ];

    /** Marcas: van en products.brand_id, NO son un nivel del árbol */
    private array $brands = [
        // Bebidas
        'Coca-Cola', 'Pepsi', 'Manaos', 'Secco', 'Villa del Sur', 'Villavicencio',
        'Quilmes', 'Brahma', 'Andes', 'Stella Artois', 'Corona', 'Red Bull', 'Speed',
        'Cepita', 'Baggio', 'Gatorade', 'Fernet Branca', 'Gancia', 'Termidor',
        // Golosinas y snacks
        'Arcor', 'Bagley', 'Terrabusi', 'Georgalos', 'Fantoche', 'Havanna',
        'Milka', 'Águila', 'Bon o Bon', "Lay's", 'Pehuamar', 'Krachitos', 'Doritos',
        'Granix', 'Don Satur',
        // Almacén
        'Playadito', 'Rosamonte', 'Taragüí', 'Cruz de Malta', 'La Virginia',
        'Nescafé', 'Dolca', 'Cabrales', 'Ledesma', 'Chango', 'Natura', 'Cocinero',
        'Marolio', 'Matarazzo', 'Lucchetti', 'Knorr', 'Gallo', 'Blancaflor', 'Morixe',
        // Lácteos y congelados
        'La Serenísima', 'Sancor', 'Ilolay', 'Danone', 'Ser', 'Frigor', 'Grido',
        // Tabaquería
        'Marlboro', 'Philip Morris', 'Lucky Strike', 'Camel', 'Chesterfield', 'Parliament',
        // Limpieza y perfumería
        'Ayudín', 'Magistral', 'Cif', 'Poett', 'Ala', 'Skip', 'Vim', 'Raid',
        'Rexona', 'Colgate', 'Sedal', 'Plusbelle', 'Pampers', 'Huggies',
        'Elite', 'Higienol', 'Sussex',
    ];

    /** Etiquetas: características transversales a varias categorías */
    private array $tags = [
        'Retornable',
        'Descartable',
        'Sin TACC',
        'Light',
        'Sin azúcar',
        'Sin alcohol',
        'Frío',
        'Congelado',
        'Importado',
        'Granel',
        'Oferta',
        'Novedad',
        'Combo',
        'Venta por unidad',
    ];

    public function run(): void
    {
        $categorias = 0;
        $subcategorias = 0;

        foreach ($this->categories as $parentName => $children) {
            $parent = $this->collection($parentName, 'category');
            $categorias++;

            foreach ($children as $childName) {
                $this->collection($childName, 'category', $parent->id);
                $subcategorias++;
            }
        }

        foreach ($this->brands as $brand) {
            $this->collection($brand, 'brand');
        }

        foreach ($this->tags as $tag) {
            $this->collection($tag, 'tag');
        }

        $this->command->info("Categorías:    {$categorias}");
        $this->command->info("Subcategorías: {$subcategorias}");
        $this->command->info('Marcas:        ' . count($this->brands));
        $this->command->info('Etiquetas:     ' . count($this->tags));
    }

    /**
     * El índice UNIQUE de `collections` es sobre name y slug de forma global
     * (no por tipo), así que buscamos por slug para no chocar ni duplicar.
     * Str::slug quita las tildes, por lo que "Almacén" y "Almacen" comparten
     * slug y esto actualiza el nombre en lugar de duplicar la fila.
     */
    private function collection(string $name, string $type, ?int $parentId = null): Collection
    {
        return Collection::updateOrCreate(
            ['slug' => Str::slug($name)],
            [
                'name' => $name,
                'collection_type' => $type,
                'parent_id' => $parentId,
            ]
        );
    }
}
