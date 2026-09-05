<?php

namespace Tests\Feature;

use App\Fiscal\AlicuotaIva;
use App\Fiscal\CondicionIva;
use App\Fiscal\Reglas\DocumentoCoherente;
use App\Fiscal\TipoDeDocumento;
use App\Models\Contact;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Los datos que hacen falta para poder facturar algun dia.
 *
 * Todavia no se emite ningun comprobante. Estos campos existen igual porque
 * son los unicos del asunto que no se pueden recuperar despues: un cliente
 * cargado sin CUIT hay que llamarlo por telefono, y tres mil productos sin
 * alicuota no los revisa nadie.
 */
class DatosFiscalesTest extends TestCase
{
    use RefreshDatabase;

    private function duenio(): User
    {
        $tienda = Store::create([
            'name' => 'Kiosco', 'address' => 'Av. Siempreviva 742',
            'contact_number' => '1', 'sale_prefix' => 'K', 'current_sale_number' => 0,
        ]);

        return User::factory()->create([
            'user_role' => 'super-admin', 'is_active' => 1, 'store_id' => $tienda->id,
        ]);
    }

    public function test_se_guardan_los_datos_fiscales_del_cliente(): void
    {
        $this->actingAs($this->duenio())
            ->post('/contact', [
                'name' => 'Almacén Don José',
                'type' => 'customer',
                'doc_tipo' => TipoDeDocumento::CUIT->value,
                'doc_nro' => '30500001735',
                'condicion_iva' => CondicionIva::RESPONSABLE_INSCRIPTO->value,
            ])
            ->assertCreated();

        $cliente = Contact::where('name', 'Almacén Don José')->firstOrFail();

        $this->assertSame(TipoDeDocumento::CUIT, $cliente->doc_tipo);
        $this->assertSame('30500001735', $cliente->doc_nro);
        $this->assertSame(CondicionIva::RESPONSABLE_INSCRIPTO, $cliente->condicion_iva);
    }

    public function test_un_cuit_mal_tipeado_se_rechaza_al_cargarlo(): void
    {
        // Es el punto de toda la validación: un dígito de más no molesta hoy,
        // molesta el día que ARCA rechaza el comprobante y hay que adivinar
        // cuál de cuatrocientos clientes tiene el número mal.
        $this->actingAs($this->duenio())
            ->postJson('/contact', [
                'name' => 'Cliente con error de tipeo',
                'type' => 'customer',
                'doc_tipo' => TipoDeDocumento::CUIT->value,
                'doc_nro' => '30500001736', // el verificador correcto es 5
                'condicion_iva' => CondicionIva::RESPONSABLE_INSCRIPTO->value,
            ])
            ->assertJsonValidationErrors('doc_nro');

        $this->assertDatabaseMissing('contacts', ['name' => 'Cliente con error de tipeo']);
    }

    public function test_el_digito_verificador_del_cuit(): void
    {
        $this->assertTrue(DocumentoCoherente::digitoVerificadorValido('30500001735'));
        $this->assertTrue(DocumentoCoherente::digitoVerificadorValido('27230938607'));

        // El mismo CUIT con el ultimo digito cambiado: es exactamente el
        // error de tipeo que se quiere atajar.
        $this->assertFalse(DocumentoCoherente::digitoVerificadorValido('30500001736'));
        $this->assertFalse(DocumentoCoherente::digitoVerificadorValido('20123456789'));
        $this->assertFalse(DocumentoCoherente::digitoVerificadorValido('123'));
        $this->assertFalse(DocumentoCoherente::digitoVerificadorValido('abcdefghijk'));
    }

    public function test_un_dni_con_la_cantidad_de_digitos_equivocada_se_rechaza(): void
    {
        $this->actingAs($this->duenio())
            ->postJson('/contact', [
                'name' => 'Cliente',
                'type' => 'customer',
                'doc_tipo' => TipoDeDocumento::DNI->value,
                'doc_nro' => '123',
            ])
            ->assertJsonValidationErrors('doc_nro');
    }

    public function test_vender_sin_datos_fiscales_sigue_andando(): void
    {
        // Un kiosco vende todo el día sin pedirle documento a nadie. Los
        // campos nuevos no pueden estorbar eso.
        $this->actingAs($this->duenio())
            ->post('/contact', ['name' => 'Cliente de mostrador', 'type' => 'customer'])
            ->assertCreated();

        $cliente = Contact::where('name', 'Cliente de mostrador')->firstOrFail();

        $this->assertNull($cliente->doc_tipo);
        $this->assertNull($cliente->doc_nro);
    }

    public function test_el_producto_guarda_su_alicuota_y_admite_no_tenerla(): void
    {
        $duenio = $this->duenio();

        $this->actingAs($duenio)->post('/products', [
            'name' => 'Leche entera',
            'unit' => 'PC',
            'quantity' => 10,
            'cost' => 100,
            'price' => 150,
            'is_stock_managed' => 1,
            'discount' => 0,
            'discount_percentage' => 0,
            'alicuota_iva' => AlicuotaIva::DIEZ_CON_CINCO->value,
        ])->assertRedirect();

        $leche = Product::where('name', 'Leche entera')->firstOrFail();
        $this->assertSame(AlicuotaIva::DIEZ_CON_CINCO, $leche->alicuota_iva);

        // Sin alícuota propia queda nula, que significa "la general del
        // comercio". Es lo que va a tener el 95% del catálogo.
        $this->actingAs($duenio)->post('/products', [
            'name' => 'Caramelos',
            'unit' => 'PC',
            'quantity' => 10,
            'cost' => 100,
            'price' => 150,
            'is_stock_managed' => 1,
            'discount' => 0,
            'discount_percentage' => 0,
        ])->assertRedirect();

        $this->assertNull(Product::where('name', 'Caramelos')->firstOrFail()->alicuota_iva);
    }

    public function test_separar_el_iva_de_un_precio_de_gondola(): void
    {
        // El kiosquero carga el precio con el IVA adentro. El comprobante lo
        // pide separado, y la suma de las dos partes tiene que dar exactamente
        // lo que se cobró: un centavo de diferencia por venta es lo que
        // después no cierra contra la caja.
        $partes = AlicuotaIva::VEINTIUNO->separarDelPrecioFinal(1210.00);

        $this->assertSame(1000.00, $partes['neto']);
        $this->assertSame(210.00, $partes['iva']);

        foreach ([999.99, 1500.50, 3333.33, 87.10] as $precio) {
            foreach (AlicuotaIva::cases() as $alicuota) {
                $partes = $alicuota->separarDelPrecioFinal($precio);

                $this->assertSame(
                    $precio,
                    round($partes['neto'] + $partes['iva'], 2),
                    "neto + iva tiene que dar {$precio} con {$alicuota->etiqueta()}"
                );
            }
        }
    }

    public function test_los_codigos_de_arca_llegan_a_las_pantallas(): void
    {
        // Se comparten desde PHP para que no haya una copia en el javascript
        // que se desincronice.
        $props = $this->actingAs($this->duenio())
            ->get('/customers')
            ->viewData('page')['props']['fiscal'];

        $this->assertContains(
            ['codigo' => 99, 'etiqueta' => 'Sin documento', 'digitos' => null],
            $props['tiposDeDocumento']
        );
        $this->assertContains(
            ['codigo' => 5, 'etiqueta' => 'Consumidor final'],
            $props['condicionesIva']
        );
        $this->assertContains(
            ['codigo' => 5, 'etiqueta' => '21%', 'porcentaje' => 21.0],
            $props['alicuotasIva']
        );
    }
}
