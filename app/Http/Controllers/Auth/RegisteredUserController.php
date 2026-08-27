<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // user_name es NOT NULL UNIQUE en la tabla users, pero el registro no lo
        // pedia ni lo generaba: cualquier alta desde /register fallaba con un
        // error de base de datos. Se deriva del correo y se le agrega un sufijo
        // si ya existe.
        $baseUserName = Str::slug(Str::before($request->email, '@'), '_') ?: 'usuario';
        $userName = $baseUserName;
        $sufijo = 1;
        while (User::where('user_name', $userName)->exists()) {
            $userName = $baseUserName . '_' . $sufijo++;
        }

        $user = User::create([
            'name' => $request->name,
            'user_name' => $userName,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }
}
