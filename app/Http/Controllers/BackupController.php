<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use FilesystemIterator;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use ZipArchive;

class BackupController extends Controller
{
    private const MAX_BACKUPS = 100;

    /** Archivos intermedios que hay que borrar cuando el zip ya esta hecho. */
    private array $temporales = [];
    public function download(string $file)
    {
        $fileName = $this->sanitizeBackupName($file);
        $relativePath = "backups/{$fileName}";

        if (! Storage::disk('local')->exists($relativePath)) {
            abort(404, 'Backup file not found.');
        }

        return response()->download($this->absoluteStoragePath($relativePath), $fileName);
    }

    public function downloadBackupZip()
    {
        [$storagePath, $zipFileName] = $this->generateAndStoreBackup();

        return response()->download($this->absoluteStoragePath($storagePath), $zipFileName);
    }

    public function automation(Request $request)
    {
        $this->guardAutomationToken($request);

        [$storagePath, $zipFileName] = $this->generateAndStoreBackup();

        return response()->json([
            'success' => true,
            'filename' => $zipFileName,
            'path' => $storagePath,
            'download_url' => route('backups.download', ['file' => $zipFileName], false),
            'generated_at' => now()->toIso8601String(),
        ]);
    }

    public function listBackups()
    {
        $disk = Storage::disk('local');
        if (! $disk->exists('backups')) {
            return response()->json(['files' => []]);
        }

        $files = collect($disk->files('backups'))
            ->filter(fn ($path) => Str::endsWith($path, '.zip'))
            ->map(function ($path) use ($disk) {
                $name = basename($path);
                $size = $disk->size($path);
                $modified = $disk->lastModified($path);

                return [
                    'name' => $name,
                    'size' => $size,
                    'size_human' => $this->formatBytes($size),
                    'last_modified' => Carbon::createFromTimestamp($modified)->toIso8601String(),
                    'download_url' => route('backups.download', ['file' => $name]),
                ];
            })
            ->sortByDesc('last_modified')
            ->values();

        return response()->json(['files' => $files]);
    }

    public function deleteBackup(string $file)
    {
        $fileName = $this->sanitizeBackupName($file);
        $path = "backups/{$fileName}";
        $disk = Storage::disk('local');

        if (! $disk->exists($path)) {
            abort(404, 'Backup file not found.');
        }

        $disk->delete($path);

        return response()->json(['success' => true]);
    }

    protected function guardAutomationToken(Request $request): void
    {
        $expected = (string) env('INFOSHOP_TOKEN');
        $provided = (string) ($request->header('X-Infoshop-Token') ?? $request->query('token'));

        if (empty($expected) || empty($provided) || ! hash_equals($expected, $provided)) {
            abort(403, 'Invalid automation token.');
        }
    }

    /**
     * Generate a database backup ZIP and return [temporary_path, filename].
     */
    protected function createBackupZip(): array
    {
        $timestamp = date('Y-m-d_H-i-s');
        $zipFileName = 'infoshop-backup-' . $timestamp . '.zip';
        $tmpZipPath = storage_path(Str::random(16) . '.zip');

        $zip = new ZipArchive();
        if ($zip->open($tmpZipPath, ZipArchive::CREATE) !== true) {
            abort(500, 'Unable to create backup archive.');
        }

        $this->agregarLaBaseDeDatos($zip, $timestamp);

        $uploadsPath = storage_path('app/public/uploads');
        if (is_dir($uploadsPath)) {
            $this->addDirectoryToZip($zip, $uploadsPath, 'uploads');
        }

        $zip->close();

        return [$tmpZipPath, $zipFileName];
    }

    /**
     * Mete la base de datos adentro del zip.
     *
     * Antes esto era una sola rama, escrita para MySQL: `SHOW TABLES` y
     * `SHOW CREATE TABLE`, que en SQLite no existen. En el paquete de
     * escritorio la base es SQLite, asi que "Hacer una copia ahora" respondia
     * error 500 siempre: la unica funcion que protege los datos del comercio
     * era justo la que nunca habia funcionado ahi.
     */
    private function agregarLaBaseDeDatos(ZipArchive $zip, string $timestamp): void
    {
        $conexion = DB::connection();

        if ($conexion->getDriverName() === 'sqlite') {
            $zip->addFile($this->copiaDeLaBaseSqlite(), 'database-' . $timestamp . '.sqlite');

            return;
        }

        $zip->addFromString('database-' . $timestamp . '.sql', $this->volcadoMysql());
    }

    /**
     * Una copia de la base SQLite, consistente aunque se este vendiendo.
     *
     * Copiar el archivo con `copy()` mientras hay una venta a medio escribir
     * daria una copia rota. `VACUUM INTO` lo hace desde adentro del motor:
     * espera a que la transaccion en curso termine y escribe una base entera y
     * valida, ya compactada.
     *
     * El archivo que devuelve queda en el temporal del sistema; lo borra
     * storeBackupFile() junto con el zip.
     */
    private function copiaDeLaBaseSqlite(): string
    {
        $destino = storage_path(Str::random(16) . '.sqlite');

        // VACUUM INTO exige que el destino no exista.
        if (file_exists($destino)) {
            @unlink($destino);
        }

        $this->temporales[] = $destino;

        try {
            DB::statement('VACUUM INTO ?', [$destino]);
        } catch (\Throwable $e) {
            // VACUUM no corre con una transaccion abierta, y las versiones de
            // SQLite anteriores a la 3.27 no conocen INTO. Copiar el archivo
            // es peor —si justo hay una venta a medio escribir, la copia sale
            // rota— pero es infinitamente mejor que no dejar copia.
            $original = DB::connection()->getDatabaseName();

            if (! is_file($original)) {
                // No hay de donde copiar. Se deja subir el error original en
                // vez de guardar un zip con una base vacia adentro, que seria
                // peor: el comercio creeria tener respaldo.
                throw $e;
            }

            copy($original, $destino);
        }

        return $destino;
    }

    /**
     * El volcado de siempre, para las instalaciones sobre MySQL.
     */
    private function volcadoMysql(): string
    {
        $dbName = DB::connection()->getDatabaseName();
        $tables = DB::select('SHOW TABLES');
        $tableKey = 'Tables_in_' . $dbName;

        $sql = '';

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            $sql .= "DROP TABLE IF EXISTS `{$tableName}`;
";

            $createTable = DB::select("SHOW CREATE TABLE `{$tableName}`");
            $sql .= $createTable[0]->{'Create Table'} . ";

";

            $rows = DB::table($tableName)->get();
            foreach ($rows as $row) {
                $row = (array) $row;
                $columns = implode('`,`', array_keys($row));
                $values = implode("','", array_map(static fn ($value) => addslashes($value), $row));
                $sql .= "INSERT INTO `{$tableName}` (`{$columns}`) VALUES ('{$values}');
";
            }
            $sql .= "

";
        }

        return $sql;
    }

    protected function generateAndStoreBackup(): array
    {
        [$tmpZipPath, $zipFileName] = $this->createBackupZip();
        $storagePath = $this->storeBackupFile($tmpZipPath, $zipFileName);

        return [$storagePath, $zipFileName];
    }

    protected function storeBackupFile(string $tmpZipPath, string $zipFileName): string
    {
        $disk = Storage::disk('local');
        $disk->makeDirectory('backups');
        $storagePath = "backups/{$zipFileName}";

        $stream = fopen($tmpZipPath, 'r');
        $disk->put($storagePath, $stream);
        if (is_resource($stream)) {
            fclose($stream);
        }
        @unlink($tmpZipPath);

        foreach ($this->temporales as $temporal) {
            @unlink($temporal);
        }
        $this->temporales = [];

        $this->enforceBackupLimit($disk);

        return $storagePath;
    }

    protected function enforceBackupLimit(FilesystemAdapter $disk): void
    {
        $files = collect($disk->files('backups'))
            ->filter(fn ($path) => Str::endsWith($path, '.zip'))
            ->sortBy(fn ($path) => $disk->lastModified($path))
            ->values();

        while ($files->count() > self::MAX_BACKUPS) {
            $oldest = $files->shift();
            if ($oldest) {
                $disk->delete($oldest);
            }
        }
    }

    protected function absoluteStoragePath(string $relativePath): string
    {
        return Storage::disk('local')->path($relativePath);
    }

    protected function sanitizeBackupName(string $file): string
    {
        $fileName = basename($file);
        if (! preg_match('/^[A-Za-z0-9._-]+$/', $fileName)) {
            abort(422, 'Invalid backup name.');
        }

        return $fileName;
    }

    protected function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes . ' B';
        }

        $units = ['KB', 'MB', 'GB', 'TB'];
        $bytes = $bytes / 1024;
        foreach ($units as $unit) {
            if ($bytes < 1024) {
                return round($bytes, 2) . ' ' . $unit;
            }
            $bytes /= 1024;
        }

        return round($bytes, 2) . ' PB';
    }

    protected function addDirectoryToZip(ZipArchive $zip, string $directory, string $basePath): void
    {
        $normalizedBase = trim(str_replace('\\', '/', $basePath), '/');
        if ($normalizedBase !== '' && $zip->locateName($normalizedBase . '/') === false) {
            $zip->addEmptyDir($normalizedBase);
        }

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($directory, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $fileInfo) {
            if ($iterator->getDepth() === 0 && $fileInfo->isDir()) {
                continue;
            }

            $subPath = str_replace('\\', '/', $iterator->getSubPathName());
            if ($subPath === '') {
                $subPath = $fileInfo->getFilename();
            }

            $zipPath = $normalizedBase === '' ? $subPath : $normalizedBase . '/' . $subPath;

            if ($fileInfo->isDir()) {
                if ($zip->locateName($zipPath . '/') === false) {
                    $zip->addEmptyDir($zipPath);
                }
                continue;
            }

            $zip->addFile($fileInfo->getPathname(), $zipPath);
        }
    }
}
