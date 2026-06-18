<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InvoiceItem extends Model
{
    use HasFactory;

        protected $fillable = [
        'invoice_id',
        'monday_item_id',
        'project_name',
        'description',
        'amount',
        'quantity',
    ];


     protected $casts = [
        'amount' => 'decimal:2',
        'quantity' => 'integer',
    ];

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }
}
