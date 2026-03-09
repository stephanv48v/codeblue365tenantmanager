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
        $setting = DB::table('settings')->where('key', 'rbac.entra_group_role_map')->value('value');
        $mappingsArray = $setting ? json_decode($setting, true) : [];

        // Build a group_id => role_slug lookup from the array-of-objects format
        $map = [];
        if (is_array($mappingsArray)) {
            foreach ($mappingsArray as $entry) {
                if (isset($entry['entra_group_id'], $entry['role_slug'])) {
                    $map[$entry['entra_group_id']] = $entry['role_slug'];
                }
            }
        }

        // Fall back to config if no settings stored
        if (empty($map)) {
            $map = config('codeblue365.entra_group_role_map', []);
        }

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
