<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            
            // PayPal data
            $table->string('paypal_invoice_id')->nullable()->unique();
            $table->string('status')->default('draft');
            
            // Customer info
            $table->string('customer_name');
            $table->string('customer_email');
            
            // Totals (NOT per-item)
            $table->decimal('total_amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            
            // Audit
            $table->foreignId('sent_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            
            // Debugging
            $table->json('paypal_response')->nullable();
            $table->text('error_message')->nullable();
            
            // Timestamps
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index('status');
            $table->index('customer_email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
