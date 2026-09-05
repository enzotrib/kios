<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): string|null
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    /** Devuelve la URL publica de una imagen solo si el archivo esta en el disco. */
    private function urlDeImagenSiExiste(?string $ruta): ?string
    {
        if (!$ruta) {
            return null;
        }

        $relativa = ltrim($ruta, '/');

        return is_file(public_path($relativa)) ? asset($relativa) : null;
    }

    public function share(Request $request): array
    {
        $permissions = collect();
        if ($request->user()) {
            $user = $request->user();
            // Si el rol fue renombrado o borrado, users.user_role queda apuntando
            // a la nada. Sin este guard, ->permissions sobre null tira un 500 en
            // TODAS las paginas y el usuario no puede ni entrar a arreglarlo.
            $role = Role::where('name', $user->user_role)->first();
            $permissions = $role?->permissions ?? collect();
        }

        try {
            $shopNameMeta = Setting::where('meta_key', 'shop_name')->first();
            $currencySettingsMeta = Setting::where('meta_key', 'currency_settings')->first();

            // Parse currency settings JSON or use defaults
            $currencySettings = [];
            if ($currencySettingsMeta) {
                try {
                    $currencySettings = json_decode($currencySettingsMeta->meta_value, true) ?? [];
                } catch (\Exception $e) {
                    $currencySettings = [];
                }
            }

            $modules = Setting::getModules();
            $shopName = $shopNameMeta->meta_value ?? 'InfoShop';

            // El logo se guarda como ruta relativa ("storage/uploads/..."). Se
            // convierte a URL absoluta con asset() porque una ruta relativa se
            // resuelve contra la URL de la pagina y se rompe en rutas anidadas
            // como /products/edit/5.
            $shopLogoMeta = Setting::where('meta_key', 'shop_logo')->value('meta_value');
            $shopLogoLightMeta = Setting::where('meta_key', 'shop_logo_light')->value('meta_value');
            // Solo se comparte la ruta si el archivo EXISTE. Si no, se manda
            // null y el componente cae en el logo empaquetado, en vez de
            // dibujar una imagen rota. Pasaba en toda instalacion nueva: el
            // valor por defecto apuntaba a un archivo que ya no esta.
            $shopLogo = $this->urlDeImagenSiExiste($shopLogoMeta);
            $shopLogoLight = $this->urlDeImagenSiExiste($shopLogoLightMeta);
        } catch (\Exception $e) {
            // If settings table doesn't exist, use defaults
            $currencySettings = [];
            $modules = [];
            $shopName = 'InfoShop';
            $shopLogo = null;
            $shopLogoLight = null;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'settings'=>[
                'shop_name'=> $shopName ?? 'InfoShop',
                'shop_logo'=> $shopLogo ?? null,
                'shop_logo_light'=> $shopLogoLight ?? null,
                'currency_settings'=>$currencySettings,
            ],
            'modules'=> $modules ?? [],
            'userPermissions'=>$permissions->pluck('name'),
            'locale'=> app()->getLocale(),

            // Hay pantallas que solo tienen sentido en el paquete de
            // escritorio: elegir la impresora del ticket, por ejemplo. En la
            // web esas opciones no se muestran.
            'esEscritorio' => app(\App\Services\InstallerService::class)->isDesktop(),

            // Los avisos de una accion que termino en otra pagina: vaciar la
            // cache, cerrar el asistente, etc. Sin esto, un `->with('success')`
            // se escribia en la sesion y no lo leia nadie.
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
