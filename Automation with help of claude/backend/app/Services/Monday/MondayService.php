<?php

namespace App\Services\Monday;

class MondayService
{
    private MondayClient $client;
    private InvoiceGrouper $grouper;
    private PriceCalculator $calculator;

    public function __construct(
        MondayClient $client,
        InvoiceGrouper $grouper,
        PriceCalculator $calculator
    ) {
        $this->client = $client;
        $this->grouper = $grouper;
        $this->calculator = $calculator;
    }

    /**
     * يجيب البيانات من Monday، يفلتر، يحسب، ويجمع حسب العميل.
     *
     * @return array  ['invoices' => [...], 'warnings' => [...]]
     */
    public function getInvoicesData(): array
    {
        $boardData = $this->client->getBoardData();

        $validItems = [];
        $warnings = [];

        $allowedGroups = config('services.monday.allowed_groups');
        $allowedStatuses = [
            config('services.monday.statuses.not_send'),
            config('services.monday.statuses.deposite'),
        ];

        foreach ($boardData['items_page']['items'] as $item) {
            // فلترة بالـ group
            $groupTitle = $item['group']['title'] ?? null;
            if (!in_array($groupTitle, $allowedGroups, true)) {
                continue;
            }

            // نحول الـ columns لـ associative array
            $columns = $this->indexColumns($item['column_values']);

            // فلترة بالـ status
            $statusCol = config('services.monday.columns.status');
            $statusLabel = $columns[$statusCol]['label'] ?? null;

            if (!in_array($statusLabel, $allowedStatuses, true)) {
                continue;
            }

            // حساب السعر
            $priceResult = $this->calculator->calculate($columns, $statusLabel);

            if (isset($priceResult['error'])) {
                $warnings[] = [
                    'monday_item_id' => $item['id'],
                    'project_name' => $item['name'],
                    'reason' => $priceResult['error'],
                ];
                continue;
            }

            // بيانات العميل
            $customerInfo = $this->extractCustomerInfo($columns);

            if (!$customerInfo) {
                $warnings[] = [
                    'monday_item_id' => $item['id'],
                    'project_name' => $item['name'],
                    'reason' => 'Customer info missing (no client linked or email)',
                ];
                continue;
            }

            // الـ Code للوصف
            $codeCol = config('services.monday.columns.code');
            $code = $columns[$codeCol]['text'] ?? '';

            $validItems[] = [
                'monday_item_id' => $item['id'],
                'customer_name' => $customerInfo['name'],
                'customer_email' => $customerInfo['email'],
                'project_name' => $item['name'],
                'amount' => $priceResult['amount'],
                'description' => $code ? "Code: {$code}" : null,
            ];
        }

        $invoices = $this->grouper->groupByCustomer($validItems);

        return [
            'invoices' => $invoices,
            'warnings' => $warnings,
        ];
    }

    /**
     * نحول array الـ column_values لـ associative array بمفتاح id
     */
    private function indexColumns(array $columnValues): array
    {
        $indexed = [];
        foreach ($columnValues as $col) {
            $indexed[$col['id']] = $col;
        }
        return $indexed;
    }

    /**
     * نطلع اسم العميل وإيميله من الـ columns
     */
    private function extractCustomerInfo(array $columns): ?array
    {
        $clientCol = config('services.monday.columns.client');
        $emailCol = config('services.monday.columns.email');

        $linkedItems = $columns[$clientCol]['linked_items'] ?? [];
        $email = $columns[$emailCol]['display_value'] ?? null;

        if (empty($linkedItems) || empty($email)) {
            return null;
        }

        return [
            'name' => $linkedItems[0]['name'],
            'email' => $email,
        ];
    }
}