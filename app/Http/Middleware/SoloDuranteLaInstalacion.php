<?php

namespace App\Http\Middleware;

use App\Services\InstallerService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cierra el asistente de instalacion una vez que la aplicacion esta instalada.
 *
 * El asistente no pide credenciales —no puede: se usa justamente cuando
 * todavia no hay ningun usuario—, asi que cada una de sus rutas es publica.
 * Terminada la instalacion siguen abiertas, y varias escriben en el .env sin
 * preguntarle nada a nadie. La mas grave es /install/database/save: cualquiera
 * que llegue al dominio de un comercio ya instalado puede apuntar la
 * aplicacion a una base de datos suya y quedarse con el sistema entero.
 * /install/database/test es mas leve pero deja usar el servidor del comercio
 * para probar credenciales contra cualquier otro host.
 *
 * Proteger metodo por metodo dentro del controlador ya se estaba haciendo, y
 * asi fue como quedaron sin cubrir cuatro de trece. Por eso el corte va acá,
 * sobre el grupo completo de rutas: agregar una ruta nueva al asistente no
 * puede volver a abrir un agujero por olvido.
 *
 * La unica excepcion es la pantalla final, que por definicion se muestra
 * cuando la instalacion ya termino. Se habilita con una marca en la sesion
 * que deja el propio proceso de instalacion, asi la ve el navegador que
 * acaba de instalar y nadie mas.
 */
class SoloDuranteLaInstalacion
{
    /** Marca de sesion que habilita la pantalla final. */
    public const RECIEN_INSTALADO = 'instalacion.recien_terminada';

    public function handle(Request $request, Closure $next): Response
    {
        if (! app(InstallerService::class)->isInstalled()) {
            return $next($request);
        }

        if ($request->routeIs('installer.complete') && $request->session()->get(self::RECIEN_INSTALADO)) {
            return $next($request);
        }

        return redirect('/login')->with('error', 'La aplicación ya está instalada.');
    }
}
