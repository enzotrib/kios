<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        $version = config('version.version');
        // A donde manda "Olvidaste tu contrasena". En el escritorio no puede
        // ser el envio por correo: no hay correo configurado —el mensaje se
        // escribe en un archivo de registro— ni tiene por que haber internet.
        // Ahi se recupera con el codigo que quedo en la carpeta de datos.
        $esEscritorio = app(\App\Services\InstallerService::class)->isDesktop();

        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'rutaDeRecuperacion' => $esEscritorio
                ? route('recuperacion.formulario')
                : route('password.request'),
            'status' => session('status'),
            'version'=>$version,
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        return redirect(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
