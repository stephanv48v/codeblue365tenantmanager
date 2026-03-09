<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // DevAutoLogin checks APP_ENV internally and no-ops in non-local environments
        $middleware->web(prepend: [
            \App\Http\Middleware\DevAutoLogin::class,
        ]);
        $middleware->api(prepend: [
            \App\Http\Middleware\DevAutoLogin::class,
        ]);

        $middleware->statefulApi();

        // For API routes, return 401 JSON instead of redirecting to a login page
        $middleware->redirectGuestsTo(function (\Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                abort(401, 'Authentication required.');
            }
            return '/';
        });
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['error' => 'unauthenticated', 'message' => 'Authentication required.'], 401);
            }
        });
    })->create();
