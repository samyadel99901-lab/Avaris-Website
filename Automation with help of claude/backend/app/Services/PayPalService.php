<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class PayPalService
{
   


    public function getAccessToken(): string
    {
        return Cache::remember('paypal_access_token', 28000, function () {
            // ريميمبر دالة في ال Cahce بتاخد اسم المفتاح اللي هتدور عليه و المدة اللي هتحفظه فيها و الفانكشن اللي هتعملها 
            // لو ملقيتش المفتاح ده

            
            $response = Http::asForm()
                ->withBasicAuth(
                    config('services.paypal.client_id'),
                    config('services.paypal.client_secret')
                )
                ->post(config('services.paypal.base_url') . '/v1/oauth2/token', [
                    'grant_type' => 'client_credentials',
                ]);

            if ($response->failed()) {
                throw new \Exception('Failed to get PayPal access token: ' . $response->body());
            }

            return $response->json('access_token');
        });
    }



    public function createDraftInvoice(\App\Models\Invoice $invoice): string
    {
        $token = $this->getAccessToken();

        $payload = [
            'detail' => [
                'currency_code' => $invoice->currency,
            ],
            'primary_recipients' => [
                [
                    'billing_info' => [
                        'name' => [
                            'given_name' => $invoice->customer_name,
                        ],
                        'email_address' => $invoice->customer_email,
                    ],
                ],
            ],
            'items' => $invoice->items->map(function ($item) use ($invoice) {
                return [
                    'name' => $item->project_name,
                    'description' => $item->description ?? '',
                    'quantity' => (string) $item->quantity,
                    'unit_amount' => [
                        'currency_code' => $invoice->currency,
                        'value' => number_format((float) $item->amount, 2, '.', ''),
                    ],
                ];
            })->toArray(),
        ];

        $response = Http::withToken($token)
            ->post(config('services.paypal.base_url') . '/v2/invoicing/invoices', $payload);

        if ($response->failed()) {
            throw new \Exception('Failed to create PayPal draft invoice: ' . $response->body());
        }

        $href = $response->json('href');
        $invoiceId = basename($href);

        return $invoiceId;
    }

    public function sendInvoice(string $paypalInvoiceId): bool
    {
        $token = $this->getAccessToken();

        $url = config('services.paypal.base_url') 
             . '/v2/invoicing/invoices/' 
             . $paypalInvoiceId 
             . '/send';

        $response = Http::withToken($token)->post($url, [
            'send_to_invoicer' => false,
            'send_to_recipient' => true,
        ]);

        if ($response->failed()) {
            throw new \Exception('Failed to send PayPal invoice: ' . $response->body());
        }

        return true;
    }
}