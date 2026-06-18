<?php

namespace App\Services\Monday;

class PriceCalculator
{
    /**
     * يحسب المبلغ النهائي للفاتورة.
     *
     * المنطق المبسط (Production):
     * - السعر الأساسي = Samy's PayPal column
     * - لو فاضي → error (ما نبعتش)
     * - لو Status = Deposit paid → اطرح Deposit
     *
     * @return array  ['amount' => float] أو ['error' => string]
     */
    public function calculate(array $columns, string $statusLabel): array
    {
        // 1. تحقق من الحقول الأساسية
        $class = $this->getDropdownLabels($columns, 'class');
        $videoType = $this->getDropdownLabels($columns, 'video_type');

        if (empty($class)) {
            return ['error' => 'Class is empty'];
        }

        if (empty($videoType)) {
            return ['error' => 'Video Type2 is empty'];
        }

        // 2. اقرأ السعر من Samy's PayPal
        $price = $this->getNumberValue($columns, 'samy_paypal');

        if ($price === null) {
            return ['error' => "Samy's PayPal price is empty"];
        }

        // 3. لو Status = Deposit paid، اطرح الـ deposit
        if ($statusLabel === config('services.monday.statuses.deposit')) {
            $deposit = $this->getNumberValue($columns, 'deposit');

            if ($deposit === null) {
                return ['error' => 'Status is Deposit paid but Deposit column is empty'];
            }

            if ($deposit > $price) {
                return ['error' => "Deposit ({$deposit}) is greater than Samy's PayPal price ({$price})"];
            }

            $price -= $deposit;
        }

        return ['amount' => $price];
    }

    /**
     * يطلع كل الـ labels من dropdown column
     */
    private function getDropdownLabels(array $columns, string $configKey): array
    {
        $colId = config('services.monday.columns.' . $configKey);
        $values = $columns[$colId]['values'] ?? [];

        return array_map(fn($v) => $v['label'], $values);
    }

    /**
     * يطلع رقم من numbers column
     */
    private function getNumberValue(array $columns, string $configKey): ?float
    {
        $colId = config('services.monday.columns.' . $configKey);
        $number = $columns[$colId]['number'] ?? null;

        return $number !== null ? (float) $number : null;
    }
}