@extends('installer.layout')

@section('title', 'Instalación terminada')
@section('step', '8')

@section('content')
<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
    <div class="mb-8">
        <div class="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 mb-2">¡Listo!</h2>
        <p class="text-gray-600">{{ config('app.name') }} quedó instalado y configurado.</p>
    </div>

    <div class="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-left">
        <h3 class="text-lg font-semibold text-green-900 mb-3">¿Y después?</h3>
        <ul class="space-y-2 text-sm text-green-800">
            <li class="flex items-start">
                <svg class="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Entrá con el usuario que acabás de crear</span>
            </li>
            <li class="flex items-start">
                <svg class="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>Configurá tu comercio y empezá a vender</span>
            </li>
            <li class="flex items-start">
                <svg class="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <span>¡Cargá tus productos y empezá a vender!</span>
            </li>
        </ul>
    </div>

    @if ($codigoDeRecuperacion)
    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-left">
        <h3 class="text-sm font-semibold text-yellow-800 mb-2">Anotá este código y guardalo</h3>

        <p class="text-3xl font-bold text-center text-gray-900 py-4">{{ $codigoDeRecuperacion }}</p>

        <p class="text-sm text-yellow-700">
            Es la única forma de volver a entrar si nadie recuerda la contraseña.
            No se manda por correo: esta aplicación funciona sin internet.
        </p>
        <p class="mt-2 text-sm text-yellow-700">
            Ya lo dejamos escrito en el archivo
            <code class="bg-yellow-100 px-1 rounded">codigo-de-recuperacion.txt</code>,
            en esta computadora. Igual conviene anotarlo en un papel: si se rompe
            la computadora, el archivo se pierde con ella.
        </p>
    </div>
    @endif

    <a href="/login" class="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition shadow-lg">
        Entrar a {{ config('app.name') }}
        <svg class="ml-2 -mr-1 w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
        </svg>
    </a>

    <p class="mt-8 text-sm text-gray-500">
        ¡Gracias por elegir {{ config('app.name') }}!
    </p>
</div>
@endsection
