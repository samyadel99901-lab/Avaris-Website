<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Services\Monday\MondayService;
use App\Services\Monday\MondayClient;
use Illuminate\Support\Facades\Log;

class BulkInvoiceService
{
    private MondayService $mondayService;
    private InvoiceService $invoiceService;
    private MondayClient $mondayClient;

    public function __construct(
        MondayService $mondayService,
        InvoiceService $invoiceService,
        MondayClient $mondayClient
    ) {
        $this->mondayService = $mondayService;
        $this->invoiceService = $invoiceService;
        $this->mondayClient = $mondayClient;
    }

    /**
     * يبعت كل الفواتير المؤهلة من Monday.
     * @param array|null $selectedEmails  لو ممرّر، يبعت فقط لهم. لو null، يبعت للكل.
     */
    public function processAll(?array $selectedEmails = null): array
    {
        $mondayData = $this->mondayService->getInvoicesData();

        ActivityLog::record(
            'sync',
            'Monday sync',
            count($mondayData['invoices']) . ' invoices loaded — ' . count($mondayData['warnings']) . ' warnings'
        );

        // فلتر بالـ selected emails لو موجودة
        $invoicesToProcess = $mondayData['invoices'];
        if ($selectedEmails !== null && !empty($selectedEmails)) {
            $invoicesToProcess = array_filter(
                $mondayData['invoices'],
                fn($inv) => in_array($inv['customer_email'], $selectedEmails, true)
            );
        }

        // تسجيل الـ warnings كـ activity
        foreach ($mondayData['warnings'] as $warning) {
            ActivityLog::record(
                'skipped',
                'Skipped',
                $warning['project_name'],
                $warning['reason']
            );
        }

        $successful = [];
        $failed = [];

        foreach ($invoicesToProcess as $invoiceData) {
            try {
                $invoice = $this->invoiceService->createAndSendInvoice($invoiceData);
                $updateErrors = $this->updateMondayItems($invoiceData['items']);

                $successful[] = [
                    'invoice_id' => $invoice->id,
                    'paypal_invoice_id' => $invoice->paypal_invoice_id,
                    'customer_email' => $invoiceData['customer_email'],
                    'amount' => $invoice->total_amount,
                    'items_count' => count($invoiceData['items']),
                    'monday_update_errors' => $updateErrors,
                ];

                ActivityLog::record(
                    'success',
                    'Sent successfully',
                    $invoiceData['customer_name'] . ' — ' . count($invoiceData['items']) . ' items',
                    '$' . number_format($invoice->total_amount, 2) . ' USD'
                );
            } catch (\Exception $e) {
                Log::error('Failed to process invoice', [
                    'customer_email' => $invoiceData['customer_email'],
                    'error' => $e->getMessage(),
                ]);

                $failed[] = [
                    'customer_email' => $invoiceData['customer_email'],
                    'amount' => collect($invoiceData['items'])->sum('amount'),
                    'reason' => $e->getMessage(),
                ];

                ActivityLog::record(
                    'failed',
                    'Failed to send',
                    $invoiceData['customer_name'],
                    $e->getMessage()
                );
            }
        }

        return [
            'successful' => $successful,
            'failed' => $failed,
            'warnings' => $mondayData['warnings'],
        ];
    }

    private function updateMondayItems(array $items): array
    {
        $pendingLabel = config('services.monday.statuses.pending');
        $errors = [];

        foreach ($items as $item) {
            try {
                $this->mondayClient->updateItemStatus(
                    $item['monday_item_id'],
                    $pendingLabel
                );
            } catch (\Exception $e) {
                $errors[] = [
                    'monday_item_id' => $item['monday_item_id'],
                    'error' => $e->getMessage(),
                ];

                Log::warning('Failed to update Monday item status', [
                    'monday_item_id' => $item['monday_item_id'],
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $errors;
    }
}