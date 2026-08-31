<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\CodigoDeRecuperacion;
use App\Services\InstallerService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Recuperar el acceso sin correo y sin internet.
 *
 * Solo existe en el paquete de escritorio. En la web sigue andando el envio
 * del enlace por correo, que es lo correcto ahi: el servidor si tiene salida a
 * internet y la carpeta de datos no esta al alcance de quien usa el sistema.
 */
class RecuperarAccesoController extends Controller
{
    public function __construct(
        private CodigoDeRecuperacion $codigos,
        private InstallerService $instalador,
    ) {
    }

    public function formulario(): Response|RedirectResponse
    {
        if (! $this->instalador->isDesktop()) {
            return redirect()->route('password.request');
        }

        // Una instalacion anterior a esta funcion no tiene ningun codigo. No
        // puede quedarse sin salida por haberse instalado antes, asi que se le
        // genera uno ahora. No pisa nada: solo entra aca si no habia.
        $this->codigos->generarSiNoHay();

        return Inertia::render('Auth/RecuperarAcceso', [
            'carpeta' => $this->codigos->carpetaDeDatos(),
            'archivo' => basename($this->codigos->rutaDelArchivo()),
            'hayArchivo' => $this->codigos->hayArchivo(),
            'estado' => session('status'),
        ]);
    }

    /**
     * Genera un codigo nuevo cuando la persona no encuentra el archivo.
     *
     * Va aparte y a pedido porque invalida el codigo anterior, incluido el que
     * este anotado en un papel. Que eso pase tiene que ser una decision, no un
     * efecto de haber abierto una pantalla.
     */
    public function regenerar(): RedirectResponse
    {
        if (! $this->instalador->isDesktop()) {
            abort(404);
        }

        $this->codigos->regenerar();

        return back()->with('status', 'Listo. Escribimos un código nuevo en el archivo. El código anterior ya no sirve.');
    }

    public function restablecer(Request $request): RedirectResponse
    {
        if (! $this->instalador->isDesktop()) {
            abort(404);
        }

        $request->validate([
            'codigo' => ['required', 'string'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        if (! $this->codigos->verificar($request->codigo)) {
            throw ValidationException::withMessages([
                'codigo' => 'Ese código no es el correcto. Fijate que sea el que dice el archivo.',
            ]);
        }

        $administrador = $this->codigos->administrador();

        if (! $administrador) {
            throw ValidationException::withMessages([
                'codigo' => 'No hay ninguna cuenta de administrador para recuperar.',
            ]);
        }

        $this->codigos->restablecerLaContrasena($administrador, $request->password);

        // Se entra directo: la persona acaba de demostrar que tiene acceso a la
        // computadora y acaba de elegir la contrasena. Mandarla al login a
        // escribirla de nuevo no agrega nada.
        Auth::login($administrador);
        $request->session()->regenerate();

        return redirect(route('dashboard', absolute: false));
    }
}
