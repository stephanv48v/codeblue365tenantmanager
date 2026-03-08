<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Score extends Model
{
    protected $fillable = [
        'tenant_id',
        'identity_currency',
        'device_currency',
        'app_currency',
        'security_posture',
        'governance_readiness',
        'integration_readiness',
        'composite_score',
        'calculated_at',
    ];
}
