<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * Automatically logs in as a dev user in local environment.
 * This middleware is ONLY registered when APP_ENV=local.
 *
 * - Skips auto-login on the /login page so users can sign in manually.
 * - If already authenticated via session, respects that session.
 * - Falls back to auto-creating and logging in as dev@codeblue365.local.
 */
class DevAutoLogin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! app()->environment('local')) {
            return $next($request);
        }

        // Don't auto-login on the login page (let users sign in manually)
        if ($request->is('login')) {
            return $next($request);
        }

        // If already authenticated via session, just ensure API token is set
        if (Auth::check()) {
            $this->ensureApiToken($request, Auth::user());

            return $next($request);
        }

        // No session — auto-login as default dev user
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
        $adminRole = DB::table('roles')
            ->where('slug', 'platform-super-admin')
            ->first();

        if ($adminRole !== null) {
            DB::table('user_roles')->insertOrIgnore([
                'user_id' => $user->id,
                'role_id' => $adminRole->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        Auth::login($user);
        $this->ensureApiToken($request, $user);

        return $next($request);
    }

    private function ensureApiToken(Request $request, $user): void
    {
        if (! $request->is('api/*') || $request->bearerToken()) {
            return;
        }

        $cacheKey = 'dev_sanctum_token_' . $user->id;
        $token = Cache::get($cacheKey);

        if ($token === null) {
            $user->tokens()->delete();
            $token = $user->createToken('dev-api-token')->plainTextToken;
            Cache::put($cacheKey, $token, now()->addDay());
        }

        $request->headers->set('Authorization', 'Bearer ' . $token);
    }
}
