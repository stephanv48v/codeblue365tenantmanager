<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class RequirePermission
{
    public function handle(Request $request, Closure $next, string $permissionSlug): Response
    {
        $user = $request->user();

        if ($user === null) {
            return ApiResponse::error('unauthorized', 'Authentication required.', 401);
        }

        $permissions = Cache::remember(
            "user_permissions_{$user->id}",
            300,
            fn () => DB::table('user_roles')
                ->join('role_permissions', 'user_roles.role_id', '=', 'role_permissions.role_id')
                ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->where('user_roles.user_id', $user->id)
                ->pluck('permissions.slug')
                ->toArray()
        );

        if (! in_array($permissionSlug, $permissions, true)) {
            return ApiResponse::error('forbidden', 'Permission denied.', 403, [
                'required_permission' => $permissionSlug,
            ]);
        }

        return $next($request);
    }
}
