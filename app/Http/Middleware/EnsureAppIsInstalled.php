<?php

namespace App\Http\Middleware;

use App\Services\InstallerService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Manda al asistente de instalacion cuando la aplicacion todavia no fue
 * instalada.
 *
 * Sin esto, una instalacion nueva abre en /login y no hay forma de entrar:
 * no existe ningun usuario y nadie conoce una contrasena. En la version web
 * se sale escribiendo /install en la barra de direcciones, pero en la
 * aplicacion de escritorio no hay barra de direcciones, asi que el usuario
 * queda encerrado en una pantalla de acceso imposible.
 */
class EnsureAppIsInstalled
{
    /** Rutas que tienen que seguir funcionando durante la instalacion. */
    private const PERMITIDAS = [
        'install',
        'install/*',
        'build/*',      // assets compilados por Vite
        'storage/*',
        'css/*',
        'js/*',
        'favicon.ico',
        'robots.txt',
        '_debugbar/*',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isMethod('GET') && !$request->is(self::PERMITIDAS)) {
            // isInstalled() ya atrapa la excepcion de "no hay base de datos"
            // y devuelve false, que es justo lo que corresponde en ese caso.
            if (!app(InstallerService::class)->isInstalled()) {
                return redirect()->route('installer.welcome');
            }
        }

        return $next($request);
    }
}
