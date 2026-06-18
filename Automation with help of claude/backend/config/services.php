<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    'paypal' => [
        'mode' => env('PAYPAL_MODE', 'sandbox'),
        'client_id' => env('PAYPAL_CLIENT_ID'),
        'client_secret' => env('PAYPAL_CLIENT_SECRET'),
        'base_url' => env('PAYPAL_BASE_URL', 'https://api-m.sandbox.paypal.com'),
    ],
'monday' => [
    'api_url' => env('MONDAY_API_URL', 'https://api.monday.com/v2'),
    'api_token' => env('MONDAY_API_TOKEN'),
    'board_id' => env('MONDAY_BOARD_ID'),

    // Column IDs (Production board: 6589241558)
    'columns' => [
        'name' => 'name',
        'client' => 'connect_boards',
        'code' => 'text__1',
        'class' => 'dropdown_mkzdm4p1',
        'video_type' => 'dropdown_mkzdd2a8',     // Video Type2 (الجديد)
        'samy_paypal' => 'numbers__1',            // السعر النهائي
        'deposit' => 'numeric__1',
        'status' => 'status__1',                   // Invoice Status
        'email' => 'lookup_mm2vxrjb',              // Mirror من بورد العملاء
    ],

    // Status labels
    'statuses' => [
        'not_send' => 'Not send',
        'deposit' => 'Deposit paid',
        'pending' => 'Pendeing',  // typo فعلاً موجود في البورد
    ],

    // Groups we read from
    'allowed_groups' => ['Sent', 'Revisions', 'Finished'],
],
];
