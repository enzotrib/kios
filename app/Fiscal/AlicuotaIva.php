<?php

namespace App\Fiscal;

/**
 * Alicuota de IVA de un producto, con los codigos que usa ARCA.
 *
 * El numero del caso es el Id que espera el web service; el porcentaje es
 * para calcular. No coinciden y no hay ninguna logica que los relacione: son
 * dos tablas distintas de ARCA. Por eso estan juntos aca y no se derivan uno
 * del otro en ningun lado.
 *
 * En un kiosco casi todo es 21%, pero no todo: varios alimentos sin elaborar
 * van al 10,5% y algunos productos estan al 0%. Poner 21% a todo —que es lo
 * que hace mas de un sistema— le hace declarar de mas al comercio.
 */
enum AlicuotaIva: int
{
    case CERO = 3;
    case DOS_CON_CINCO = 9;
    case CINCO = 8;
    case DIEZ_CON_CINCO = 4;
    case VEINTIUNO = 5;
    case VEINTISIETE = 6;

    /** El porcentaje de verdad, que no es el codigo. */
    public function porcentaje(): float
    {
        return match ($this) {
            self::CERO => 0.0,
            self::DOS_CON_CINCO => 2.5,
            self::CINCO => 5.0,
            self::DIEZ_CON_CINCO => 10.5,
            self::VEINTIUNO => 21.0,
            self::VEINTISIETE => 27.0,
        };
    }

    public function etiqueta(): string
    {
        $porcentaje = $this->porcentaje();

        return rtrim(rtrim(number_format($porcentaje, 1, ',', ''), '0'), ',') . '%';
    }

    /**
     * Separa un precio que ya tiene el IVA adentro.
     *
     * Es la cuenta que hace falta en un kiosco: el precio de gondola incluye
     * el IVA, y el comprobante lo pide separado en neto e impuesto.
     *
     * @return array{neto: float, iva: float}
     */
    public function separarDelPrecioFinal(float $precioFinal): array
    {
        $factor = 1 + ($this->porcentaje() / 100);
        $neto = round($precioFinal / $factor, 2);

        // El IVA se saca por resta y no por multiplicacion: asi neto + iva da
        // exactamente el precio que se cobro, sin un centavo de diferencia por
        // redondeo. Esa diferencia, sobre cientos de ventas, es lo que despues
        // no cierra contra la caja.
        return ['neto' => $neto, 'iva' => round($precioFinal - $neto, 2)];
    }

    /** @return array<int, array{codigo:int, etiqueta:string, porcentaje:float}> */
    public static function catalogo(): array
    {
        return array_map(fn (self $caso) => [
            'codigo' => $caso->value,
            'etiqueta' => $caso->etiqueta(),
            'porcentaje' => $caso->porcentaje(),
        ], self::cases());
    }
}
