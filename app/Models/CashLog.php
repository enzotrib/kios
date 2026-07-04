<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class CashLog extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('cash_log')
            ->logOnly([
                'transaction_date', 'transaction_type', 'contact_id', 'reference_id',
                'amount', 'source', 'description', 'store_id',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "CashLog has been {$eventName}");
    }

    protected $fillable = [
        'transaction_date',
        'transaction_type',
        'contact_id',
        'reference_id',
        'amount',
        'source',
        'description',
        'store_id',
        'created_by',
    ];
}
