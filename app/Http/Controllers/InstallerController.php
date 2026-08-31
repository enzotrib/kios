<?php

namespace App\Http\Controllers;

use App\Services\InstallerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use DateTimeZone;

class InstallerController extends Controller
{
    protected $installer;

    public function __construct(InstallerService $installer)
    {
        $this->installer = $installer;
    }

    /**
     * Show welcome page
     */
    public function welcome()
    {
        if ($this->installer->isInstalled()) {
            return redirect('/login')->with('error', 'La aplicación ya está instalada.');
        }

        return view('installer.welcome');
    }

    /**
     * Show requirements page
     */
    public function requirements()
    {
        // En escritorio no hay servidor que revisar: PHP viaja dentro del
        // paquete y la base es un archivo. Chequear version de MySQL o
        // pdo_mysql aca deja al usuario trabado sin poder hacer nada.
        if ($this->installer->isDesktop()) {
            return redirect()->route('installer.settings');
        }

        try {
            $requirements = $this->installer->checkRequirements();
            return view('installer.requirements', compact('requirements'));
        } catch (\Exception $e) {
            return back()->with('error', 'No se pudieron verificar los requisitos: ' . $e->getMessage());
        }
    }

    /**
     * Show database configuration page
     */
    public function database()
    {
        // Con SQLite no hay nada que configurar en este paso: se saltea.
        // El guard tambien cubre a quien llegue por URL directa.
        if ($this->installer->usesSqlite()) {
            return redirect()->route('installer.settings');
        }

        return view('installer.database');
    }

    /**
     * Save DB credentials to .env (called when user clicks Next on step 3)
     */
    public function saveDatabase(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'host'     => 'required',
            'database' => 'required',
            'username' => 'required',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Verify connection is actually working before saving
        $test = $this->installer->testDatabaseConnection($request->all());
        if (!$test['success']) {
            return back()->with('db_error', $test['message'])->withInput();
        }

        try {
            $this->installer->writeDatabaseEnv([
                'db_host'     => $request->host,
                'db_port'     => $request->port ?? '3306',
                'db_database' => $request->database,
                'db_username' => $request->username,
                'db_password' => $request->password ?? '',
            ]);
        } catch (\Exception $e) {
            return back()->with('db_error', 'Failed to save database config: ' . $e->getMessage())->withInput();
        }

        return redirect()->route('installer.settings');
    }

    /**
     * Test database connection (AJAX)
     */
    public function testDatabase(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'database' => 'required',
                'host' => 'required',
                'username' => 'required',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Faltan datos o hay datos inválidos',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $result = $this->installer->testDatabaseConnection($request->all());
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Falló la prueba de conexión: ' . $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
    }

    /**
     * Show application settings page
     */
    public function settings()
    {
        try {
            $timezones = DateTimeZone::listIdentifiers();
            return view('installer.settings', compact('timezones'));
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to load settings: ' . $e->getMessage());
        }
    }

    /**
     * Save app settings to .env (called when user clicks Next on step 4)
     */
    public function saveSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'app_name'     => 'required|string|max:255',
            'app_url'      => 'required|url',
            'app_timezone' => 'required|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $this->installer->writeAppEnv([
                'app_name'     => $request->app_name,
                'app_url'      => $request->app_url,
                'app_timezone' => $request->app_timezone,
            ]);
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to save app settings: ' . $e->getMessage())->withInput();
        }

        return redirect()->route('installer.store');
    }

    /**
     * Show store and currency configuration page
     */
    public function store()
    {
        try {
            $defaultCurrency = config('installer.default_currency');
            return view('installer.store', compact('defaultCurrency'));
        } catch (\Exception $e) {
            return back()->with('error', 'Failed to load store settings: ' . $e->getMessage());
        }
    }

    /**
     * Show admin account creation page
     */
    public function admin()
    {
        return view('installer.admin');
    }

    /**
     * Show installation page
     */
    public function install()
    {
        return view('installer.install');
    }

    /**
     * Process installation
     */
    public function processInstallation(Request $request)
    {
        if ($this->installer->isInstalled()) {
            return redirect('/login')->with('error', 'La aplicación ya está instalada.');
        }

        // Validate request — DB and app settings are already in .env from earlier steps
        $validator = Validator::make($request->all(), [
            // Store
            'store_name' => 'required|string|max:255',
            'store_address' => 'required|string',
            'store_contact' => 'required|string|max:20',
            'sale_prefix' => 'required|string|max:10',

            // Currency
            'currency_symbol'     => 'required|string|max:10',
            'currency_code'       => 'required|string|max:10',
            'symbol_position'     => ['required', Rule::in(['before', 'after'])],
            'decimal_separator'   => ['required', Rule::in(['.', ','])],
            'thousands_separator' => ['required', Rule::in([',', '.', ' '])],
            'decimal_places'      => ['required', Rule::in(['0', '2', '3'])],
            'negative_format'     => ['required', Rule::in(['minus', 'parentheses'])],
            'show_currency_code'  => ['required', Rule::in(['yes', 'no'])],

            // Admin
            'admin_name' => 'required|string|max:255',
            'admin_username' => 'required|string|max:255|alpha_dash',
            'admin_email' => 'required|email|max:255',
            'admin_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            // Run installation — .env already written by database/settings steps
            $result = $this->installer->runInstallation([
                'store' => [
                    'name' => $request->store_name,
                    'address' => $request->store_address,
                    'contact_number' => $request->store_contact,
                    'sale_prefix' => $request->sale_prefix,
                ],
                'currency' => [
                    'currency_symbol' => $request->currency_symbol,
                    'currency_code' => $request->currency_code,
                    'symbol_position' => $request->symbol_position,
                    'decimal_separator' => $request->decimal_separator,
                    'thousands_separator' => $request->thousands_separator,
                    'decimal_places' => $request->decimal_places,
                    'negative_format' => $request->negative_format,
                    'show_currency_code' => $request->show_currency_code,
                ],
                'admin' => [
                    'name' => $request->admin_name,
                    'username' => $request->admin_username,
                    'email' => $request->admin_email,
                    'password' => $request->admin_password,
                ],
            ]);

            logger()->info('Installation completed successfully', [
                'admin_email' => $result['admin_email'] ?? null,
            ]);

            // Habilita la pantalla final para este navegador. Sin esta marca
            // el asistente ya esta cerrado: la aplicacion figura instalada.
            $request->session()->put(\App\Http\Middleware\SoloDuranteLaInstalacion::RECIEN_INSTALADO, true);

            return redirect()
                ->route('installer.complete')
                ->with('success', '¡La instalación terminó bien!')
                // El codigo de recuperacion se muestra una sola vez, aca. En la
                // base solo queda el hash; en limpio vive en un archivo dentro
                // de la carpeta de datos.
                ->with('codigo_de_recuperacion', $result['codigo_de_recuperacion'] ?? null);
        } catch (\Exception $e) {
            logger()->error('Installation: Failed during installation process', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()
                ->with('error', 'No se pudo instalar: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Show completion page
     */
    public function complete()
    {
        try {
            if (!$this->installer->isInstalled()) {
                return redirect()->route('installer.welcome');
            }

            return view('installer.complete', [
                'codigoDeRecuperacion' => session('codigo_de_recuperacion'),
                'carpetaDeDatos' => app(\App\Services\CodigoDeRecuperacion::class)->carpetaDeDatos(),
            ]);
        } catch (\Exception $e) {
            return back()->with('error', 'Installation verification failed: ' . $e->getMessage());
        }
    }
}
