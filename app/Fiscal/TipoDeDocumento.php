<?php

namespace App\Fiscal;

/**
 * Tipo de documento del cliente, con los codigos que usa ARCA.
 *
 * Los numeros no son nuestros: son los que espera el web service de
 * facturacion electronica en el campo DocTipo. Estan aca, en un solo lugar,
 * para que el dia que se emita un comprobante no haya que buscarlos sueltos
 * por el codigo.
 *
 * La lista completa la devuelve FEParamGetTiposDoc. Estos son los que le
 * sirven a un comercio de mostrador; el resto —pasaporte, documentos del
 * exterior— se agregan cuando hagan falta.
 */
enum TipoDeDocumento: int
{
    case CUIT = 80;
    case CUIL = 86;
    case DNI = 96;
    /** Sin documento: la venta de mostrador de todos los dias. */
    case CONSUMIDOR_FINAL = 99;

    public function etiqueta(): string
    {
        return match ($this) {
            self::CUIT => 'CUIT',
            self::CUIL => 'CUIL',
            self::DNI => 'DNI',
            self::CONSUMIDOR_FINAL => 'Sin documento',
        };
    }

    /** Cuantos digitos tiene, para poder avisar cuando esta mal escrito. */
    public function digitos(): ?int
    {
        return match ($this) {
            self::CUIT, self::CUIL => 11,
            self::DNI => 8,
            self::CONSUMIDOR_FINAL => null,
        };
    }

    /** @return array<int, array{codigo:int, etiqueta:string, digitos:?int}> */
    public static function catalogo(): array
    {
        return array_map(fn (self $caso) => [
            'codigo' => $caso->value,
            'etiqueta' => $caso->etiqueta(),
            'digitos' => $caso->digitos(),
        ], self::cases());
    }
}
