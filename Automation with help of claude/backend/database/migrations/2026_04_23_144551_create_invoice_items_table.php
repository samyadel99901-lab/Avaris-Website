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
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            
            // العلاقة مع الفاتورة الأم
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            
            // Monday integration
            $table->string('monday_item_id')->nullable()->index();
            
            // Item details
            $table->string('project_name');
            $table->text('description')->nullable();
            $table->decimal('amount', 10, 2);
            $table->integer('quantity')->default(1);
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};
