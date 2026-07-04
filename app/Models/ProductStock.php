<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;
use App\Traits\Userstamps;

class ProductStock extends Model
{
    use HasFactory;
    use SoftDeletes;
    use Userstamps;
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('product_stock')
            ->logOnly(['store_id', 'batch_id', 'quantity', 'product_id'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs()
            ->setDescriptionForEvent(fn(string $eventName) => "ProductStock has been {$eventName}");
    }

    protected $fillable = [
        'store_id',         // Foreign key for the store
        'batch_id',         // Foreign key for the product batch
        'quantity',         // Quantity of stock available
        'product_id',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id');
    }
}
