<?php

namespace App\Models;

use App\Fiscal\CondicionIva;
use App\Fiscal\TipoDeDocumento;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class Contact extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('contact')
            ->logOnly([
                'name', 'email', 'phone', 'address', 'balance',
                'loyalty_points', 'type', 'whatsapp',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Contact has been {$eventName}");
    }

    protected $fillable = [
        'name',
        'email',
        'phone',
        'address',
        'balance',
        'loyalty_points',
        'type',   // Type of contact: customer or vendor
        'whatsapp',

        // Datos fiscales. Codigos de ARCA: ver App\Fiscal\TipoDeDocumento y
        // App\Fiscal\CondicionIva.
        'doc_tipo',
        'doc_nro',
        'condicion_iva',
    ];

    protected $casts = [
        'doc_tipo' => TipoDeDocumento::class,
        'condicion_iva' => CondicionIva::class,
    ];


    // $customers = Contact::customers()->get();
    public function scopeCustomers($query)
    {
        return $query->where('type', 'customer');
    }

    // Contact::vendors()->get();
    public function scopeVendors($query)
    {
        return $query->where('type', 'vendor');
    }

    public function incrementBalance($amount, $user)
    {
        $this->increment('balance', $amount);
    }

    public function quotations() {
        return $this->hasMany(Quotation::class);
    }
}
