<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ManagedTenant extends Model
{
    protected $fillable = [
        'tenant_id',
        'customer_name',
        'primary_domain',
        'gdap_status',
        'gdap_expiry_at',
        'integration_status',
        'last_sync_at',
        'assigned_engineer',
        'support_tier',
    ];

    public function domains(): HasMany
    {
        return $this->hasMany(TenantDomain::class);
    }
}
