<?php

namespace Tests\Feature;

use App\Http\Middleware\SoloDuranteLaInstalacion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * El asistente de instalacion no pide credenciales: no puede, porque se usa
 * cuando todavia no existe ningun usuario. Por eso todas sus rutas son
 * publicas, y por eso tienen que cerrarse apenas la instalacion termina.
 *
 * Lo que estaba abierto en un comercio ya instalado:
 *
 *  - /install/database/save reescribia las credenciales de la base en el
 *    .env. Cualquiera que llegara al dominio podia apuntar la aplicacion a
 *    una base suya y quedarse con el sistema.
 *  - /install/database/test dejaba usar el servidor del comercio para probar
 *    credenciales de MySQL contra cualquier host.
 *  - /install/settings/save reescribia nombre, URL y zona horaria.
 *
 * La aplicacion de los tests representa una instalacion en uso.
 */
class AsistenteCerradoTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_se_pueden_reescribir_las_credenciales_de_la_base(): void
    {
        $this->post('/install/database/save', [
            'host' => 'servidor-del-atacante',
            'database' => 'suya',
            'username' => 'root',
        ])->assertRedirect('/login');
    }

    public function test_no_se_puede_usar_el_servidor_para_probar_credenciales_ajenas(): void
    {
        $this->post('/install/database/test', [
            'host' => '10.0.0.5',
            'database' => 'lo_que_sea',
            'username' => 'root',
        ])->assertRedirect('/login');
    }

    public function test_no_se_pueden_reescribir_los_datos_de_la_aplicacion(): void
    {
        $this->post('/install/settings/save', ['app_name' => 'Otra'])->assertRedirect('/login');
    }

    public function test_las_pantallas_del_asistente_quedan_cerradas(): void
    {
        foreach (['/install', '/install/requirements', '/install/database', '/install/settings',
                  '/install/store', '/install/admin', '/install/install'] as $ruta) {
            $this->get($ruta)->assertRedirect('/login');
        }
    }

    public function test_la_pantalla_final_solo_la_ve_quien_acaba_de_instalar(): void
    {
        // Sin la marca que deja el proceso de instalacion, esta cerrada como
        // el resto.
        $this->get('/install/complete')->assertRedirect('/login');

        $this->withSession([SoloDuranteLaInstalacion::RECIEN_INSTALADO => true])
            ->get('/install/complete')
            ->assertOk();
    }
}
