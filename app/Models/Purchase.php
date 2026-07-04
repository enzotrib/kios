<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class Purchase extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('purchase')
            ->logOnly([
                'store_id', 'contact_id', 'purchase_date', 'total_amount', 'discount',
                'amount_paid', 'payment_status', 'status', 'reference_no', 'note',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Purchase has been {$eventName}");
    }

    protected $fillable = [
        'store_id',
        'contact_id',
        'purchase_date',
        'total_amount', //Net total (total after discount)
        'discount',
        'amount_paid',
        'payment_status',
        'status',
        'reference_no',
        'note',
        'profit_amount',
    ];

    public function transactions()
    {
        return $this->hasMany(PurchaseTransaction::class, 'purchase_id');
    }

}
