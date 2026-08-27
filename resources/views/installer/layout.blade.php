<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" type="image/x-icon" href="{{ asset('infoshop-icon.png') }}">
    <title>InfoShop Installer - @yield('title')</title>
    
    <script src="https://cdn.tailwindcss.com"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
    
    <style>
        [x-cloak] { display: none !important; }
        body { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
    </style>
</head>
<body class="bg-gray-50 min-h-screen">
    <div class="min-h-screen flex flex-col">
        <!-- Header -->
        <header class="bg-white border-b border-gray-200">
            <div class="max-w-4xl mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-900">InfoShop Installation</h1>
                    @php
                        // Con SQLite se saltea el paso de base de datos (el 3),
                        // asi que el asistente tiene 7 pasos y los posteriores
                        // se corren uno hacia atras.
                        $sqlite = config('database.default') === 'sqlite';
                        $totalPasos = $sqlite ? 7 : 8;
                        $pasoDeclarado = (int) View::yieldContent('step');
                        $pasoVisible = $sqlite && $pasoDeclarado > 3 ? $pasoDeclarado - 1 : $pasoDeclarado;
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
                <p>&copy; {{ date('Y') }} InfoShop. All rights reserved.</p>
            </div>
        </footer>
    </div>

    @yield('scripts')
</body>
</html>
