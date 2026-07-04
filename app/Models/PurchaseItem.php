<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class PurchaseItem extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('purchase_item')
            ->logOnly([
                'purchase_id', 'product_id', 'batch_id', 'quantity',
                'unit_price', 'unit_cost', 'discount', 'purchase_date',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "PurchaseItem has been {$eventName}");
    }

    protected $fillable = [
        'purchase_id',
        'product_id',
        'batch_id',
        'quantity',
        'unit_price',
        'unit_cost',
        'discount',
        'description',
        'purchase_date',
    ];
}
