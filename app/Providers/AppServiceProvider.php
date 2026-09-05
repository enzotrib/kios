<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Opcodes\LogViewer\Facades\LogViewer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\Facades\View;
use App\Models\Setting;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->asegurarClavePropiaDeCadaInstalacion();
    }

    /**
     * El duenio del comercio puede entrar a todo.
     *
     * El menu de la izquierda ya lo trataba asi: `canAccess()` deja pasar al
     * super-admin sin mirar la lista de permisos. El backend no, y ahi estaba
     * la contradiccion: el menu mostraba "Registro de actividad" y al tocarlo
     * saltaba un 403. La lista de permisos que escribe el asistente no incluia
     * `activity-log`, asi que en una instalacion de verdad ni el duenio lo
     * tenia.
     *
     * Agregar el permiso que faltaba arregla ese caso; esto arregla la clase
     * entera. Cualquier permiso que se agregue de aca en adelante lo tiene el
     * duenio desde el primer dia, sin depender de que alguien se acuerde de
     * sumarlo a la lista del instalador ni de correr una migracion en las
     * instalaciones que ya estan andando.
     *
     * Devolver null —no false— es lo que deja que el resto de los usuarios
     * sigan pasando por la verificacion normal de permisos.
     */
    private function elDuenioPuedeTodo(): void
    {
        Gate::before(function ($user) {
            return $user->user_role === 'super-admin' ? true : null;
        });
    }

    /**
     * La hora del comercio, la misma en cada arranque.
     *
     * El asistente pregunta la zona horaria y la escribe en APP_TIMEZONE, en
     * el .env. El problema es donde vive ese archivo: adentro de la carpeta del
     * programa, que el instalador reemplaza entera en cada actualizacion. La
     * zona horaria elegida se pierde y la aplicacion vuelve a UTC.
     *
     * Con UTC, en Argentina, "hoy" cambia a las nueve de la noche. Un kiosco
     * que sigue vendiendo despues de esa hora ve esas ventas contadas en el dia
     * siguiente: la caja del dia no cierra y las ventas parecen no estar.
     *
     * Por eso la zona horaria tambien se guarda en la tabla de ajustes, que
     * vive en la carpeta de datos y no se toca al actualizar, y se aplica al
     * arrancar. `config()` sola no alcanza: Carbon y las funciones de fecha de
     * PHP leen la zona horaria del proceso, que ya quedo fijada al arrancar el
     * framework.
     */
    private function aplicarLaZonaHorariaDelComercio(): void
    {
        try {
            if (! Schema::hasTable('settings')) {
                return;
            }

            $zona = Setting::where('meta_key', 'app_timezone')->value('meta_value');

            if (! $zona || ! in_array($zona, timezone_identifiers_list(), true)) {
                return;
            }

            Config::set('app.timezone', $zona);
            date_default_timezone_set($zona);
        } catch (\Throwable $e) {
            // Antes de que exista la tabla —durante la instalacion— se sigue
            // con la zona horaria del .env, que es lo que habia hasta ahora.
        }
    }

    /**
     * Cada instalacion tiene que tener su propia clave de cifrado.
     *
     * El paquete de escritorio se descarga: si la clave viajara adentro,
     * todas las copias del mundo compartirian la misma, y cualquiera que
     * abra el instalador —o el repositorio, que es publico— podria firmar
     * cookies de sesion validas para cualquier otra instalacion. Por eso la
     * clave se saco del .env que se empaqueta (ver cleanup_env_keys) y se
     * genera aca, la primera vez que arranca en la maquina del comercio.
     *
     * Se guarda junto a la base de datos, en la carpeta de datos del usuario,
     * que es la unica que la aplicacion tiene garantizado poder escribir: la
     * carpeta del programa puede ser de solo lectura.
     *
     * En la web no hace nada: ahi la clave la escribe el asistente en el .env
     * y este metodo sale en la primera linea.
     */
    private function asegurarClavePropiaDeCadaInstalacion(): void
    {
        if (! empty(config('app.key'))) {
            return;
        }

        try {
            $archivo = storage_path('app/clave-de-aplicacion');

            if (is_file($archivo)) {
                $clave = trim((string) file_get_contents($archivo));
            } else {
                $clave = 'base64:' . base64_encode(random_bytes(32));

                if (! is_dir(dirname($archivo))) {
                    mkdir(dirname($archivo), 0755, true);
                }

                file_put_contents($archivo, $clave);
                @chmod($archivo, 0600);
            }

            if ($clave !== '') {
                config(['app.key' => $clave]);
            }
        } catch (\Throwable $e) {
            // Sin clave la aplicacion no puede cifrar sesiones y Laravel corta
            // con su propio mensaje, que es mas claro que cualquier cosa que
            // se pueda hacer desde aca. No se enmascara el problema.
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        $this->elDuenioPuedeTodo();
        $this->aplicarLaZonaHorariaDelComercio();

        // Initialize analytics tracking
        // Las vistas del asistente necesitan saber si la base es SQLite para
        // saltear el paso de credenciales. La decision vive en el servicio;
        // aca solo se comparte con las vistas.
        View::composer('installer.*', function ($view) {
            $instalador = app(\App\Services\InstallerService::class);
            $view->with([
                'usaSqlite' => $instalador->usesSqlite(),
                'esEscritorio' => $instalador->isDesktop(),
            ]);
        });

        Blade::directive('init', function () {
            return config('init');
        });

        LogViewer::auth(function ($request) {
            /** @var \App\Models\User */
            $user = Auth::user();
            return $user && $user->hasRole('super-admin');
        });

        // Load mail settings from database (if table exists)
        // Skip during console commands and if table doesn't exist yet
        try {
            if (!App::runningInConsole() && Schema::hasTable('settings')) {
                $mailSetting = Setting::where('meta_key', 'mail_settings')->first();

                if ($mailSetting) {
                    $mailSettings = json_decode($mailSetting->meta_value);
                    Config::set(['mail.driver' => 'smtp']);
                    Config::set(['mail.host' => $mailSettings->mail_host]);
                    Config::set(['mail.port' => $mailSettings->mail_port]);
                    Config::set(['mail.username' => $mailSettings->mail_username]);
                    Config::set(['mail.password' => $mailSettings->mail_password]);
                    Config::set(['mail.encryption' => $mailSettings->mail_encryption]);
                    Config::set(['mail.from.address' => $mailSettings->mail_from_address]);
                    Config::set(['mail.from.name' => $mailSettings->mail_from_name]);
                }
            }
        } catch (\Exception $e) {
            // Silently fail if settings table doesn't exist (e.g., during fresh installation)
            \Illuminate\Support\Facades\Log::debug('Settings table not available: ' . $e->getMessage());
        }
    }
}
