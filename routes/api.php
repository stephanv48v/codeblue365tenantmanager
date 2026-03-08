<?php

declare(strict_types=1);

use App\Modules\Identity\Http\Controllers\EntraAuthController;
use App\Modules\Integrations\Http\Controllers\IntegrationController;
use App\Modules\Integrations\Http\Controllers\IntegrationPlaybookController;
use App\Modules\Tenants\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/entra/callback', [EntraAuthController::class, 'callback']);

    Route::middleware(['auth:sanctum'])->group(function (): void {
        Route::get('/tenants', [TenantController::class, 'index'])->middleware('permission:tenants.view');
        Route::get('/tenants/{tenantId}', [TenantController::class, 'show'])->middleware('permission:tenants.view');
        Route::post('/tenants', [TenantController::class, 'store'])->middleware('permission:tenants.manage');

        Route::get('/integrations', [IntegrationController::class, 'index'])->middleware('permission:integrations.view');
        Route::post('/integrations/validate', [IntegrationController::class, 'validateIntegration'])->middleware('permission:integrations.manage');

        Route::get('/playbooks', [IntegrationPlaybookController::class, 'index'])->middleware('permission:integrations.view');
        Route::get('/playbooks/{slug}', [IntegrationPlaybookController::class, 'show'])->middleware('permission:integrations.view');
        Route::post('/playbooks/{slug}/validate', [IntegrationPlaybookController::class, 'validatePlaybook'])->middleware('permission:integrations.manage');

        Route::post('/sync/tenant/{tenantId}', [TenantController::class, 'sync'])->middleware('permission:graph.sync.run');
        Route::get('/findings', [TenantController::class, 'findings'])->middleware('permission:findings.manage');
    });
});
