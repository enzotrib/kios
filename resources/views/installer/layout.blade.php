<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/png" href="{{ asset('icon.png') }}">
    <title>{{ config('app.name') }} — Instalación · @yield('title')</title>

    {{-- Hoja de estilos y Alpine LOCALES, no por CDN: la aplicacion de
         escritorio tiene que poder instalarse sin internet. Con el CDN, un
         comercio con la conexion caida veia el asistente sin estilos y sin
         funcionar, porque Alpine es el que maneja los formularios. --}}
    <link rel="stylesheet" href="{{ asset('css/installer.css') }}">
    <script defer src="{{ asset('js/alpine.min.js') }}"></script>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="min-h-screen flex flex-col">
        <!-- Header -->
        <header class="bg-white border-b border-gray-200">
            <div class="max-w-4xl mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        {{-- El logo del comercio si ya lo cargo; si no, el de la app --}}
                        <img src="{{ asset('icon.png') }}" alt="{{ config('app.name') }}" class="kios-logo">
                        <h1 class="text-lg font-semibold text-gray-900">{{ config('app.name') }}</h1>
                    </div>
                    @php
                        // Pasos que se saltean segun el entorno:
                        //   escritorio -> requisitos (2) y base de datos (3)
                        //   web+sqlite -> solo base de datos (3)
                        $salteados = $esEscritorio ? [2, 3] : ($usaSqlite ? [3] : []);
                        $totalPasos = 8 - count($salteados);
                        $pasoDeclarado = (int) View::yieldContent('step');
                        $pasoVisible = $pasoDeclarado - count(array_filter($salteados, fn ($n) => $n < $pasoDeclarado));
                    @endphp
                    <span class="text-sm text-gray-500">Paso {{ $pasoVisible }} de {{ $totalPasos }}</span>
                </div>
            </div>
        </header>

        <!-- Progress Bar -->
        <div class="bg-white border-b border-gray-200">
            <div class="max-w-4xl mx-auto px-6">
                <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-600 transition-all duration-500" style="width: {{ ($pasoVisible / $totalPasos) * 100 }}%"></div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <main class="flex-1 py-12">
            <div class="max-w-4xl mx-auto px-6">
                @yield('content')
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-gray-200 py-6">
            <div class="max-w-4xl mx-auto px-6 text-center text-sm text-gray-500">
                <p>{{ config('app.name') }} · basado en InfoShop (MIT)</p>
            </div>
        </footer>
    </div>

    @yield('scripts')
</body>
</html>
