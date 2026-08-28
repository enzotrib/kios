<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Una instalacion nueva tiene que entrar al asistente.
 *
 * Sin esto la aplicacion abria en /login sin ningun usuario creado: en la
 * version de escritorio no hay barra de direcciones para ir a /install a
 * mano, asi que el usuario quedaba encerrado sin forma de entrar.
 */
class InstallerRedirectTest extends TestCase
{
    use RefreshDatabase;

    /** Quita la marca que TestCase pone por defecto. */
    private function simularInstalacionNueva(): void
    {
        DB::table('settings')->where('meta_key', 'installed_at')->delete();
    }

    public function test_una_instalacion_nueva_va_al_asistente(): void
    {
        $this->simularInstalacionNueva();

        $this->get('/login')->assertRedirect(route('installer.welcome'));
        $this->get('/')->assertRedirect(route('installer.welcome'));
    }

    public function test_el_asistente_sigue_accesible_sin_hacer_bucle(): void
    {
        $this->simularInstalacionNueva();

        $this->get('/install')->assertOk();
    }

    public function test_una_aplicacion_instalada_no_se_redirige(): void
    {
        // TestCase ya deja la marca puesta: representa una app en uso.
        $this->get('/login')->assertOk();
    }
}
