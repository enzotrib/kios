<?php

namespace Tests\Feature;

use App\Models\Store;
use App\Models\User;
use Tests\TestCase;
use ZipArchive;

/**
 * "Hacer una copia ahora" sobre SQLite.
 *
 * El codigo original armaba el volcado con SHOW TABLES y SHOW CREATE TABLE,
 * que son de MySQL. En el paquete de escritorio la base es SQLite, asi que el
 * boton respondia error 500 siempre: la unica funcion que protege los datos
 * del comercio era justo la que nunca habia funcionado ahi.
 *
 * Esta clase va aparte del resto y arma la base a mano, sin RefreshDatabase.
 * La copia se hace con VACUUM INTO, que SQLite se niega a ejecutar si hay una
 * transaccion abierta, y RefreshDatabase abre una alrededor de cada prueba.
 * Tampoco sirve DatabaseMigrations, que revierte las migraciones al terminar:
 * varias de las migraciones de InfoShop no se pueden revertir en SQLite. Con
 * una base en archivo y migrate:fresh, lo que se prueba es el mismo camino
 * que corre en la maquina del comercio.
 */
class CopiaDeSeguridadTest extends TestCase
{
    private string $archivoDeBase;

    protected function setUp(): void
    {
        // VACUUM INTO necesita una base de verdad: `:memory:` no es un archivo.
        $this->archivoDeBase = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kios-prueba-' . uniqid() . '.sqlite';
        touch($this->archivoDeBase);

        putenv('DB_DATABASE=' . $this->archivoDeBase);
        $_ENV['DB_DATABASE'] = $_SERVER['DB_DATABASE'] = $this->archivoDeBase;

        parent::setUp();

        $this->artisan('migrate:fresh', ['--no-interaction' => true]);
    }

    protected function tearDown(): void
    {
        // Windows no deja borrar un archivo que sigue abierto, y PDO mantiene
        // la base abierta hasta que se cierra la conexion.
        \Illuminate\Support\Facades\DB::disconnect();

        parent::tearDown();

        try {
            @unlink($this->archivoDeBase);
        } catch (\Throwable $e) {
            // Queda en el temporal del sistema; no afecta a nada.
        }

        putenv('DB_DATABASE=:memory:');
        $_ENV['DB_DATABASE'] = $_SERVER['DB_DATABASE'] = ':memory:';
    }

    public function test_la_copia_trae_la_base_de_datos(): void
    {
        $tienda = Store::create([
            'name' => 'Kiosco', 'address' => 'Av. Siempreviva 742',
            'contact_number' => '1', 'sale_prefix' => 'K', 'current_sale_number' => 0,
        ]);

        $duenio = User::factory()->create([
            'user_role' => 'super-admin', 'is_active' => 1, 'store_id' => $tienda->id,
        ]);

        // Una instalacion terminada: si no, el sistema manda al asistente.
        \App\Models\Setting::create([
            'meta_key' => 'installed_at',
            'meta_value' => now()->toDateTimeString(),
        ]);

        $respuesta = $this->actingAs($duenio)->get('/backup-now');

        $respuesta->assertOk();
        $this->assertSame('application/zip', $respuesta->headers->get('content-type'));

        // La respuesta es una descarga de archivo, no un flujo: se lee el zip
        // que quedo guardado, que es el mismo que baja el comercio.
        $zipDescargado = $respuesta->baseResponse->getFile()->getPathname();

        $zip = new ZipArchive();
        $this->assertTrue($zip->open($zipDescargado) === true, 'el archivo tiene que ser un zip valido');

        $nombres = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $nombres[] = $zip->getNameIndex($i);
        }

        $copia = collect($nombres)->first(fn ($nombre) => str_ends_with($nombre, '.sqlite'));
        $this->assertNotNull($copia, 'el zip tiene que traer la base: ' . implode(', ', $nombres));

        // Y tiene que ser una base que se pueda abrir y leer, no un archivo
        // cualquiera con el nombre correcto: una copia que no se puede
        // restaurar no es una copia.
        $baseRestaurada = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'kios-restaurada-' . uniqid() . '.sqlite';
        file_put_contents($baseRestaurada, $zip->getFromName($copia));
        $zip->close();

        $pdo = new \PDO('sqlite:' . $baseRestaurada);
        $nombreGuardado = $pdo->query('select name from stores limit 1')->fetchColumn();
        $this->assertSame('Kiosco', $nombreGuardado);

        $pdo = null;
        @unlink($baseRestaurada);
    }
}
