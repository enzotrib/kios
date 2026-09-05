<?php

namespace Tests\Feature;

use App\Models\CashLog;
use App\Models\Contact;
use App\Models\Setting;
use App\Models\Store;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Las fallas que aparecieron probando el paquete de Windows.
 *
 * Todas comparten la misma raiz: el sistema se escribio contra MySQL y contra
 * un servidor con Apache, y el paquete de escritorio no es ninguna de las dos
 * cosas. La suite corre sobre SQLite, asi que estas pruebas fallan si alguna
 * de esas suposiciones vuelve a colarse.
 */
class RequerimientosDelPaqueteTest extends TestCase
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

    public function test_el_duenio_entra_al_registro_de_actividad(): void
    {
        // El menu ya mostraba "Registro de actividad" al super-admin, pero el
        // controlador le respondia 403 porque el asistente nunca creaba el
        // permiso `activity-log`.
        $this->actingAs($this->duenio())
            ->get('/activity-log')
            ->assertOk();
    }

    public function test_vaciar_la_cache_devuelve_al_sistema(): void
    {
        // Antes respondia con la frase suelta 'All caches cleared...' como
        // cuerpo de la pagina y no habia forma de volver.
        $this->actingAs($this->duenio())
            ->get('/clear-cache', ['referer' => '/dashboard'])
            ->assertRedirect()
            ->assertSessionHas('success');
    }

    public function test_subir_el_logo_no_rompe_cuando_no_habia_ninguno(): void
    {
        // El asistente deja `shop_logo` vacio. Con el valor vacio el codigo
        // viejo llamaba a unlink() sobre la carpeta public entera y Laravel
        // convertia el warning en un 500: fallaba justo la primera vez.
        Storage::fake('public');
        Setting::create(['meta_key' => 'shop_logo', 'meta_value' => '']);

        $this->actingAs($this->duenio())
            ->post('/settings-update', [
                'setting_type' => 'shop_information',
                'shop_name' => 'Kiosco',
                'shop_logo' => UploadedFile::fake()->image('logo.png'),
            ])
            ->assertOk();

        $guardado = Setting::where('meta_key', 'shop_logo')->value('meta_value');
        $this->assertStringStartsWith('storage/uploads/', $guardado);
        Storage::disk('public')->assertExists(substr($guardado, strlen('storage/')));
    }

    public function test_el_logo_se_puede_ver_sin_enlace_simbolico(): void
    {
        // En el paquete no hay public/storage: el almacenamiento vive en
        // %APPDATA%. Sin una ruta que lo sirva, el logo se guardaba bien y se
        // veia roto.
        Storage::fake('public');
        Storage::disk('public')->put('uploads/2026/01/logo.png', 'contenido');

        $this->actingAs($this->duenio())
            ->get('/storage/uploads/2026/01/logo.png')
            ->assertOk();
    }

    public function test_la_caja_filtra_por_la_fecha_elegida(): void
    {
        // `$request->only([...])` devolvia un arreglo y la consulta comparaba
        // la columna contra el arreglo: al elegir una fecha, la caja quedaba
        // vacia.
        $duenio = $this->duenio();
        $contacto = Contact::create(['name' => 'Cliente', 'balance' => 0, 'type' => 'customer']);

        $ayer = now()->subDay()->toDateString();

        Transaction::create([
            'store_id' => $duenio->store_id,
            'contact_id' => $contacto->id,
            'transaction_date' => $ayer,
            'amount' => 1500,
            'payment_method' => 'Cash',
            'transaction_type' => 'sale',
        ]);

        $this->assertSame(1, CashLog::count());

        $respuesta = $this->actingAs($duenio)->get('/reports/dailycash?transaction_date=' . $ayer);

        $respuesta->assertOk();
        $movimientos = $respuesta->viewData('page')['props']['logs'];

        $this->assertCount(1, $movimientos, 'la venta de esa fecha tiene que aparecer');
        $this->assertEquals(1500, $movimientos[0]['cash_in']);
    }

    public function test_la_zona_horaria_del_comercio_sobrevive_a_la_actualizacion(): void
    {
        // El .env vive en la carpeta del programa, que el instalador reemplaza
        // al actualizar. Por eso la zona horaria tambien se guarda en la base,
        // que esta en la carpeta de datos y no se toca.
        Setting::create([
            'meta_key' => 'app_timezone',
            'meta_value' => 'America/Argentina/Buenos_Aires',
        ]);

        // Se vuelve a arrancar el proveedor, como pasaria en el arranque
        // siguiente al de la actualizacion.
        (new \App\Providers\AppServiceProvider($this->app))->boot();

        $this->assertSame('America/Argentina/Buenos_Aires', config('app.timezone'));
        $this->assertSame('America/Argentina/Buenos_Aires', date_default_timezone_get());
    }

    public function test_la_impresion_directa_no_existe_en_la_web(): void
    {
        // Sin este corte, cualquiera que llegue al dominio podria mandar HTML
        // a imprimirse en el servidor.
        $this->actingAs($this->duenio())->get('/impresoras')->assertNotFound();
        $this->actingAs($this->duenio())
            ->post('/imprimir-ticket', ['html' => '<p>hola</p>'])
            ->assertNotFound();
    }
}
