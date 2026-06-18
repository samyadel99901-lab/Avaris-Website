<?php

namespace App\Services\Monday;

class InvoiceGrouper
{
    /**
     * تجمع الـ items الصالحة حسب العميل (بناءً على إيميل).
     *
     * @param array $validItems  مصفوفة من الـ items + سعرها
     * @return array
     */
    public function groupByCustomer(array $validItems): array
    {
        $grouped = [];

        foreach ($validItems as $item) {
            $email = $item['customer_email'];

            if (!isset($grouped[$email])) {
                $grouped[$email] = [
                    'customer_name' => $item['customer_name'],
                    'customer_email' => $email,
                    'currency' => 'USD',
                    'items' => [],
                ];
            }

            $grouped[$email]['items'][] = [
                'project_name' => $item['project_name'],
                'amount' => $item['amount'],
                'description' => $item['description'] ?? null,
                'monday_item_id' => $item['monday_item_id'],
            ];
        }

        return array_values($grouped);
    }
}