<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;
use Illuminate\Support\Facades\Auth;

class Store extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('store')
            ->logOnly([
                'name', 'address', 'contact_number', 'sale_prefix', 'current_sale_number',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Store has been {$eventName}");
    }

    protected $fillable = [
        'name',
        'address',
        'contact_number',
        'sale_prefix',
        'current_sale_number',
    ];

    public function scopeForCurrentUser($query)
    {
        if (Auth::user()->user_role === 'admin' || Auth::user()->user_role === 'super-admin') {
            return $query;
        }

        return $query->where('id', Auth::user()->store_id);
    }
}
