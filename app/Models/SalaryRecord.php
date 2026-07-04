<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class SalaryRecord extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('salary_record')
            ->logOnly([
                'employee_id', 'salary_date', 'basic_salary', 'allowances', 'deductions',
                'gross_salary', 'net_salary', 'salary_from',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "SalaryRecord has been {$eventName}");
    }

    protected $fillable = [
        'employee_id',
        'salary_date',
        'basic_salary',
        'allowances',
        'deductions',
        'gross_salary',
        'net_salary',
        'salary_from',
        'created_by',
        'store_id',
        'remarks',   
        'adjusts_balance',
    ];

    public function scopeStoreId($query, $storeId)
    {
        if ($storeId !== 'All' && $storeId !== 0) {
            return $query->where('store_id', $storeId);
        }
        return $query;
    }

    public function scopeDateFilter($query, $startDate, $endDate)
    {
        if (!empty($startDate) && !empty($endDate)) {
            return $query->whereBetween('salary_date', [$startDate, $endDate]);
        }
        return $query;
    }
}
