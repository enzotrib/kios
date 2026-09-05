<?php

namespace App\Fiscal\Reglas;

use App\Fiscal\TipoDeDocumento;
use Closure;
use Illuminate\Contracts\Validation\DataAwareRule;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Que el numero de documento se corresponda con el tipo elegido.
 *
 * Un CUIT mal tipeado no molesta a nadie el dia que se carga el cliente.
 * Molesta meses despues, cuando ARCA rechaza el comprobante y hay que
 * averiguar cual de los cuatrocientos clientes tiene el numero mal.
 *
 * El CUIT trae un digito verificador justamente para esto: el ultimo digito
 * se calcula a partir de los otros diez, asi que un error de tipeo se detecta
 * en el momento, sin consultar nada ni salir a internet.
 */
class DocumentoCoherente implements ValidationRule, DataAwareRule
{
    private array $datos = [];

    public function setData(array $data): static
    {
        $this->datos = $data;

        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $numero = trim((string) $value);

        if ($numero === '') {
            return;
        }

        $tipo = TipoDeDocumento::tryFrom((int) ($this->datos['doc_tipo'] ?? 0));

        if (! $tipo) {
            return; // De la coherencia del tipo se ocupa su propia regla.
        }

        $digitos = $tipo->digitos();

        if ($digitos !== null && strlen($numero) !== $digitos) {
            $fail("El {$tipo->etiqueta()} tiene que tener {$digitos} dígitos.");

            return;
        }

        if (in_array($tipo, [TipoDeDocumento::CUIT, TipoDeDocumento::CUIL], true)
            && ! self::digitoVerificadorValido($numero)) {
            $fail("Ese {$tipo->etiqueta()} no es válido. Fijate si falta o sobra algún número.");
        }
    }

    /**
     * El digito verificador del CUIT.
     *
     * Se multiplican los primeros diez digitos por la serie 5-4-3-2-7-6-5-4-3-2,
     * se suman, y el resultado tiene que cerrar en modulo 11. Es el algoritmo
     * que publica ARCA.
     */
    public static function digitoVerificadorValido(string $cuit): bool
    {
        if (! preg_match('/^\d{11}$/', $cuit)) {
            return false;
        }

        $serie = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
        $suma = 0;

        for ($i = 0; $i < 10; $i++) {
            $suma += ((int) $cuit[$i]) * $serie[$i];
        }

        $resto = $suma % 11;

        $esperado = match ($resto) {
            0 => 0,
            1 => 9,
            default => 11 - $resto,
        };

        return (int) $cuit[10] === $esperado;
    }
}
