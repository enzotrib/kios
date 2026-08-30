<?php
/**
 * Ajusta el instalador de Windows que genera NativePHP.
 *
 * Por defecto arma un instalador SILENCIOSO (oneClick): no pregunta nada, no
 * muestra progreso y, si la aplicacion esta abierta, no puede reemplazar los
 * archivos y NO AVISA — queda instalada la version vieja y el usuario no se
 * entera. Eso es inaceptable para alguien no tecnico: termina teniendo que
 * adivinar si ya habia una version instalada y que hacer con ella.
 *
 * Esta configuracion vive en vendor/, asi que se perderia con cada
 * composer update. Por eso el parche se aplica desde el proyecto y composer
 * lo vuelve a correr despues de instalar o actualizar (ver composer.json).
 *
 * Es idempotente: si ya esta aplicado, no hace nada.
 */

$archivo = __DIR__ . '/../vendor/nativephp/desktop/resources/electron/electron-builder.mjs';

if (!is_readable($archivo)) {
    echo "instalador-windows: no esta NativePHP, no hay nada que ajustar\n";
    exit(0);
}

// Imagenes propias del instalador. Sin esto NSIS usa su win.bmp generico:
// un fondo azul con una flecha y formas geometricas que no tiene nada que ver
// con el producto. electron-builder las toma de la carpeta build/ del proyecto
// de Electron, que vive en vendor/ y se regenera con cada composer update.
$destinoImagenes = dirname($archivo) . '/build';
$origenImagenes = __DIR__ . '/../resources/installer';

foreach (['installerSidebar.bmp', 'installerHeader.bmp', 'uninstallerSidebar.bmp'] as $imagen) {
    $origen = $origenImagenes . '/' . $imagen;

    if (is_readable($origen)) {
        copy($origen, $destinoImagenes . '/' . $imagen);
    }
}

echo "instalador-windows: imagenes propias copiadas
";

$contenido = file_get_contents($archivo);

if (str_contains($contenido, 'oneClick:')) {
    echo "instalador-windows: ya aplicado\n";
    exit(0);
}

$original = <<<'JS'
        createDesktopShortcut: 'always',
        deleteAppDataOnUninstall: deleteAppDataOnUninstall,
JS;

$ajustado = <<<'JS'
        createDesktopShortcut: 'always',
        deleteAppDataOnUninstall: deleteAppDataOnUninstall,

        // Instalador ASISTIDO, no silencioso. Muestra progreso, avisa si ya
        // hay una version instalada y cierra la aplicacion si esta abierta,
        // en vez de fallar en silencio dejando los archivos viejos.
        oneClick: false,

        // El usuario no elige carpeta: una decision menos que no aporta nada
        // a quien solo quiere vender en su kiosco.
        allowToChangeInstallationDirectory: false,

        // Sin pedir permisos de administrador: se instala para el usuario.
        perMachine: false,
        allowElevation: false,

        // En castellano
        installerLanguages: ['es_ES'],
        language: '1034',

        // Abrirla al terminar
        runAfterFinish: true,
JS;

if (!str_contains($contenido, $original)) {
    fwrite(STDERR, "instalador-windows: no encontre donde aplicar el ajuste (cambio NativePHP?)\n");
    exit(1);
}

file_put_contents($archivo, str_replace($original, $ajustado, $contenido));
echo "instalador-windows: instalador asistido y en castellano aplicado\n";
