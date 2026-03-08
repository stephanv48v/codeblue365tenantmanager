<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth:sanctum'])->group(function (): void {
    Route::get('/dashboard', fn () => Inertia::render('Dashboard/Index'));
    Route::get('/tenants', fn () => Inertia::render('Tenants/Index'));
    Route::get('/integrations', fn () => Inertia::render('Integrations/Index'));
    Route::get('/playbooks', fn () => Inertia::render('Playbooks/Index'));
    Route::get('/playbooks/{slug}', fn (string $slug) => Inertia::render('Playbooks/Show', ['slug' => $slug]));
    Route::get('/findings', fn () => Inertia::render('Findings/Index'));
});
