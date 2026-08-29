<?php

namespace App\Providers;

use Native\Desktop\Facades\Window;
use Native\Desktop\Contracts\ProvidesPhpIni;

class NativeAppServiceProvider implements ProvidesPhpIni
{
    /**
     * Se ejecuta cuando arranca la aplicacion de escritorio.
     */
    public function boot(): void
    {
        Window::open()
            ->title(config('app.name'))

            // Un punto de venta se opera a pantalla completa: el POS muestra
            // una grilla de productos y el carrito al mismo tiempo, y las
            // tablas de reportes tienen muchas columnas. La ventana chica que
            // abre por defecto deja todo apretado.
            ->maximized()

            // Piso razonable por si el usuario la achica: por debajo de esto
            // el carrito del POS se apila sobre la grilla y no se puede
            // trabajar.
            ->minWidth(1100)
            ->minHeight(700)

            // Vuelve a abrirse donde y como la dejo la ultima vez.
            ->rememberState()

            // Sin la barra de menu de Electron (File / Edit / View / Window /
            // Help): no hace nada util en esta aplicacion y delata que es un
            // navegador embebido.
            ->hideMenu();
    }

    /**
     * Directivas de php.ini para el PHP empaquetado.
     */
    public function phpIni(): array
    {
        return [
            // Subida de logos e imagenes de productos
            'upload_max_filesize' => '20M',
            'post_max_size' => '20M',
            'memory_limit' => '512M',
            // La instalacion inicial corre migraciones y seeders
            'max_execution_time' => '300',
        ];
    }
}
