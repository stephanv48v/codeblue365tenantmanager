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
            'security-admin' => ['audit.view', 'findings.manage', 'alerts.manage', 'tenants.view'],
            'integration-admin' => ['integrations.view', 'integrations.manage', 'graph.sync.run', 'tenants.view'],
            'engineer' => ['tenants.view', 'integrations.view', 'graph.sync.run', 'findings.manage'],
            'read-only-analyst' => ['tenants.view', 'integrations.view'],
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
