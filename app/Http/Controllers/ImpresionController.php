<?php

namespace App\Http\Controllers;

use App\Services\InstallerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Native\Desktop\DataObjects\Printer;
use Native\Desktop\Facades\System;

/**
 * Imprimir el ticket sin el dialogo de Windows.
 *
 * En el navegador, imprimir es window.print(): se abre el dialogo del sistema
 * y la persona elige impresora y confirma. En un mostrador eso son dos clics
 * de mas por venta, y ademas Electron no sabe dibujar la vista previa, asi que
 * el dialogo aparece con el cartel "esta aplicacion no admite la vista previa
 * de impresion" y un recuadro vacio. Da la sensacion de que algo fallo.
 *
 * Electron si puede mandar el trabajo directo a una impresora. Lo que llega
 * aca es el mismo documento que react-to-print arma para el dialogo —el
 * ticket con todos sus estilos, ya resuelto por el navegador—, asi que lo que
 * sale por la impresora es exactamente lo que se ve en pantalla.
 *
 * Todo esto existe solo en el paquete de escritorio. En la web no hay ninguna
 * impresora del lado del servidor a la que mandar nada.
 */
class ImpresionController extends Controller
{
    public function __construct(private InstallerService $instalador)
    {
    }

    /** Las impresoras que ve Windows, para poder elegir una en Configuracion. */
    public function impresoras(): JsonResponse
    {
        $this->soloEnElEscritorio();

        return response()->json([
            'impresoras' => collect(System::printers())
                ->map(fn (Printer $impresora) => [
                    'nombre' => $impresora->name,
                    'etiqueta' => $impresora->displayName ?: $impresora->name,
                ])
                ->values(),
        ]);
    }

    public function imprimir(Request $request): JsonResponse
    {
        $this->soloEnElEscritorio();

        $datos = $request->validate([
            // El documento entero del ticket. Es grande porque trae los estilos
            // adentro, pero no sale de la maquina: viaja al servidor local que
            // la propia aplicacion levanta.
            'html' => ['required', 'string', 'max:5000000'],
            'impresora' => ['nullable', 'string', 'max:255'],
        ]);

        $nombre = $datos['impresora'] ?? '';
        $impresora = $nombre === ''
            ? null
            : new Printer($nombre, $nombre, '', []);

        System::print($datos['html'], $impresora, [
            'silent' => true,
            // Los fondos y los bordes de la tabla del ticket son parte del
            // comprobante, no decoracion.
            'printBackground' => true,
            // El rollo termico no tiene margenes: cada milimetro que se deja
            // libre arriba es papel tirado en cada venta.
            'margins' => ['marginType' => 'none'],
        ]);

        return response()->json(['ok' => true]);
    }

    /**
     * En la web esto no existe.
     *
     * Sin este corte, cualquiera que llegue al dominio podria mandar HTML
     * arbitrario a imprimirse en el servidor.
     */
    private function soloEnElEscritorio(): void
    {
        abort_unless($this->instalador->isDesktop(), 404);
    }
}
