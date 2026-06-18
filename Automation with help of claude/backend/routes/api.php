<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\InvoiceController;

// Public routes (لا تحتاج auth)
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (تحتاج token)
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Invoices
    Route::get('/invoices/eligible', [InvoiceController::class, 'eligible']);
    Route::post('/invoices/send', [InvoiceController::class, 'send']);
    Route::get('/invoices/history', [InvoiceController::class, 'history']);

    Route::get('/activities', [\App\Http\Controllers\ActivityController::class, 'index']);
});