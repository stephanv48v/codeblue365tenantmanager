<?php

declare(strict_types=1);

namespace App\Modules\Admin\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function listUsers(Request $request): JsonResponse
    {
        $query = DB::table('users')
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
            ->orderBy('users.name');

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('users.name', 'like', "%{$search}%")
                  ->orWhere('users.email', 'like', "%{$search}%");
            });
        }

        $users = $query->paginate((int) $request->integer('per_page', 25));

        $thirtyDaysAgo = Carbon::now()->subDays(30)->toDateTimeString();

        $items = array_map(static function ($user) use ($thirtyDaysAgo) {
            if ($user->last_login_at === null) {
                $user->status = 'never';
            } elseif ($user->last_login_at >= $thirtyDaysAgo) {
                $user->status = 'active';
            } else {
                $user->status = 'inactive';
            }

            return $user;
        }, $users->items());

        return ApiResponse::success([
            'items' => $items,
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    public function getUserDetail(int $userId): JsonResponse
    {
        $user = DB::table('users')
            ->where('id', $userId)
            ->first(['id', 'name', 'email', 'last_login_at', 'created_at', 'updated_at']);

        if ($user === null) {
            return ApiResponse::error('user_not_found', 'User not found.', 404);
        }

        $roles = DB::table('roles')
            ->join('user_roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_id', $userId)
            ->orderBy('roles.name')
            ->get(['roles.id', 'roles.slug', 'roles.name', 'roles.description'])
            ->toArray();

        $user->roles = $roles;

        return ApiResponse::success(['user' => $user]);
    }

    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'role_slugs' => ['sometimes', 'array'],
            'role_slugs.*' => ['required', 'string', 'exists:roles,slug'],
        ]);

        $userId = DB::table('users')->insertGetId([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => '',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (! empty($validated['role_slugs'])) {
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
        }

        DB::table('audit_logs')->insert([
            'event_type' => 'user.created',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'user_id' => $userId,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role_slugs' => $validated['role_slugs'] ?? [],
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success(['message' => 'User created.', 'user_id' => $userId]);
    }

    public function deleteUser(Request $request, int $userId): JsonResponse
    {
        $user = DB::table('users')->where('id', $userId)->first();

        if ($user === null) {
            return ApiResponse::error('user_not_found', 'User not found.', 404);
        }

        if ($request->user()?->id === $userId) {
            return ApiResponse::error('cannot_delete_self', 'You cannot delete your own account.', 403);
        }

        DB::table('user_roles')->where('user_id', $userId)->delete();
        DB::table('users')->where('id', $userId)->delete();

        DB::table('audit_logs')->insert([
            'event_type' => 'user.deleted',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'user_id' => $userId,
                'name' => $user->name,
                'email' => $user->email,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success(['message' => 'User deleted.']);
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

        $roleCounts = DB::table('user_roles')
            ->select('role_id', DB::raw('COUNT(*) as user_count'))
            ->groupBy('role_id')
            ->pluck('user_count', 'role_id');

        $rolePermissions = DB::table('role_permissions')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->select('role_permissions.role_id', 'permissions.slug')
            ->orderBy('permissions.slug')
            ->get()
            ->groupBy('role_id');

        $items = $roles->map(function ($role) use ($roleCounts, $rolePermissions) {
            $role->user_count = (int) ($roleCounts[$role->id] ?? 0);
            $role->permissions = $rolePermissions->has($role->id)
                ? $rolePermissions[$role->id]->pluck('slug')->toArray()
                : [];

            return $role;
        })->toArray();

        return ApiResponse::success(['items' => $items]);
    }

    public function getRolePermissionMatrix(): JsonResponse
    {
        $roles = DB::table('roles')
            ->orderBy('name')
            ->get(['id', 'slug', 'name', 'description']);

        $rolePermissions = DB::table('role_permissions')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->select('role_permissions.role_id', 'permissions.slug')
            ->orderBy('permissions.slug')
            ->get()
            ->groupBy('role_id');

        $rolesWithPermissions = $roles->map(function ($role) use ($rolePermissions) {
            $role->permissions = $rolePermissions->has($role->id)
                ? $rolePermissions[$role->id]->pluck('slug')->toArray()
                : [];

            return $role;
        })->toArray();

        $permissions = DB::table('permissions')
            ->orderBy('slug')
            ->pluck('slug')
            ->toArray();

        return ApiResponse::success([
            'roles' => $rolesWithPermissions,
            'permissions' => $permissions,
        ]);
    }

    public function listAuditLogs(Request $request): JsonResponse
    {
        $query = DB::table('audit_logs')->orderByDesc('created_at');

        if ($request->filled('event_type')) {
            $query->where('event_type', (string) $request->string('event_type'));
        }

        if ($request->filled('actor')) {
            $query->where('actor_identifier', 'like', '%' . (string) $request->string('actor') . '%');
        }

        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', (string) $request->string('date_from'));
        }

        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', (string) $request->string('date_to') . ' 23:59:59');
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('event_type', 'like', "%{$search}%")
                  ->orWhere('actor_identifier', 'like', "%{$search}%")
                  ->orWhere('payload', 'like', "%{$search}%");
            });
        }

        $logs = $query->paginate((int) $request->integer('per_page', 50));

        // Get distinct event types for filter dropdown
        $eventTypes = DB::table('audit_logs')
            ->select('event_type')
            ->distinct()
            ->orderBy('event_type')
            ->pluck('event_type');

        return ApiResponse::success([
            'items' => $logs->items(),
            'pagination' => [
                'total' => $logs->total(),
                'per_page' => $logs->perPage(),
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
            ],
            'event_types' => $eventTypes,
        ]);
    }
}
