<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class Cheque extends Model
{
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('cheque')
            ->logOnly([
                'cheque_number', 'cheque_date', 'name', 'amount', 'issued_date',
                'bank', 'status', 'remark', 'direction',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Cheque has been {$eventName}");
    }

    protected $fillable = [
        'cheque_number',
        'cheque_date',
        'name',
        'amount',
        'issued_date',
        'bank',
        'status',
        'remark',
        'direction',
        'store_id',
        'created_by',
    ];
}
