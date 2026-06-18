<?php

namespace App\Console\Commands;

use App\Services\BulkInvoiceService;
use Illuminate\Console\Command;

class ProcessInvoices extends Command
{
    protected $signature = 'invoices:process 
                            {--dry-run : Preview only, don\'t send actual invoices}';

    protected $description = 'Fetch invoices from Monday and send via PayPal';

    public function handle(BulkInvoiceService $bulkService): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('🔍 DRY RUN MODE — No invoices will be sent');
            $this->newLine();
        }

        $this->info('📥 Fetching invoices from Monday...');
        $this->newLine();

        try {
            if ($isDryRun) {
                $report = $this->buildDryRunReport($bulkService);
            } else {
                $report = $bulkService->processAll();
            }
        } catch (\Exception $e) {
            $this->error('❌ Fatal error: ' . $e->getMessage());
            return Command::FAILURE;
        }

        $this->displayReport($report, $isDryRun);

        return Command::SUCCESS;
    }

    private function buildDryRunReport(BulkInvoiceService $bulkService): array
    {
        $mondayService = app(\App\Services\Monday\MondayService::class);
        $mondayData = $mondayService->getInvoicesData();

        return [
            'successful' => array_map(function ($inv) {
                return [
                    'customer_email' => $inv['customer_email'],
                    'amount' => collect($inv['items'])->sum('amount'),
                    'items_count' => count($inv['items']),
                    'paypal_invoice_id' => '(would be created)',
                    'monday_update_errors' => [],
                ];
            }, $mondayData['invoices']),
            'failed' => [],
            'warnings' => $mondayData['warnings'],
        ];
    }

    private function displayReport(array $report, bool $isDryRun): void
    {
        $this->newLine();

        // عرض الناجحين
        if (!empty($report['successful'])) {
            $title = $isDryRun ? '✅ Invoices to be sent:' : '✅ Successfully sent:';
            $this->info($title);

            $rows = array_map(fn($s) => [
                $s['customer_email'],
                '$' . number_format($s['amount'], 2),
                $s['items_count'],
                $s['paypal_invoice_id'],
            ], $report['successful']);

            $this->table(
                ['Customer Email', 'Amount', 'Items', 'PayPal ID'],
                $rows
            );
        }

        // عرض الفاشلين
        if (!empty($report['failed'])) {
            $this->newLine();
            $this->error('❌ Failed:');

            $rows = array_map(fn($f) => [
                $f['customer_email'],
                '$' . number_format($f['amount'], 2),
                $f['reason'],
            ], $report['failed']);

            $this->table(
                ['Customer Email', 'Amount', 'Reason'],
                $rows
            );
        }

        // عرض الـ warnings
        if (!empty($report['warnings'])) {
            $this->newLine();
            $this->warn('⚠️  Warnings (items skipped):');

            $rows = array_map(fn($w) => [
                $w['monday_item_id'],
                substr($w['project_name'], 0, 50),
                $w['reason'],
            ], $report['warnings']);

            $this->table(
                ['Monday ID', 'Project', 'Reason'],
                $rows
            );
        }

        // الـ summary
        $this->newLine();
        $this->info('📊 Summary:');
        $this->line('  Successful: ' . count($report['successful']));
        $this->line('  Failed: ' . count($report['failed']));
        $this->line('  Warnings: ' . count($report['warnings']));

        if (!empty($report['successful'])) {
            $totalAmount = collect($report['successful'])->sum('amount');
            $this->line('  Total Amount: $' . number_format($totalAmount, 2));
        }

        if ($isDryRun) {
            $this->newLine();
            $this->warn('💡 Run without --dry-run to actually send these invoices');
        }
    }
}