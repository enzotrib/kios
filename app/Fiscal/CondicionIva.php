<?php

namespace App\Fiscal;

/**
 * Condicion del cliente frente al IVA, con los codigos que usa ARCA.
 *
 * Son los del campo CondicionIVAReceptorId, que el web service pide desde
 * 2024. Junto con la condicion del propio comercio determinan que letra de
 * comprobante corresponde: un monotributista siempre emite Factura C; un
 * responsable inscripto emite A a otro inscripto y B a un consumidor final.
 *
 * Esa decision no vive aca todavia —no emitimos comprobantes— pero el dato
 * del cliente si hay que guardarlo desde ahora: si el comercio carga
 * cuatrocientos clientes de cuenta corriente sin esto, despues no hay forma
 * de completarlo salvo uno por uno.
 */
enum CondicionIva: int
{
    case RESPONSABLE_INSCRIPTO = 1;
    case EXENTO = 4;
    /** El caso normal del mostrador. */
    case CONSUMIDOR_FINAL = 5;
    case MONOTRIBUTO = 6;
    case NO_CATEGORIZADO = 7;
    case MONOTRIBUTISTA_SOCIAL = 13;
    case NO_ALCANZADO = 15;

    public function etiqueta(): string
    {
        return match ($this) {
            self::RESPONSABLE_INSCRIPTO => 'Responsable inscripto',
            self::EXENTO => 'Exento',
            self::CONSUMIDOR_FINAL => 'Consumidor final',
            self::MONOTRIBUTO => 'Monotributo',
            self::NO_CATEGORIZADO => 'No categorizado',
            self::MONOTRIBUTISTA_SOCIAL => 'Monotributista social',
            self::NO_ALCANZADO => 'No alcanzado',
        };
    }

    /** @return array<int, array{codigo:int, etiqueta:string}> */
    public static function catalogo(): array
    {
        return array_map(fn (self $caso) => [
            'codigo' => $caso->value,
            'etiqueta' => $caso->etiqueta(),
        ], self::cases());
    }
}
