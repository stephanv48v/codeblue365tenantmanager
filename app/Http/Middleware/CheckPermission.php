<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if ($user === null) {
            abort(401, 'Authentication required.');
        }

        // Platform super-admin has all permissions
        $userRoleSlugs = DB::table('user_roles')
            ->join('roles', 'roles.id', '=', 'user_roles.role_id')
            ->where('user_roles.user_id', $user->id)
            ->pluck('roles.slug');

        if ($userRoleSlugs->contains('platform-super-admin')) {
            return $next($request);
        }

        // Check if any of the user's roles have the required permission
        $hasPermission = DB::table('user_roles')
            ->join('role_permissions', 'role_permissions.role_id', '=', 'user_roles.role_id')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('user_roles.user_id', $user->id)
            ->where('permissions.slug', $permission)
            ->exists();

        if (!$hasPermission) {
            abort(403, 'Insufficient permissions.');
        }

        return $next($request);
    }
}
