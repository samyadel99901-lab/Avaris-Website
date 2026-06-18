<?php

namespace App\Http\Controllers;

use App\Services\BulkInvoiceService;
use App\Services\Monday\MondayService;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * GET /api/invoices/eligible
     * يرجع الفواتير المؤهلة من Monday (بدون إرسال).
     */
    public function eligible(MondayService $mondayService)
    {
        try {
            $data = $mondayService->getInvoicesData();

            return response()->json([
                'invoices' => $data['invoices'],
                'warnings' => $data['warnings'],
                'summary' => [
                    'eligible_count' => count($data['invoices']),
                    'total_amount' => collect($data['invoices'])
                        ->flatMap(fn($inv) => $inv['items'])
                        ->sum('amount'),
                    'warnings_count' => count($data['warnings']),
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch invoices from Monday',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/invoices/send
     * يبعت كل الفواتير المؤهلة (الإصدار البسيط حالياً).
     */
    public function send(Request $request, BulkInvoiceService $bulkService)
{
    $validated = $request->validate([
        'selected_emails' => 'nullable|array',
        'selected_emails.*' => 'email',
    ]);

    try {
        $report = $bulkService->processAll($validated['selected_emails'] ?? null);

        return response()->json([
            'successful' => $report['successful'],
            'failed' => $report['failed'],
            'warnings' => $report['warnings'],
            'summary' => [
                'successful_count' => count($report['successful']),
                'failed_count' => count($report['failed']),
                'warnings_count' => count($report['warnings']),
            ],
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to process invoices',
            'message' => $e->getMessage(),
        ], 500);
    }
}

    /**
     * GET /api/invoices/history
     * يرجع كل الفواتير اللي اتبعتت من الداتابيز.
     */
    public function history()
    {
        $invoices = \App\Models\Invoice::with('items')
            ->latest()
            ->get()
            ->map(function ($invoice) {
                return [
                    'id' => $invoice->id,
                    'paypal_invoice_id' => $invoice->paypal_invoice_id,
                    'customer_name' => $invoice->customer_name,
                    'customer_email' => $invoice->customer_email,
                    'total_amount' => $invoice->total_amount,
                    'currency' => $invoice->currency,
                    'status' => $invoice->status,
                    'sent_at' => $invoice->sent_at,
                    'items_count' => $invoice->items->count(),
                ];
            });

        return response()->json(['invoices' => $invoices]);
    }
}