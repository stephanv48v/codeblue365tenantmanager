<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect('/dashboard'));

Route::middleware(['auth'])->group(function (): void {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard/Index'));
    Route::get('/tenants', fn () => Inertia::render('Tenants/Index'));
    Route::get('/tenants/{tenantId}', fn (string $tenantId) => Inertia::render('Tenants/Show', ['tenantId' => $tenantId]));
    Route::get('/integrations', fn () => Inertia::render('Integrations/Index'));
    Route::get('/integrations/health', fn () => Inertia::render('Integrations/Health'));
    Route::get('/playbooks', fn () => Inertia::render('Playbooks/Index'));
    Route::get('/playbooks/{slug}', fn (string $slug) => Inertia::render('Playbooks/Show', ['slug' => $slug]));
    Route::get('/identity', fn () => Inertia::render('Identity/Index'));
    Route::get('/identity/users', fn () => Inertia::render('Identity/Users'));
    Route::get('/identity/risky-users', fn () => Inertia::render('Identity/RiskyUsers'));
    Route::get('/identity/conditional-access', fn () => Inertia::render('Identity/ConditionalAccess'));
    Route::get('/devices', fn () => Inertia::render('Devices/Index'));
    Route::get('/licensing', fn () => Inertia::render('Licensing/Index'));
    Route::get('/service-health', fn () => Inertia::render('ServiceHealth/Index'));
    Route::get('/findings', fn () => Inertia::render('Findings/Index'));
    Route::get('/security', fn () => Inertia::render('Security/Index'));
    Route::get('/operations', fn () => Inertia::render('Operations/Index'));
    Route::get('/admin', fn () => Inertia::render('Admin/Index'));
    Route::get('/reports', fn () => Inertia::render('Reports/Index'));
    Route::get('/alerts', fn () => Inertia::render('Alerts/Index'));
    Route::get('/settings', fn () => Inertia::render('Settings/Index'));
});
