<?php

declare(strict_types=1);

namespace App\Modules\Identity\Application\Services;

use Illuminate\Support\Facades\DB;

class GroupRoleMappingService
{
    /**
     * @param array<int, string> $groupIds
     */
    public function syncUserRoles(int $userId, array $groupIds): void
    {
        $map = config('codeblue365.entra_group_role_map', []);

        foreach ($groupIds as $groupId) {
            $roleSlug = $map[$groupId] ?? null;

            if (! is_string($roleSlug) || $roleSlug === '') {
                continue;
            }

            $roleId = DB::table('roles')->where('slug', $roleSlug)->value('id');
            if ($roleId === null) {
                continue;
            }

            DB::table('user_roles')->updateOrInsert(
                ['user_id' => $userId, 'role_id' => $roleId],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }
    }
}
