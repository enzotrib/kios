<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class Quotation extends Model
{
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('quotation')
            ->logOnly([
                'contact_id', 'quotation_date', 'total_amount', 'discount',
                'status', 'valid_until', 'note',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "Quotation has been {$eventName}");
    }

    public function contact() {
        return $this->belongsTo(Contact::class);
    }
    
    public function items() {
        return $this->hasMany(QuotationItem::class);
    }

    public function quotationItems()
    {
        return $this->hasMany(QuotationItem::class);
    }
}
