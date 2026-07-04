<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class Employee extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('employee')
            ->logOnly([
                'name', 'contact_number', 'address', 'joined_at', 'salary',
                'salary_frequency', 'role', 'status', 'gender', 'balance',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Employee has been {$eventName}");
    }

    protected $fillable = [
        'name',
        'contact_number',
        'address',
        'joined_at',
        'salary',
        'salary_frequency',
        'role',
        'status',
        'gender',
        'balance',
        'created_by',
        'store_id'
    ];

    protected $casts = [
        'joined_at' => 'date',
    ];
}
