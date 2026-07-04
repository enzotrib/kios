<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class ProductBatch extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('product_batch')
            ->logOnly([
                'product_id', 'batch_number', 'expiry_date', 'cost', 'price',
                'is_active', 'is_featured', 'discount', 'contact_id', 'discount_percentage',
            ])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "ProductBatch has been {$eventName}");
    }

    protected $fillable = [
        'product_id',
        'batch_number',
        'expiry_date',
        'cost',
        'price',
        'is_active',
        'is_featured',
        'discount',
        'contact_id',
        'discount_percentage',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function contact()
    {
        return $this->belongsTo(Contact::class, 'contact_id');
    }

    public function stocks()
    {
        return $this->hasMany(ProductStock::class, 'batch_id');
    }
}
