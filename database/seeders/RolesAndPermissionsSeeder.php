<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            'users.manage', 'roles.manage', 'tenants.view', 'tenants.manage',
            'integrations.view', 'integrations.manage', 'graph.sync.run',
            'reports.export', 'audit.view', 'findings.manage', 'alerts.manage',
            'identity.view', 'devices.view', 'licensing.view', 'service-health.view',
        ];

        $permissionIds = [];
        foreach ($permissions as $permission) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $permission],
                [
                    'name' => $permission,
                    'description' => $permission,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $permissionIds[$permission] = (int) DB::table('permissions')->where('slug', $permission)->value('id');
        }

        $roles = [
            'platform-super-admin' => $permissions,
            'security-admin' => ['audit.view', 'findings.manage', 'alerts.manage', 'tenants.view', 'identity.view', 'devices.view'],
            'integration-admin' => ['integrations.view', 'integrations.manage', 'graph.sync.run', 'tenants.view'],
            'engineer' => ['tenants.view', 'integrations.view', 'graph.sync.run', 'findings.manage', 'identity.view', 'devices.view', 'licensing.view', 'service-health.view'],
            'read-only-analyst' => ['tenants.view', 'integrations.view', 'identity.view', 'devices.view', 'licensing.view', 'service-health.view'],
            'msp-operations-manager' => ['tenants.view', 'integrations.view', 'reports.export', 'findings.manage', 'identity.view', 'devices.view', 'licensing.view', 'service-health.view'],
            'senior-engineer' => ['tenants.view', 'tenants.manage', 'integrations.view', 'integrations.manage', 'graph.sync.run', 'findings.manage', 'identity.view', 'devices.view', 'licensing.view', 'service-health.view'],
            'service-desk' => ['tenants.view'],
            'account-manager' => ['tenants.view', 'reports.export'],
            'auditor' => ['tenants.view', 'audit.view', 'reports.export'],
        ];

        foreach ($roles as $role => $rolePermissions) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $role],
                [
                    'name' => str($role)->headline()->toString(),
                    'description' => $role,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $roleId = (int) DB::table('roles')->where('slug', $role)->value('id');

            foreach ($rolePermissions as $permission) {
                DB::table('role_permissions')->updateOrInsert(
                    [
                        'role_id' => $roleId,
                        'permission_id' => $permissionIds[$permission],
                    ],
                    [
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }
}
