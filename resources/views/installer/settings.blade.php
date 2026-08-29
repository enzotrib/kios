@extends('installer.layout')

@section('title', 'Application Settings')
@section('step', '4')

@section('content')
<div x-data="settingsData()" class="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Configuración</h2>

    <form @submit.prevent="submitForm()" method="POST" action="{{ route('installer.settings.save') }}" id="settingsForm" class="space-y-6">
        @csrf
        <input type="hidden" name="app_name"     id="f_app_name">
        <input type="hidden" name="app_url"      id="f_app_url">
        <input type="hidden" name="app_timezone" id="f_app_timezone">
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre del comercio</label>
            <input type="text" x-model="app_name" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Kiosco San Martín">
            <p class="mt-1 text-sm text-gray-500">Así se va a llamar tu sistema</p>
        </div>

        {{-- En escritorio estas dos preguntas no tienen sentido y solo confunden:
             la aplicacion se sirve sola en un puerto local (app_url ya toma
             window.location.origin) y el entorno siempre es produccion. Un
             kiosquero no tiene por que saber que es un "entorno". --}}
        @unless($esEscritorio)
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Dirección del sistema</label>
            <input type="url" x-model="app_url" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://mikiosco.com">
            <p class="mt-1 text-sm text-gray-500">La dirección donde va a estar disponible el sistema</p>
        </div>

        <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Entorno</label>
            <select x-model="app_env" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="production">Producción</option>
                <option value="local">Desarrollo</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">Usá "Producción" salvo que estés probando</p>
        </div>
        @endunless

        <div class="relative" @click.away="open = false">
            <label class="block text-sm font-medium text-gray-700 mb-2">Zona horaria</label>
            <div class="relative">
                <input 
                    type="text" 
                    x-model="timezoneSearch"
                    @focus="open = true"
                    @input="open = true"
                    placeholder="Search timezone..."
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autocomplete="off"
                >
                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                </div>
            </div>
            
            <!-- Selected Timezone Display -->
            <div x-show="app_timezone && !open" class="mt-2 text-sm text-gray-600">
                Selected: <span class="font-medium text-gray-900" x-text="app_timezone"></span>
            </div>
            
            <!-- Dropdown List -->
            <div 
                x-show="open" 
                x-cloak
                class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
            >
                <template x-if="getFilteredTimezones().length === 0">
                    <div class="px-4 py-3 text-sm text-gray-500">No se encontró ninguna zona horaria</div>
                </template>
                <template x-for="timezone in getFilteredTimezones()" :key="timezone">
                    <div 
                        @click="selectTimezone(timezone)"
                        :class="app_timezone === timezone ? 'bg-blue-50 text-blue-700' : 'text-gray-900 hover:bg-gray-100'"
                        class="px-4 py-2 cursor-pointer text-sm"
                        x-text="timezone"
                    ></div>
                </template>
            </div>
            
            <p class="mt-1 text-sm text-gray-500">Buscá y elegí tu zona horaria</p>
        </div>

        <div class="flex justify-between mt-8">
            <a href="{{ $esEscritorio ? route('installer.welcome') : ($usaSqlite ? route('installer.requirements') : route('installer.database')) }}" class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                <svg class="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
                </svg>
                Back
            </a>
            
            <button type="submit" class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition">
                Next
                <svg class="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                </svg>
            </button>
        </div>
    </form>
</div>

<script>
function settingsData() {
    return {
        app_name: '',
        app_url: window.location.origin,
        app_env: 'production',
        app_timezone: 'America/Argentina/Buenos_Aires',
        timezoneSearch: '',
        open: false,
        timezones: @json($timezones),
        
        init() {
            this.app_name = sessionStorage.getItem('app_name') || '';
            this.app_url = sessionStorage.getItem('app_url') || window.location.origin;
            this.app_env = sessionStorage.getItem('app_env') || 'production';
            this.app_timezone = sessionStorage.getItem('app_timezone') || 'America/Argentina/Buenos_Aires';
        },
        
        getFilteredTimezones() {
            if (!this.timezoneSearch) return this.timezones;
            return this.timezones.filter(tz => 
                tz.toLowerCase().includes(this.timezoneSearch.toLowerCase())
            );
        },
        
        selectTimezone(timezone) {
            this.app_timezone = timezone;
            this.timezoneSearch = '';
            this.open = false;
        },
        
        submitForm() {
            // Also keep in sessionStorage for back-navigation UX
            sessionStorage.setItem('app_name',     this.app_name);
            sessionStorage.setItem('app_url',      this.app_url);
            sessionStorage.setItem('app_env',      this.app_env);
            sessionStorage.setItem('app_timezone', this.app_timezone);

            // Populate hidden fields and submit real form to write .env
            document.getElementById('f_app_name').value     = this.app_name;
            document.getElementById('f_app_url').value      = this.app_url;
            document.getElementById('f_app_timezone').value = this.app_timezone;
            document.getElementById('settingsForm').submit();
        }
    }
}
</script>
@endsection
