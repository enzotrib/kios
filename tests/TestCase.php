<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

abstract class TestCase extends BaseTestCase
{
    /**
     * Marca la aplicacion como ya instalada.
     *
     * El middleware EnsureAppIsInstalled manda al asistente mientras no
     * exista la marca `installed_at`. En los tests la base arranca vacia, asi
     * que sin esto TODA peticion responderia 302 al instalador en lugar de
     * ejercitar la pantalla bajo prueba.
     *
     * Se marca en setUp y no en cada test para que el estado por defecto sea
     * el realista: una aplicacion instalada y en uso.
     */
    protected function setUp(): void
    {
        parent::setUp();

        if (Schema::hasTable('settings')) {
            DB::table('settings')->updateOrInsert(
                ['meta_key' => 'installed_at'],
                ['meta_value' => now()->toDateTimeString()]
            );
        }

        // Y con al menos una cuenta activa: una aplicacion instalada pero sin
        // usuarios NO se considera instalada, porque abriria en un login que
        // nadie puede pasar. Ese estado se prueba a proposito en
        // AccesoGarantizadoTest, borrando los usuarios.
        if (Schema::hasTable('users') && !DB::table('users')->where('is_active', 1)->exists()) {
            \App\Models\User::factory()->create(['is_active' => 1]);
        }
    }
}
