<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'title',
        'description',
        'detail',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    /**
     * Helper سريع للتسجيل من أي مكان في الـ app.
     */
    public static function record(string $type, string $title, ?string $description = null, ?string $detail = null, ?array $metadata = null): self
    {
        return static::create([
            'type' => $type,
            'title' => $title,
            'description' => $description,
            'detail' => $detail,
            'metadata' => $metadata,
        ]);
    }
}