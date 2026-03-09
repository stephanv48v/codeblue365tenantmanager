<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Automatically logs in as a dev user in local environment.
 * This middleware is ONLY registered when APP_ENV=local.
 */
class DevAutoLogin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!app()->environment('local')) {
            return $next($request);
        }

        $user = User::firstOrCreate(
            ['email' => 'dev@codeblue365.local'],
            [
                'name' => 'Dev User',
                'entra_object_id' => 'dev-local-user',
                'entra_tenant_id' => 'dev-tenant',
                'last_login_at' => now(),
            ]
        );

        // Assign platform-super-admin role if not assigned
        $adminRole = \Illuminate\Support\Facades\DB::table('roles')
            ->where('slug', 'platform-super-admin')
            ->first();

        if ($adminRole !== null) {
            \Illuminate\Support\Facades\DB::table('user_roles')->insertOrIgnore([
                'user_id' => $user->id,
                'role_id' => $adminRole->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // For web routes: session-based login
        Auth::login($user);

        // For API routes: inject a Sanctum personal access token so auth:sanctum works
        if ($request->is('api/*') && !$request->bearerToken()) {
            $token = Cache::get('dev_sanctum_token');

            if ($token === null) {
                $user->tokens()->delete();
                $token = $user->createToken('dev-api-token')->plainTextToken;
                Cache::put('dev_sanctum_token', $token, now()->addDay());
            }

            $request->headers->set('Authorization', 'Bearer ' . $token);
        }

        return $next($request);
    }
}
