<?php

declare(strict_types=1);

namespace App\Modules\Settings\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupRoleMappingController
{
    public function index(): JsonResponse
    {
        $mappings = json_decode(
            DB::table('settings')->where('key', 'rbac.entra_group_role_map')->value('value') ?? '[]',
            true
        );

        $roles = DB::table('roles')
            ->orderBy('name')
            ->get(['id', 'slug', 'name', 'description'])
            ->toArray();

        return ApiResponse::success([
            'mappings' => $mappings,
            'roles' => $roles,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'mappings' => 'present|array',
            'mappings.*.entra_group_id' => 'required|string',
            'mappings.*.role_slug' => 'required|string|exists:roles,slug',
        ]);

        $now = now();

        DB::table('settings')->updateOrInsert(
            ['key' => 'rbac.entra_group_role_map'],
            [
                'value' => json_encode($data['mappings']),
                'group' => 'rbac',
                'updated_at' => $now,
            ]
        );

        DB::table('audit_logs')->insert([
            'event_type' => 'settings.group_role_map.updated',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode(['mapping_count' => count($data['mappings'])]),
            'created_at' => $now,
        ]);

        return ApiResponse::success(['message' => 'Group role mappings updated.']);
    }
}
