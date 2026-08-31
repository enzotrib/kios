<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CodigoDeRecuperacion;
use App\Services\InstallerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Si nadie recuerda la contrasena, tiene que haber una salida.
 *
 * En la web la da el correo. En el paquete de escritorio no hay correo
 * —MAIL_MAILER=log escribe el mensaje en un archivo de registro y no sale a
 * ningun lado— ni tiene por que haber internet. Sin una salida propia, un error
 * de tipeo en la contrasena del asistente deja al comercio afuera de sus
 * propias ventas para siempre.
 */
class RecuperarAccesoTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Que la aplicacion se comporte como el paquete de escritorio.
     *
     * No se cambia la conexion de verdad: apuntar `database.default` a otra
     * conexion sqlite en memoria abriria una base nueva y vacia, sin las
     * tablas. Lo unico que hace falta es que el servicio diga que esto es
     * escritorio, que es de lo que dependen las rutas.
     */
    private function comoEscritorio(): void
    {
        $this->partialMock(InstallerService::class, function ($simulado) {
            $simulado->shouldReceive('isDesktop')->andReturn(true);
        });
    }

    private function comoWeb(): void
    {
        $this->partialMock(InstallerService::class, function ($simulado) {
            $simulado->shouldReceive('isDesktop')->andReturn(false);
        });
    }

    private function codigos(): CodigoDeRecuperacion
    {
        return app(CodigoDeRecuperacion::class);
    }

    private function administrador(): User
    {
        return User::factory()->create([
            'user_role' => 'super-admin',
            'is_active' => 1,
            'password' => Hash::make('la-que-escribi-mal'),
        ]);
    }

    protected function tearDown(): void
    {
        @unlink($this->codigos()->rutaDelArchivo());

        parent::tearDown();
    }

    public function test_el_codigo_deja_poner_una_contrasena_nueva(): void
    {
        $this->comoEscritorio();
        $admin = $this->administrador();

        $codigo = $this->codigos()->generarSiNoHay();
        $this->assertNotNull($codigo);

        $this->post('/recuperar-acceso', [
            'codigo' => $codigo,
            'password' => 'una-contrasena-nueva',
            'password_confirmation' => 'una-contrasena-nueva',
        ])->assertRedirect(route('dashboard', absolute: false));

        $this->assertTrue(Hash::check('una-contrasena-nueva', $admin->fresh()->password));
        $this->assertAuthenticatedAs($admin);
    }

    public function test_el_codigo_queda_escrito_en_un_archivo_que_la_persona_puede_abrir(): void
    {
        $this->comoEscritorio();
        $codigo = $this->codigos()->generarSiNoHay();

        $archivo = $this->codigos()->rutaDelArchivo();

        $this->assertFileExists($archivo, 'sin el archivo no hay forma de conocer el código');
        $this->assertStringContainsString($codigo, file_get_contents($archivo));

        // Y está en la carpeta de datos, no enterrado en subcarpetas: la persona
        // tiene que encontrarlo apenas la abre.
        $this->assertSame($this->codigos()->carpetaDeDatos(), dirname($archivo));
    }

    public function test_un_codigo_equivocado_no_cambia_nada(): void
    {
        $this->comoEscritorio();
        $admin = $this->administrador();
        $this->codigos()->generarSiNoHay();

        $this->post('/recuperar-acceso', [
            'codigo' => 'ABCD-EFGH-JKLM',
            'password' => 'la-que-quiera',
            'password_confirmation' => 'la-que-quiera',
        ])->assertSessionHasErrors('codigo');

        $this->assertTrue(Hash::check('la-que-escribi-mal', $admin->fresh()->password));
        $this->assertGuest();
    }

    public function test_se_acepta_el_codigo_copiado_a_mano_con_otro_formato(): void
    {
        // La persona lo está copiando de un papel o de un archivo de texto.
        // Fallarle por un guión de menos o por minúsculas no protege de nada.
        $this->comoEscritorio();
        $codigo = $this->codigos()->generarSiNoHay();

        $this->assertTrue($this->codigos()->verificar(strtolower($codigo)));
        $this->assertTrue($this->codigos()->verificar(str_replace('-', '', $codigo)));
        $this->assertTrue($this->codigos()->verificar(' ' . $codigo . ' '));
    }

    public function test_el_codigo_usado_deja_de_servir(): void
    {
        $this->comoEscritorio();
        $admin = $this->administrador();
        $codigo = $this->codigos()->generarSiNoHay();

        $this->codigos()->restablecerLaContrasena($admin, 'una-contrasena-nueva');

        $this->assertFalse(
            $this->codigos()->verificar($codigo),
            'el código usado pudo quedar a la vista de cualquiera mientras se hacía esto'
        );
    }

    public function test_no_rota_el_codigo_por_su_cuenta(): void
    {
        // El código anotado en un papel el día de la instalación tiene que
        // seguir sirviendo. Si abrir una pantalla lo invalidara, ese papel
        // dejaría de servir sin que nadie se entere.
        $this->comoEscritorio();
        $codigo = $this->codigos()->generarSiNoHay();

        $this->assertNull($this->codigos()->generarSiNoHay(), 'no genera otro si ya hay');
        $this->get('/recuperar-acceso')->assertOk();

        $this->assertTrue($this->codigos()->verificar($codigo));
    }

    public function test_una_instalacion_vieja_sin_codigo_igual_tiene_salida(): void
    {
        // Las instalaciones anteriores a esta función no tienen ningún código.
        // No pueden quedarse sin salida por haberse instalado antes.
        $this->comoEscritorio();
        $this->administrador();

        $this->assertFalse($this->codigos()->hayCodigoGuardado());

        $this->get('/recuperar-acceso')->assertOk();

        $this->assertTrue($this->codigos()->hayCodigoGuardado());
        $this->assertFileExists($this->codigos()->rutaDelArchivo());
    }

    public function test_se_puede_pedir_uno_nuevo_si_se_perdio_el_archivo(): void
    {
        $this->comoEscritorio();
        $viejo = $this->codigos()->generarSiNoHay();

        @unlink($this->codigos()->rutaDelArchivo());

        $this->post('/recuperar-acceso/codigo-nuevo')->assertRedirect();

        $this->assertFileExists($this->codigos()->rutaDelArchivo());
        $this->assertFalse($this->codigos()->verificar($viejo), 'el anterior queda sin efecto');
    }

    public function test_en_la_web_esto_no_existe(): void
    {
        // Ahí sí hay correo y la carpeta de datos no está al alcance de quien
        // usa el sistema: dejar abierto un cambio de contraseña sin credenciales
        // sería regalar la cuenta del administrador a cualquiera que llegue al
        // dominio.
        $this->comoWeb();

        $this->get('/recuperar-acceso')->assertRedirect(route('password.request'));
        $this->post('/recuperar-acceso', [
            'codigo' => 'lo-que-sea',
            'password' => 'la-que-quiera',
            'password_confirmation' => 'la-que-quiera',
        ])->assertNotFound();
    }
}
