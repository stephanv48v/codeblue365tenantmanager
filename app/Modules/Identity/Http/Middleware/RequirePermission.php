<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http\Middleware;

use App\Support\ApiResponse;
use Closure;
use Illuminate\Http\Request;
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

        $hasPermission = DB::table('user_roles')
            ->join('role_permissions', 'user_roles.role_id', '=', 'role_permissions.role_id')
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->where('user_roles.user_id', $user->id)
            ->where('permissions.slug', $permissionSlug)
            ->exists();

        if (! $hasPermission) {
            return ApiResponse::error('forbidden', 'Permission denied.', 403, [
                'required_permission' => $permissionSlug,
            ]);
        }

        return $next($request);
    }
}
