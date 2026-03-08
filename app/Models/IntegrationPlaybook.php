<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntegrationPlaybook extends Model
{
    protected $fillable = [
        'slug',
        'title',
        'integration_slug',
        'version',
        'owner',
        'prerequisites',
        'steps',
        'permissions',
        'gdap_requirements',
        'consent_requirements',
        'troubleshooting',
        'is_active',
    ];

    protected $casts = [
        'prerequisites' => 'array',
        'steps' => 'array',
        'permissions' => 'array',
        'gdap_requirements' => 'array',
        'consent_requirements' => 'array',
        'troubleshooting' => 'array',
        'is_active' => 'boolean',
    ];
}
