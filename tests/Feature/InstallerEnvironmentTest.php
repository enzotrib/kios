<?php

namespace Tests\Feature;

use App\Services\InstallerService;
use Tests\TestCase;

/**
 * El asistente tiene que adaptarse al entorno donde corre.
 *
 * Confundir estos casos deja al usuario trabado: en el paquete de escritorio
 * no hay servidor MySQL ni permisos de carpeta que revisar, y pedirle esos
 * datos —o exigirle la extension pdo_mysql, que el PHP empaquetado no trae—
 * lo bloquea sin ninguna salida posible.
 */
class InstallerEnvironmentTest extends TestCase
{
    private function instalador(): InstallerService
    {
        return app(InstallerService::class);
    }

    public function test_web_con_mysql_no_es_escritorio_ni_sqlite(): void
    {
        config(['database.default' => 'mysql']);

        $this->assertFalse($this->instalador()->isDesktop());
        $this->assertFalse($this->instalador()->usesSqlite());
    }

    public function test_web_con_sqlite_no_es_escritorio(): void
    {
        config(['database.default' => 'sqlite']);

        $this->assertFalse($this->instalador()->isDesktop());
        $this->assertTrue($this->instalador()->usesSqlite());
    }

    public function test_el_paquete_de_escritorio_se_reconoce(): void
    {
        // Asi deja la configuracion NativePHP al arrancar la app empaquetada:
        // una conexion propia llamada 'nativephp' cuyo driver es sqlite.
        config([
            'database.connections.nativephp' => ['driver' => 'sqlite', 'database' => ':memory:'],
            'database.default' => 'nativephp',
        ]);

        $this->assertTrue($this->instalador()->isDesktop());
        $this->assertTrue($this->instalador()->usesSqlite(), 'debe detectarse por driver, no por nombre de conexion');
    }
}
