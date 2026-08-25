<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        @php($appIcon = \App\Models\Setting::where('meta_key', 'app_icon')->value('meta_value') ?: 'Infoshop-icon.png')
        {{-- El tipo se declara segun la extension real: antes decia image/x-icon
             para un PNG. El ?v= evita que el navegador se quede con el favicon
             anterior, que se cachea por dias. --}}
        <link rel="icon"
              type="image/{{ pathinfo($appIcon, PATHINFO_EXTENSION) === 'png' ? 'png' : 'jpeg' }}"
              href="{{ asset($appIcon) }}?v={{ substr(md5($appIcon), 0, 8) }}">
        <title inertia>{{ config('app.name', 'InfoShop') }}</title>
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />

        {{-- Aplica el tema antes del primer pintado para que no haya un flash blanco
             al entrar en modo oscuro. Debe correr antes del CSS y del JS de la app. --}}
        <script>
            (function () {
                try {
                    var saved = localStorage.getItem('infoshop-theme');
                    var dark = saved
                        ? saved === 'dark'
                        : window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (dark) document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
                } catch (e) {}
            })();
        </script>

        <!-- Scripts -->
        @init
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead

        <link rel="stylesheet" href="{{ asset('css/custom.css') }}">
    </head>
    <body class="font-sans antialiased">
        @inertia
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/numeral.js/1.0.3/numeral.min.js"></script>
    </body>
</html>
