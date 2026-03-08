<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TenantDomain extends Model
{
    protected $fillable = ['managed_tenant_id', 'domain'];
}
