<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * El paquete de escritorio se descarga tal cual desde el repositorio publico.
 *
 * Todo lo que viaje adentro del .env empaquetado es, en la practica, publico:
 * cualquiera puede abrir el instalador y leerlo. Dos cosas no pueden estar
 * ahi, y estas pruebas las clavan:
 *
 *  - La clave de cifrado. Compartida entre todas las copias, permite firmar
 *    cookies de sesion validas para la instalacion de cualquier otro comercio.
 *  - Las credenciales de la base y del correo de quien compila.
 */
class ClavePorInstalacionTest extends TestCase
{
    private function seQuitaDelPaquete(string $clave): bool
    {
        return in_array($clave, config('nativephp.cleanup_env_keys', []), true);
    }

    public function test_la_clave_de_cifrado_no_viaja_en_el_paquete(): void
    {
        $this->assertTrue(
            $this->seQuitaDelPaquete('APP_KEY'),
            'APP_KEY tiene que estar en cleanup_env_keys: si viaja, todas las instalaciones comparten clave'
        );
    }

    public function test_las_credenciales_de_desarrollo_no_viajan_en_el_paquete(): void
    {
        foreach (['DB_HOST', 'DB_DATABASE', 'DB_USERNAME', 'DB_PASSWORD', 'MAIL_HOST', 'MAIL_USERNAME', 'MAIL_PASSWORD'] as $clave)
        {
            $this->assertTrue(
                $this->seQuitaDelPaquete($clave),
                "{$clave} tiene que estar en cleanup_env_keys: son credenciales de la maquina que compila"
            );
        }
    }

    public function test_sin_clave_configurada_la_aplicacion_se_genera_una_y_la_reusa(): void
    {
        $archivo = storage_path('app/clave-de-aplicacion');
        $habia = is_file($archivo) ? file_get_contents($archivo) : null;

        try {
            @unlink($archivo);
            config(['app.key' => null]);

            $provider = new \App\Providers\AppServiceProvider($this->app);
            $generar = new \ReflectionMethod($provider, 'asegurarClavePropiaDeCadaInstalacion');
            $generar->setAccessible(true);

            $generar->invoke($provider);
            $primera = config('app.key');

            $this->assertNotEmpty($primera, 'tiene que quedar una clave utilizable');
            $this->assertStringStartsWith('base64:', $primera);
            $this->assertFileExists($archivo, 'la clave se guarda para el proximo arranque');

            // Segundo arranque: la misma clave, no una nueva. Si cambiara, cada
            // arranque invalidaria las sesiones abiertas.
            config(['app.key' => null]);
            $generar->invoke($provider);

            $this->assertSame($primera, config('app.key'), 'el segundo arranque reusa la clave, no genera otra');
        } finally {
            if ($habia === null) {
                @unlink($archivo);
            } else {
                file_put_contents($archivo, $habia);
            }
        }
    }

    public function test_no_pisa_una_clave_ya_configurada(): void
    {
        // En la web la clave la escribe el asistente en el .env. Si este
        // mecanismo la pisara, cada request cerraria todas las sesiones.
        config(['app.key' => 'base64:' . base64_encode(str_repeat('k', 32))]);

        $provider = new \App\Providers\AppServiceProvider($this->app);
        $generar = new \ReflectionMethod($provider, 'asegurarClavePropiaDeCadaInstalacion');
        $generar->setAccessible(true);
        $generar->invoke($provider);

        $this->assertSame('base64:' . base64_encode(str_repeat('k', 32)), config('app.key'));
    }
}
