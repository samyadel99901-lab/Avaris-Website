<?php

namespace App\Services;

use App\Models\Invoice;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    private PayPalService $paypal;

    public function __construct(PayPalService $paypal)
    {
        $this->paypal = $paypal;


    }


    public function createAndSendInvoice(array $data): Invoice
    {
        // 1. حساب المجموع الكلي من البنود
        $totalAmount = collect($data['items'])->sum('amount');

        // 2. ابدأ Transaction
        $invoice = DB::transaction(function () use ($data, $totalAmount) {
            // 3. أنشئ Invoice في الداتابيز
            $invoice = Invoice::create([
                'customer_name' => $data['customer_name'],
                'customer_email' => $data['customer_email'],
                'currency' => $data['currency'] ?? 'USD',
                'total_amount' => $totalAmount,
                'status' => 'draft',
            ]);

            // 4. أنشئ الـ items
            foreach ($data['items'] as $item) {
                $invoice->items()->create([
                    'project_name' => $item['project_name'],
                    'description' => $item['description'] ?? null,
                    'amount' => $item['amount'],
                    'monday_item_id' => $item['monday_item_id'] ?? null,
                ]);
            }

            return $invoice;
        });

        // 5. اعمل Draft في PayPal
        try {
            $invoice->load('items'); // عشان items تكون موجودة في الـ object
            $paypalInvoiceId = $this->paypal->createDraftInvoice($invoice);

            // 6. خزّن الـ PayPal Invoice ID
            $invoice->update(['paypal_invoice_id' => $paypalInvoiceId]);

            // 7. ابعت الفاتورة فعلياً
            $this->paypal->sendInvoice($paypalInvoiceId);

            // 8. حدّث الـ status لـ sent
            $invoice->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

        } catch (\Exception $e) {
            // 9. لو فشل، خزّن الخطأ
            $invoice->update([
                'status' => 'failed_to_send',
                'error_message' => $e->getMessage(),
            ]);

            throw $e; // نعيد رمي الـ exception عشان اللي ناداها يعرف فيه مشكلة
        }

        return $invoice->fresh();
    }
}