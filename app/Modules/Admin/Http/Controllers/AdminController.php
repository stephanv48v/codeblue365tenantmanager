<?php

declare(strict_types=1);

namespace App\Modules\Admin\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function listUsers(Request $request): JsonResponse
    {
        $users = DB::table('users')
            ->leftJoin('user_roles', 'users.id', '=', 'user_roles.user_id')
            ->leftJoin('roles', 'roles.id', '=', 'user_roles.role_id')
            ->select([
                'users.id',
                'users.name',
                'users.email',
                'users.last_login_at',
                DB::raw("GROUP_CONCAT(roles.name, ', ') as role_names"),
                DB::raw("GROUP_CONCAT(roles.slug, ', ') as role_slugs"),
            ])
            ->groupBy('users.id', 'users.name', 'users.email', 'users.last_login_at')
            ->orderBy('users.name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    public function updateUserRole(Request $request, int $userId): JsonResponse
    {
        $validated = $request->validate([
            'role_slugs' => ['required', 'array', 'min:1'],
            'role_slugs.*' => ['required', 'string', 'exists:roles,slug'],
        ]);

        $user = DB::table('users')->where('id', $userId)->first();

        if ($user === null) {
            return ApiResponse::error('user_not_found', 'User not found.', 404);
        }

        DB::table('user_roles')->where('user_id', $userId)->delete();

        foreach ($validated['role_slugs'] as $slug) {
            $roleId = DB::table('roles')->where('slug', $slug)->value('id');
            if ($roleId !== null) {
                DB::table('user_roles')->insert([
                    'user_id' => $userId,
                    'role_id' => $roleId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        DB::table('audit_logs')->insert([
            'event_type' => 'user.roles.updated',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'user_id' => $userId,
                'role_slugs' => $validated['role_slugs'],
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success(['message' => 'User roles updated.']);
    }

    public function listRoles(): JsonResponse
    {
        $roles = DB::table('roles')
            ->orderBy('name')
            ->get(['id', 'slug', 'name', 'description']);

        return ApiResponse::success(['items' => $roles->toArray()]);
    }

    public function listAuditLogs(Request $request): JsonResponse
    {
        $query = DB::table('audit_logs')->orderByDesc('created_at');

        if ($request->filled('event_type')) {
            $query->where('event_type', (string) $request->string('event_type'));
        }

        $logs = $query->paginate((int) $request->integer('per_page', 50));

        return ApiResponse::success([
            'items' => $logs->items(),
            'pagination' => [
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
            ],
        ]);
    }
}
