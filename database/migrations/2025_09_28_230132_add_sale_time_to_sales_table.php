<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->time('sale_time')->nullable()->after('sale_date')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // El indice va primero. SQLite se niega a borrar una columna que
            // todavia tiene un indice apuntandole, y deja la tabla en un
            // estado que despues rompe hasta el VACUUM con el que se hace la
            // copia de seguridad. En MySQL el orden da igual.
            $table->dropIndex('sales_sale_time_index');
            $table->dropColumn('sale_time');
        });
    }
};
