<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Finding extends Model
{
    protected $fillable = [
        'tenant_id',
        'rule_key',
        'category',
        'severity',
        'status',
        'description',
        'evidence',
        'impact',
        'recommended_remediation',
        'first_detected_at',
        'last_detected_at',
        'resolved_at',
    ];

    protected $casts = [
        'evidence' => 'array',
    ];
}
