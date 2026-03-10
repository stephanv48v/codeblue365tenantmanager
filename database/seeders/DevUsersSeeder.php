<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DevUsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name' => 'Dev User',
                'email' => 'dev@codeblue365.local',
                'entra_object_id' => 'dev-local-user',
                'entra_tenant_id' => 'dev-tenant',
                'roles' => ['platform-super-admin'],
            ],
            [
                'name' => 'Sarah Mitchell',
                'email' => 'sarah.mitchell@codeblue365.local',
                'entra_object_id' => 'dev-user-admin',
                'entra_tenant_id' => 'dev-tenant',
                'roles' => ['platform-super-admin'],
            ],
            [
                'name' => 'James Chen',
                'email' => 'james.chen@codeblue365.local',
                'entra_object_id' => 'dev-security-admin',
                'entra_tenant_id' => 'dev-tenant',
                'roles' => ['security-admin'],
            ],
            [
                'name' => 'Emily Roberts',
                'email' => 'emily.roberts@codeblue365.local',
                'entra_object_id' => 'dev-engineer',
                'entra_tenant_id' => 'dev-tenant',
                'roles' => ['engineer'],
            ],
            [
                'name' => 'Michael Torres',
                'email' => 'michael.torres@codeblue365.local',
                'entra_object_id' => 'dev-senior-engineer',
                'entra_tenant_id' => 'dev-tenant',
                'roles' => ['senior-engineer'],
            ],
            [
                'name' => 'Lisa Wong',
                'email' => 'lisa.wong@codeblue365.local',
                'entra_object_id' => 'dev-ops-manager',
                'entra_tenant_id' => 'dev-tenant',
                'roles' => ['msp-operations-manager'],
            ],
            [
                'name' => 'David Kumar',
                'email' => 'david.kumar@codeblue365.local',
                'entra_object_id' => 'dev-read-only',
                'entra_tenant_id' => 'dev-tenant',
                'roles' => ['read-only-analyst'],
            ],
            [
                'name' => 'Rachel Adams',
                'email' => 'rachel.adams@codeblue365.local',
                'entra_object_id' => 'dev-service-desk',
                'entra_tenant_id' => 'dev-tenant',
                'roles' => ['service-desk'],
            ],
        ];

        foreach ($users as $userData) {
            $roles = $userData['roles'];
            unset($userData['roles']);

            $userId = DB::table('users')->updateOrInsert(
                ['email' => $userData['email']],
                [
                    ...$userData,
                    'password' => Hash::make('password'),
                    'last_login_at' => now()->subHours(rand(1, 720)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            $userId = (int) DB::table('users')->where('email', $userData['email'])->value('id');

            DB::table('user_roles')->where('user_id', $userId)->delete();

            foreach ($roles as $roleSlug) {
                $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
                if ($roleId !== null) {
                    DB::table('user_roles')->insertOrIgnore([
                        'user_id' => $userId,
                        'role_id' => (int) $roleId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
