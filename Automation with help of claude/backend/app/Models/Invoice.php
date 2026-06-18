<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory;

     protected $fillable = [
        'paypal_invoice_id',
        'status',
        'customer_name',
        'customer_email',
        'total_amount',
        'currency',
        'sent_by_user_id',
        'paypal_response',
        'error_message',
        'sent_at',
    ];


      protected $casts = [
        'paypal_response' => 'array',
        'total_amount' => 'decimal:2',
        'sent_at' => 'datetime',
    ];


        public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

       public function sentBy()
    {
        return $this->belongsTo(User::class, 'sent_by_user_id');
    }
}
