<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ManagedTenant;
use App\Models\User;

class ManagedTenantPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->hasPermission($user, 'tenants.view');
    }

    public function view(User $user, ManagedTenant $managedTenant): bool
    {
        return $this->hasPermission($user, 'tenants.view');
    }

    public function create(User $user): bool
    {
        return $this->hasPermission($user, 'tenants.manage');
    }

    private function hasPermission(User $user, string $permissionSlug): bool
    {
        return $user->roles()
            ->join('role_permissions', 'roles.id', '=', 'role_permissions.role_id')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('permissions.slug', $permissionSlug)
            ->exists();
    }
}
