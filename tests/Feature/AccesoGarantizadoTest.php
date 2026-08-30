<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\InstallerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * La aplicacion nunca puede quedar sin forma de entrar.
 *
 * El primer paquete abria en un login imposible: su base tenia las 51 tablas
 * creadas y CERO usuarios. No es que el usuario no supiera la clave, es que
 * no existia ninguna clave que sirviera.
 *
 * Con esto, el peor caso deja de ser "no se puede entrar" y pasa a ser
 * "vuelve a aparecer el asistente", que si tiene salida.
 */
class AccesoGarantizadoTest extends TestCase
{
    use RefreshDatabase;

    private function instalador(): InstallerService
    {
        return app(InstallerService::class);
    }

    /** Deja la marca de instalada pero sin ninguna cuenta. */
    private function instaladaSinUsuarios(): void
    {
        DB::table('users')->delete();
    }

    public function test_sin_usuarios_no_se_considera_instalada(): void
    {
        $this->instaladaSinUsuarios();

        $this->assertFalse(
            $this->instalador()->isInstalled(),
            'con la base marcada como instalada pero sin cuentas, la app abriria en un login imposible'
        );
    }

    public function test_sin_usuarios_el_asistente_vuelve_a_aparecer(): void
    {
        $this->instaladaSinUsuarios();

        $this->get('/login')->assertRedirect(route('installer.welcome'));
    }

    public function test_con_un_usuario_activo_si_esta_instalada(): void
    {
        User::factory()->create(['is_active' => 1]);

        $this->assertTrue($this->instalador()->isInstalled());
        $this->get('/login')->assertOk();
    }

    public function test_un_usuario_inactivo_no_alcanza(): void
    {
        $this->instaladaSinUsuarios();
        User::factory()->create(['is_active' => 0]);

        $this->assertFalse(
            $this->instalador()->isInstalled(),
            'un usuario desactivado no puede iniciar sesion: es lo mismo que no tener ninguno'
        );
    }
}
