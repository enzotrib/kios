<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

/**
 * Recuperar el acceso cuando nadie recuerda la contrasena.
 *
 * En la web esto lo resuelve el correo: se manda un enlace y listo. En el
 * paquete de escritorio no hay correo —`MAIL_MAILER=log`, o sea que el mensaje
 * se escribe en un archivo de registro y no sale a ningun lado— ni tiene por
 * que haber internet. Un kiosco puede estar sin conexion una semana entera y
 * seguir vendiendo.
 *
 * Sin una salida propia, un error de tipeo en la contrasena del asistente deja
 * al comercio afuera de sus propias ventas para siempre. Paso de verdad.
 *
 * La salida es un codigo que queda escrito en un archivo dentro de la carpeta
 * de datos del comercio. Para usarlo hay que poder abrir esa carpeta, o sea
 * tener acceso al Windows de la maquina.
 *
 * Eso no regala nada: quien puede leer ese archivo tambien puede abrir la base
 * de datos, que esta al lado, y reescribir la contrasena a mano. Lo que si
 * evita es que alguien que solo tiene la aplicacion abierta en el mostrador
 * —un empleado, un cliente que se acerca al monitor— pueda quedarse con la
 * cuenta del duenio.
 *
 * En la base se guarda solo el hash. El codigo en limpio vive unicamente en el
 * archivo, asi que el que se anota en un papel el dia de la instalacion sigue
 * sirviendo aunque despues el archivo se borre. Por eso nada rota el codigo
 * por su cuenta: rotarlo dejaria sin valor ese papel sin avisarle a nadie.
 */
class CodigoDeRecuperacion
{
    private const CLAVE_EN_AJUSTES = 'recovery_code_hash';

    private const NOMBRE_DEL_ARCHIVO = 'codigo-de-recuperacion.txt';

    /**
     * Alfabeto sin los caracteres que se confunden al copiarlos de un papel:
     * ni O ni 0, ni I ni 1, ni S ni 5.
     */
    private const ALFABETO = 'ABCDEFGHJKLMNPQRTUVWXYZ2346789';

    /**
     * Genera el codigo de la instalacion y devuelve el codigo en limpio, para
     * poder mostrarlo una unica vez en la pantalla final del asistente.
     *
     * Si ya hay uno guardado no lo toca y devuelve null: el codigo en limpio
     * no se puede recuperar del hash.
     */
    public function generarSiNoHay(): ?string
    {
        if ($this->hayCodigoGuardado()) {
            return null;
        }

        return $this->generarYGuardar();
    }

    /**
     * Genera uno nuevo a pedido, cuando la persona dice que no tiene el codigo.
     *
     * Es una accion explicita, nunca automatica: invalida el codigo anterior,
     * incluido el que este anotado en un papel.
     */
    public function regenerar(): string
    {
        return $this->generarYGuardar();
    }

    public function hayCodigoGuardado(): bool
    {
        $ajuste = Setting::where('meta_key', self::CLAVE_EN_AJUSTES)->first();

        return $ajuste !== null && $ajuste->meta_value !== '';
    }

    public function hayArchivo(): bool
    {
        return is_file($this->rutaDelArchivo());
    }

    /**
     * Si el codigo es el correcto.
     */
    public function verificar(string $codigo): bool
    {
        $ajuste = Setting::where('meta_key', self::CLAVE_EN_AJUSTES)->first();

        if (! $ajuste || $ajuste->meta_value === '') {
            return false;
        }

        return Hash::check($this->normalizar($codigo), $ajuste->meta_value);
    }

    /**
     * Cambia la contrasena del administrador.
     *
     * El codigo se renueva porque el que se acaba de usar pudo quedar a la
     * vista de cualquiera mientras se hacia esto.
     */
    public function restablecerLaContrasena(User $administrador, string $contrasena): void
    {
        $administrador->password = Hash::make($contrasena);
        $administrador->save();

        $this->generarYGuardar();
    }

    /**
     * La cuenta que se recupera: la del duenio del comercio.
     *
     * Es la que crea el asistente al instalar. Las de los empleados no hacen
     * falta aca: esas las restablece el administrador desde Usuarios, que es
     * mas simple y no requiere tocar ningun archivo.
     */
    public function administrador(): ?User
    {
        return User::where('is_active', 1)
            ->where('user_role', 'super-admin')
            ->orderBy('id')
            ->first();
    }

    /**
     * Donde queda el archivo, para poder mostrarselo a la persona.
     *
     * En el escritorio, storage_path() apunta adentro de la carpeta de datos
     * del comercio (%APPDATA%\kios\storage). El archivo va un nivel arriba, en
     * la raiz de esa carpeta, para que se vea apenas se la abre y no haya que
     * ir entrando en subcarpetas.
     */
    public function rutaDelArchivo(): string
    {
        return $this->carpetaDeDatos() . DIRECTORY_SEPARATOR . self::NOMBRE_DEL_ARCHIVO;
    }

    /** La carpeta que la persona tiene que abrir. */
    public function carpetaDeDatos(): string
    {
        return dirname(storage_path());
    }

    private function generarYGuardar(): string
    {
        $codigo = $this->generar();

        Setting::updateOrCreate(
            ['meta_key' => self::CLAVE_EN_AJUSTES],
            ['meta_value' => Hash::make($codigo)]
        );

        $this->escribirElArchivo($codigo);

        return $codigo;
    }

    private function generar(): string
    {
        $grupos = [];

        for ($g = 0; $g < 3; $g++) {
            $grupo = '';

            for ($i = 0; $i < 4; $i++) {
                $grupo .= self::ALFABETO[random_int(0, strlen(self::ALFABETO) - 1)];
            }

            $grupos[] = $grupo;
        }

        return implode('-', $grupos);
    }

    /**
     * Se compara sin distinguir mayusculas ni guiones: la persona lo esta
     * copiando de un papel o de un archivo de texto, y hacerla fallar por un
     * guion de menos no protege de nada.
     */
    private function normalizar(string $codigo): string
    {
        $limpio = strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $codigo));

        return implode('-', str_split($limpio, 4));
    }

    private function escribirElArchivo(string $codigo): void
    {
        $nombre = config('app.name');

        $texto = "CÓDIGO DE RECUPERACIÓN DE {$nombre}\r\n"
            . "========================================\r\n\r\n"
            . "    {$codigo}\r\n\r\n"
            . "¿Para qué sirve?\r\n\r\n"
            . "Si nadie recuerda la contraseña del administrador, este código\r\n"
            . "permite poner una nueva sin perder ningún dato.\r\n\r\n"
            . "¿Cómo se usa?\r\n\r\n"
            . "1. Abrí {$nombre}.\r\n"
            . "2. En la pantalla de acceso, tocá \"¿Olvidaste tu contraseña?\".\r\n"
            . "3. Escribí este código y elegí una contraseña nueva.\r\n\r\n"
            . "Anotalo en un papel y guardalo en otro lado. Si se rompe esta\r\n"
            . "computadora, este archivo se pierde con ella.\r\n\r\n"
            . "No lo compartas: quien tenga este código puede entrar como\r\n"
            . "administrador.\r\n";

        // Se escribe con BOM para que el Bloc de notas de Windows muestre bien
        // los acentos: sin el, lee el archivo como ANSI y aparecen sÃ­mbolos.
        @file_put_contents($this->rutaDelArchivo(), "\xEF\xBB\xBF" . $texto);
    }
}
