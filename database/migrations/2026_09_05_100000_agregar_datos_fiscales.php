<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Los datos que hacen falta para poder facturar algun dia.
 *
 * Todavia no se emite ningun comprobante, y puede pasar mucho hasta que se
 * emita. Estos campos se agregan igual, ahora, porque son los unicos de todo
 * el asunto que no se pueden recuperar despues:
 *
 * - Si el comercio carga cuatrocientos clientes de cuenta corriente sin CUIT
 *   ni condicion frente al IVA, el dia que quiera facturarles no hay de donde
 *   sacarlo. Hay que llamar a cada uno.
 * - Si carga tres mil productos sin alicuota, revisarlos uno por uno despues
 *   es un trabajo que nadie va a hacer, y termina declarando 21% sobre cosas
 *   que van al 10,5%.
 *
 * El resto del modulo fiscal —certificados, CAE, comprobantes— se puede
 * construir el año que viene sin costo. Esto no.
 *
 * Todo queda opcional: quien no factura no ve ninguna diferencia.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            // Codigos de ARCA. Ver App\Fiscal\TipoDeDocumento y CondicionIva.
            $table->unsignedTinyInteger('doc_tipo')->nullable()->after('address');
            $table->string('doc_nro', 20)->nullable()->after('doc_tipo');
            $table->unsignedTinyInteger('condicion_iva')->nullable()->after('doc_nro');

            // Para buscar un cliente por CUIT, que es como lo va a buscar
            // quien esta facturando.
            $table->index('doc_nro');
        });

        Schema::table('products', function (Blueprint $table) {
            // Nulo a proposito: significa "la alicuota general del comercio",
            // que se configura una sola vez. Asi el kiosquero toca solo los
            // productos que son la excepcion, no los tres mil.
            $table->unsignedTinyInteger('alicuota_iva')->nullable()->after('unit');
        });
    }

    public function down(): void
    {
        Schema::table('contacts', function (Blueprint $table) {
            // El indice primero: SQLite se niega a borrar una columna que
            // todavia tiene un indice apuntandole.
            $table->dropIndex(['doc_nro']);
            $table->dropColumn(['doc_tipo', 'doc_nro', 'condicion_iva']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('alicuota_iva');
        });
    }
};
