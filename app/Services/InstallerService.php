<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Store;
use App\Models\Contact;
use App\Models\Setting;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Exception;

class InstallerService
{
    /**
     * Check server requirements
     */
    public function checkRequirements(): array
    {
        $requirements = config('installer.requirements');
        $results = [];

        // Check PHP version
        $currentPhpVersion = PHP_VERSION;
        $requiredPhpVersion = $requirements['php_version'];
        $results['php'] = [
            'name' => 'PHP Version',
            'required' => '>= ' . $requiredPhpVersion,
            'current' => $currentPhpVersion,
            'status' => version_compare($currentPhpVersion, $requiredPhpVersion, '>='),
        ];

        // Check PHP extensions
        foreach ($requirements['extensions'] as $extension) {
            $results['extensions'][$extension] = [
                'name' => $extension,
                'status' => extension_loaded($extension),
            ];
        }

        // Check MySQL version (best-effort — may not be connectable before DB setup)
        $requiredMysqlVersion = $requirements['mysql_version'] ?? '8.0';
        $mysqlVersion = null;
        if (extension_loaded('pdo_mysql')) {
            try {
                $pdo = new \PDO('mysql:host=127.0.0.1', '', '', [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_SILENT]);
                $mysqlVersion = $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION);
            } catch (\Exception $e) {
                $mysqlVersion = null;
            }
        }
        $results['mysql'] = [
            'name'     => 'MySQL Version',
            'required' => '>= ' . $requiredMysqlVersion,
            'current'  => $mysqlVersion ?? 'Not connected yet — verified during DB setup',
            'status'   => $mysqlVersion
                ? version_compare(preg_replace('/[^0-9.].*/', '', $mysqlVersion), $requiredMysqlVersion, '>=')
                : null,
        ];

        // Check folder permissions
        $permissions = config('installer.permissions');
        foreach ($permissions as $folder => $permission) {
            $path = base_path($folder);
            $results['permissions'][$folder] = [
                'name' => $folder,
                'required' => $permission,
                'status' => is_writable($path),
            ];
        }

        return $results;
    }

    /**
     * Test database connection
     */
    public function testDatabaseConnection(array $credentials): array
    {
        try {
            $host     = $credentials['host']     ?? 'localhost';
            $port     = $credentials['port']     ?? '3306';
            $database = $credentials['database'];
            $username = $credentials['username'];
            $password = $credentials['password'] ?? '';

            $dsn = "mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4";
            $pdo = new \PDO($dsn, $username, $password);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);

            // Verify MySQL version
            $mysqlVersion     = $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION);
            $requiredVersion  = config('installer.requirements.mysql_version', '8.0');
            $cleanVersion     = preg_replace('/[^0-9.].*/', '', $mysqlVersion);
            if (!version_compare($cleanVersion, $requiredVersion, '>=')) {
                return [
                    'success' => false,
                    'message' => "MySQL {$requiredVersion}+ required. Your version: {$mysqlVersion}",
                ];
            }

            // Check InnoDB is available
            $stmt   = $pdo->query('SHOW ENGINES');
            $engines = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            $innodb = collect($engines)->contains(
                fn ($e) => strtolower($e['Engine']) === 'innodb'
                        && in_array(strtolower($e['Support']), ['yes', 'default'])
            );

            if (!$innodb) {
                return [
                    'success' => false,
                    'message' => 'InnoDB storage engine is not available. InnoDB is required.',
                ];
            }

            return [
                'success' => true,
                'message' => "Connected! MySQL {$mysqlVersion} with InnoDB.",
            ];
        } catch (Exception $e) {
            return [
                'success' => false,
                'message' => 'Connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Step 3 — Write DB credentials to .env and reload the running process.
     * Called when user clicks "Next" on the Database step.
     */
    public function writeDatabaseEnv(array $data): void
    {
        $envPath        = base_path('.env');
        $envExamplePath = base_path('.env.example');

        if (!File::exists($envPath) && File::exists($envExamplePath)) {
            File::copy($envExamplePath, $envPath);
        }

        $envContent = File::exists($envPath) ? File::get($envPath) : '';
        $envContent = $this->setEnvValue($envContent, 'DB_CONNECTION', 'mysql');
        $envContent = $this->setEnvValue($envContent, 'DB_HOST',       $data['db_host']);
        $envContent = $this->setEnvValue($envContent, 'DB_PORT',       $data['db_port'] ?? '3306');
        $envContent = $this->setEnvValue($envContent, 'DB_DATABASE',   $data['db_database']);
        $envContent = $this->setEnvValue($envContent, 'DB_USERNAME',   $data['db_username']);
        $envContent = $this->setEnvValue($envContent, 'DB_PASSWORD',   $data['db_password'] ?? '');
        $envContent = $this->setEnvValue($envContent, 'DB_ENGINE',     'InnoDB');
        File::put($envPath, $envContent);

        // Clear cached config file immediately after writing .env
        $configCachePath = base_path('bootstrap/cache/config.php');
        if (File::exists($configCachePath)) {
            File::delete($configCachePath);
        }

        if (strpos($envContent, 'APP_KEY=base64:') === false) {
            Artisan::call('key:generate', ['--force' => true]);
        }

        // Update in-memory config + OS env so the current process uses the new DB
        config([
            'database.default'                          => 'mysql',
            'database.connections.mysql.host'           => $data['db_host'],
            'database.connections.mysql.port'           => $data['db_port'] ?? '3306',
            'database.connections.mysql.database'       => $data['db_database'],
            'database.connections.mysql.username'       => $data['db_username'],
            'database.connections.mysql.password'       => $data['db_password'] ?? '',
            'database.connections.mysql.charset'        => 'utf8mb4',
            'database.connections.mysql.collation'      => 'utf8mb4_unicode_ci',
            'database.connections.mysql.prefix'         => '',
            'database.connections.mysql.prefix_indexes' => true,
            'database.connections.mysql.strict'         => true,
            'database.connections.mysql.engine'         => 'InnoDB',
        ]);

        DB::purge('mysql');
        DB::setDefaultConnection('mysql');

        foreach ([
            'DB_CONNECTION' => 'mysql',
            'DB_HOST'       => $data['db_host'],
            'DB_PORT'       => $data['db_port'] ?? '3306',
            'DB_DATABASE'   => $data['db_database'],
            'DB_USERNAME'   => $data['db_username'],
            'DB_PASSWORD'   => $data['db_password'] ?? '',
        ] as $key => $value) {
            putenv("{$key}={$value}");
            $_ENV[$key] = $_SERVER[$key] = $value;
        }
    }

    /**
     * Step 4 — Write app settings (name, URL, timezone) to .env.
     * Called when user clicks "Next" on the Settings step.
     */
    public function writeAppEnv(array $data): void
    {
        $envPath    = base_path('.env');
        $envContent = File::exists($envPath) ? File::get($envPath) : '';
        $envContent = $this->setEnvValue($envContent, 'APP_NAME',     $data['app_name']     ?? 'InfoShop');
        $envContent = $this->setEnvValue($envContent, 'APP_URL',      $data['app_url']      ?? 'http://localhost');
        $envContent = $this->setEnvValue($envContent, 'APP_TIMEZONE', $data['app_timezone'] ?? 'UTC');
        File::put($envPath, $envContent);

        // Clear cached config file immediately after writing .env
        $configCachePath = base_path('bootstrap/cache/config.php');
        if (File::exists($configCachePath)) {
            File::delete($configCachePath);
        }

        config([
            'app.name'     => $data['app_name'],
            'app.url'      => $data['app_url'],
            'app.timezone' => $data['app_timezone'],
        ]);
    }

    /**
     * Finalize installation with storage link and cache clears
     */
    private function finalizeInstallation(): void
    {
        try {
            // Mark as installed first, before artisan calls
            DB::table('settings')->insert([
                'meta_key'   => 'installed_at',
                'meta_value' => now()->toDateTimeString(),
            ]);

            // Create storage link (non-critical, wrapped in try-catch)
            try {
                Artisan::call('storage:link', ['--no-interaction' => true]);
            } catch (Exception $e) {
                logger()->warning('Failed to create storage link: ' . $e->getMessage());
            }

            // Clear cache with --no-interaction to prevent hanging
            Artisan::call('cache:clear', ['--no-interaction' => true]);
            Artisan::call('config:clear', ['--no-interaction' => true]);
            Artisan::call('route:clear', ['--no-interaction' => true]);
            Artisan::call('view:clear', ['--no-interaction' => true]);
        } catch (Exception $e) {
            // Non-critical error, log it but don't fail installation
            logger()->warning('Failed to finalize installation: ' . $e->getMessage());
        }
    }


    /**
     * Set environment variable value
     */
    private function setEnvValue(string $envContent, string $key, ?string $value): string
    {
        // Handle null values
        if ($value === null) {
            $value = '';
        }

        $escaped = str_replace('"', '\"', $value);
        $pattern = "/^{$key}=.*/m";

        if (preg_match($pattern, $envContent)) {
            return preg_replace($pattern, "{$key}=\"{$escaped}\"", $envContent);
        }

        return $envContent . "\n{$key}=\"{$escaped}\"";
    }

    /**
     * Whether the app is configured to use SQLite.
     *
     * Con SQLite no hay servidor de base de datos: no hay credenciales que
     * pedir ni conexion que probar, asi que el asistente saltea ese paso.
     */
    /**
     * Si la aplicacion corre empaquetada como app de escritorio.
     *
     * NativePHP reescribe la conexion por defecto a 'nativephp' al arrancar,
     * y publica su config interna. Es la senal mas confiable sin depender de
     * variables de entorno, que pueden no viajar dentro del paquete.
     *
     * En escritorio no hay servidor que revisar: PHP viaja adentro, no hay
     * MySQL, y los permisos de carpeta los resuelve el instalador de Windows.
     * Por eso el asistente saltea los pasos de requisitos y base de datos.
     */
    public function isDesktop(): bool
    {
        // Solo la conexion por defecto sirve como senal: la config
        // 'nativephp-internal' tambien existe en desarrollo por tener el
        // paquete instalado, y daba falso positivo en la version web.
        return config('database.default') === 'nativephp';
    }

    public function usesSqlite(): bool
    {
        $conexion = config('database.default');

        return config("database.connections.{$conexion}.driver") === 'sqlite';
    }

    /**
     * Run installation process
     */
    /**
     * Ruta del archivo SQLite de la conexion ACTIVA.
     *
     * Se lee de la conexion por defecto y no de una llamada "sqlite": dentro
     * del paquete de escritorio NativePHP crea una propia llamada 'nativephp',
     * asi que mirar un nombre fijo apuntaba al archivo equivocado.
     */
    private function sqlitePath(): ?string
    {
        if (!$this->usesSqlite()) {
            return null;
        }

        $conexion = config('database.default');
        $ruta = config("database.connections.{$conexion}.database");

        return ($ruta && $ruta !== ':memory:') ? $ruta : null;
    }

    /**
     * Deja el archivo SQLite en condiciones de recibir la instalacion.
     *
     * Hace dos cosas:
     *
     * 1. Lo crea si falta. SQLite no lo crea solo y el conector falla con
     *    SQLiteDatabaseDoesNotExistException antes de llegar a migrar.
     *
     * 2. Verifica que no este corrupto, y si lo esta lo aparta. Una base
     *    danada deja la aplicacion inservible de forma permanente: el archivo
     *    vive en AppData y SOBREVIVE a la reinstalacion, asi que sin esto el
     *    usuario reinstala una y otra vez y siempre falla igual.
     */
    private function prepareSqliteFile(): void
    {
        $ruta = $this->sqlitePath();

        if (!$ruta) {
            return;
        }

        if (!file_exists($ruta)) {
            @mkdir(dirname($ruta), 0755, true);
            touch($ruta);

            return;
        }

        // Un archivo con contenido que NO empieza con el encabezado de SQLite
        // esta roto y punto. Hace falta chequearlo aparte porque a un archivo
        // muy chico SQLite lo toma como base vacia y el integrity_check da "ok".
        if (filesize($ruta) > 0 && file_get_contents($ruta, false, null, 0, 16) !== "SQLite format 3 ") {
            $this->apartarBaseDanada($ruta);

            return;
        }

        try {
            $pdo = new \PDO('sqlite:' . $ruta);
            $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
            $estado = $pdo->query('PRAGMA integrity_check')->fetchColumn();
            $pdo = null;

            if (strtolower((string) $estado) === 'ok') {
                return;
            }
        } catch (\Throwable $e) {
            // No se pudo ni abrir: se trata como corrupta.
        }

        $this->apartarBaseDanada($ruta);
    }

    /**
     * Aparta una base danada y deja un archivo limpio en su lugar.
     *
     * Se conserva con otro nombre en vez de borrarla: si el comercio ya habia
     * cargado ventas, es lo unico que queda para intentar recuperarlas.
     */
    private function apartarBaseDanada(string $ruta): void
    {
        // Soltar la conexion primero. Para cuando llega la instalacion, Laravel
        // ya consulto la base (el middleware que decide si mostrar el asistente),
        // asi que hay un PDO vivo sobre ese archivo.
        $conexion = config('database.default');
        DB::disconnect($conexion);
        DB::purge($conexion);

        // NO se renombra: en Windows, mover un archivo abierto FALLA. Con el
        // PDO todavia vivo el rename devolvia false en silencio, el archivo
        // corrupto se quedaba en su lugar y la instalacion moria igual con
        // "database disk image is malformed".
        //
        // Copiar y vaciar en el lugar si funciona con el archivo abierto.
        $respaldo = $ruta . '.corrupta-' . date('YmdHis');
        @copy($ruta, $respaldo);

        if (@file_put_contents($ruta, '') === false) {
            throw new Exception(
                'No se pudo reemplazar la base de datos danada. Cerra la aplicacion ' .
                'por completo y volve a abrirla. Si sigue igual, borra la carpeta ' .
                dirname($ruta) . ' y reinstala.'
            );
        }

        // Los archivos auxiliares del modo WAL quedarian huerfanos y vuelven a
        // corromper la base nueva.
        foreach (['-wal', '-shm'] as $sufijo) {
            @unlink($ruta . $sufijo);
        }

        clearstatcache(true, $ruta);

        if (filesize($ruta) !== 0) {
            throw new Exception('La base de datos danada no se pudo vaciar: ' . $ruta);
        }
    }

    public function runInstallation(array $data): array
    {
        try {
            // Increase PHP timeout for long-running operations
            set_time_limit(300);

            // Clear config cache first so new .env values are loaded
            Artisan::call('config:clear', ['--no-interaction' => true]);

            $this->prepareSqliteFile();

            // Run migrations — tables (sessions, cache, jobs, etc.) are created here
            Artisan::call('migrate:fresh', [
                '--force' => true,
                '--no-interaction' => true,
            ]);

            // Now start transaction for seeding operations
            DB::beginTransaction();

            // Create roles and permissions
            $this->seedRolesAndPermissions();

            // Create Guest contact (ID = 1)
            $this->createGuestContact();

            // Create store
            $store = $this->createStore($data['store']);

            // Create admin user
            $admin = $this->createAdminUser($data['admin'], $store->id);

            // Seed default settings (includes installed_at marker inside the transaction)
            $this->seedDefaultSettings($data['store']['name'], $data['currency']);

            DB::commit();

            // Clear caches, create storage link, and mark as installed
            $this->finalizeInstallation();

            return [
                'success' => true,
                'message' => 'Installation completed successfully!',
                'admin_email' => $admin->email,
            ];
        } catch (Exception $e) {
            DB::rollBack();
            throw new Exception('Installation failed: ' . $e->getMessage());
        }
    }

    /**
     * Seed roles and permissions
     */
    private function seedRolesAndPermissions(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'pos', 'products', 'inventory', 'sales', 'customers', 'vendors',
            'charges', 'collections', 'expenses', 'quotations', 'reloads',
            'cheques', 'sold-items', 'purchases', 'payments', 'stores',
            'employees', 'payroll', 'media', 'settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $adminRole      = Role::firstOrCreate(['name' => 'admin',       'guard_name' => 'web']);
        $userRole       = Role::firstOrCreate(['name' => 'user',        'guard_name' => 'web']);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $superAdminRole->syncPermissions(Permission::all());
        $adminRole->syncPermissions($permissions);
        $userRole->syncPermissions(['products', 'pos']);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    /**
     * Create guest contact
     */
    private function createGuestContact(): void
    {
        Contact::create([
            'id' => 1,
            'name' => 'Guest',
            'email' => null,
            'phone' => null,
            'address' => null,
            'balance' => 0.00,
            'loyalty_points' => null,
            'type' => 'customer',
        ]);
    }

    /**
     * Create store
     */
    private function createStore(array $data): Store
    {
        return Store::create([
            'name' => $data['name'],
            'address' => $data['address'],
            'contact_number' => $data['contact_number'],
            'sale_prefix' => $data['sale_prefix'],
            'current_sale_number' => 0,
        ]);
    }

    /**
     * Create admin user
     */
    private function createAdminUser(array $data, int $storeId): User
    {
        $user = User::create([
            'name' => $data['name'],
            'user_name' => $data['username'],
            'user_role' => 'super-admin',
            'email' => $data['email'],
            'store_id' => $storeId,
            'password' => Hash::make($data['password']),
        ]);

        $user->assignRole('super-admin');

        return $user;
    }

    /**
     * Seed default settings
     */
    private function seedDefaultSettings(string $shopName, array $currency): void
    {
        $defaults = config('installer.default_settings');

        $currencySettings = [
            'currency_symbol' => $currency['currency_symbol'],
            'currency_code' => $currency['currency_code'],
            'symbol_position' => $currency['symbol_position'],
            'decimal_separator' => $currency['decimal_separator'],
            'thousands_separator' => $currency['thousands_separator'],
            'decimal_places' => $currency['decimal_places'],
            'negative_format' => $currency['negative_format'],
            'show_currency_code' => $currency['show_currency_code'],
        ];

        $settings = [
            ['meta_key' => 'shop_name', 'meta_value' => $shopName],
            ['meta_key' => 'shop_logo', 'meta_value' => $defaults['shop_logo']],
            ['meta_key' => 'sale_receipt_note', 'meta_value' => $defaults['sale_receipt_note']],
            ['meta_key' => 'sale_print_padding_right', 'meta_value' => $defaults['sale_print_padding_right']],
            ['meta_key' => 'sale_print_padding_left', 'meta_value' => $defaults['sale_print_padding_left']],
            ['meta_key' => 'sale_print_font', 'meta_value' => $defaults['sale_print_font']],
            ['meta_key' => 'show_barcode_store', 'meta_value' => $defaults['show_barcode_store']],
            ['meta_key' => 'show_barcode_product_price', 'meta_value' => $defaults['show_barcode_product_price']],
            ['meta_key' => 'show_barcode_product_name', 'meta_value' => $defaults['show_barcode_product_name']],
            ['meta_key' => 'product_code_increment', 'meta_value' => $defaults['product_code_increment']],
            ['meta_key' => 'modules', 'meta_value' => $defaults['modules']],
            ['meta_key' => 'misc_settings', 'meta_value' => json_encode($defaults['misc_settings'])],
            ['meta_key' => 'barcode_settings', 'meta_value' => json_encode($defaults['barcode_settings'])],
            ['meta_key' => 'currency_settings', 'meta_value' => json_encode($currencySettings)],
        ];

        // Get barcode template from view
        $barcodeTemplate = File::get(resource_path('views/templates/barcode-template-simple.html'));
        $settings[] = ['meta_key' => 'barcode_template', 'meta_value' => $barcodeTemplate];

        Setting::insert($settings);
    }

    /**
     * Check if application is already installed
     */
    public function isInstalled(): bool
    {
        try {
            return DB::table('settings')->where('meta_key', 'installed_at')->exists();
        } catch (\Exception $e) {
            return false;
        }
    }
}
