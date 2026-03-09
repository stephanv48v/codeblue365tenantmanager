<?php

declare(strict_types=1);

use App\Modules\Admin\Http\Controllers\AdminController;
use App\Modules\Alerts\Http\Controllers\AlertController;
use App\Modules\Devices\Http\Controllers\DeviceInventoryController;
use App\Modules\Devices\Http\Controllers\DevicesDashboardController;
use App\Modules\Findings\Http\Controllers\FindingController;
use App\Modules\Findings\Http\Controllers\RecommendationController;
use App\Modules\Identity\Http\Controllers\EntraAuthController;
use App\Modules\Identity\Http\Controllers\IdentityDashboardController;
use App\Modules\Ingestion\Http\Controllers\SyncController;
use App\Modules\Integrations\Http\Controllers\IntegrationController;
use App\Modules\Integrations\Http\Controllers\IntegrationPlaybookController;
use App\Modules\Licensing\Http\Controllers\LicensingController;
use App\Modules\Reports\Http\Controllers\ReportController;
use App\Modules\ServiceHealth\Http\Controllers\ServiceHealthController;
use App\Modules\Settings\Http\Controllers\GroupRoleMappingController;
use App\Modules\Settings\Http\Controllers\PartnerTenantController;
use App\Modules\Settings\Http\Controllers\SettingsController;
use App\Modules\Settings\Http\Controllers\TenantDiscoveryController;
use App\Modules\Copilot\Http\Controllers\CopilotDashboardController;
use App\Modules\Tenants\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/entra/callback', [EntraAuthController::class, 'callback']);

    Route::middleware(['auth:sanctum'])->group(function (): void {
        // Tenants
        Route::get('/tenants', [TenantController::class, 'index'])->middleware('permission:tenants.view');
        Route::get('/tenants/{tenantId}', [TenantController::class, 'show'])->middleware('permission:tenants.view');
        Route::post('/tenants', [TenantController::class, 'store'])->middleware('permission:tenants.manage');

        // Integrations
        Route::get('/integrations', [IntegrationController::class, 'index'])->middleware('permission:integrations.view');
        Route::post('/integrations/validate', [IntegrationController::class, 'validateIntegration'])->middleware('permission:integrations.manage');

        // Playbooks
        Route::get('/playbooks', [IntegrationPlaybookController::class, 'index'])->middleware('permission:integrations.view');
        Route::get('/playbooks/{slug}', [IntegrationPlaybookController::class, 'show'])->middleware('permission:integrations.view');
        Route::post('/playbooks/{slug}/validate', [IntegrationPlaybookController::class, 'validatePlaybook'])->middleware('permission:integrations.manage');

        // Dashboards
        Route::get('/dashboard/stats', [TenantController::class, 'dashboardStats'])->middleware('permission:tenants.view');
        Route::get('/dashboard/integration-health', [TenantController::class, 'integrationHealth'])->middleware('permission:integrations.view');
        Route::get('/dashboard/security', [TenantController::class, 'securityStats'])->middleware('permission:tenants.view');
        Route::get('/dashboard/operations', [TenantController::class, 'operationsStats'])->middleware('permission:tenants.view');
        Route::get('/dashboard/identity-licensing', [TenantController::class, 'identityLicensingSummary'])->middleware('permission:tenants.view');

        // Identity
        Route::get('/identity/overview', [IdentityDashboardController::class, 'overview'])->middleware('permission:identity.view');
        Route::get('/identity/users', [IdentityDashboardController::class, 'users'])->middleware('permission:identity.view');
        Route::get('/identity/risky-users', [IdentityDashboardController::class, 'riskyUsers'])->middleware('permission:identity.view');
        Route::get('/identity/conditional-access', [IdentityDashboardController::class, 'conditionalAccess'])->middleware('permission:identity.view');

        // Devices
        Route::get('/devices/overview', [DevicesDashboardController::class, 'overview'])->middleware('permission:devices.view');
        Route::get('/devices/inventory', [DeviceInventoryController::class, 'index'])->middleware('permission:devices.view');
        Route::get('/devices/inventory/{id}', [DeviceInventoryController::class, 'show'])->middleware('permission:devices.view');

        // Licensing
        Route::get('/licensing/overview', [LicensingController::class, 'overview'])->middleware('permission:licensing.view');

        // Service Health
        Route::get('/service-health/overview', [ServiceHealthController::class, 'overview'])->middleware('permission:service-health.view');
        Route::get('/service-health/events', [ServiceHealthController::class, 'events'])->middleware('permission:service-health.view');

        // Copilot
        Route::get('/copilot/readiness', [CopilotDashboardController::class, 'readiness'])->middleware('permission:copilot.view');
        Route::get('/copilot/usage', [CopilotDashboardController::class, 'usage'])->middleware('permission:copilot.view');
        Route::get('/copilot/agents', [CopilotDashboardController::class, 'agents'])->middleware('permission:copilot.view');
        Route::get('/copilot/sharepoint', [CopilotDashboardController::class, 'sharepoint'])->middleware('permission:copilot.view');

        // Sync
        Route::post('/sync/tenant/{tenantId}', [TenantController::class, 'sync'])->middleware('permission:graph.sync.run');
        Route::get('/sync/tenant/{tenantId}/history', [SyncController::class, 'tenantHistory'])->middleware('permission:tenants.view');
        Route::get('/sync/trends', [SyncController::class, 'trends'])->middleware('permission:tenants.view');

        // Findings
        Route::get('/findings', [FindingController::class, 'index'])->middleware('permission:findings.manage');
        Route::get('/findings/{id}', [FindingController::class, 'show'])->middleware('permission:findings.manage');
        Route::post('/findings/bulk-update', [FindingController::class, 'bulkUpdate'])->middleware('permission:findings.manage');

        // Alerts
        Route::get('/alerts', [AlertController::class, 'index'])->middleware('permission:alerts.manage');
        Route::put('/alerts/{alertId}/acknowledge', [AlertController::class, 'acknowledge'])->middleware('permission:alerts.manage');
        Route::put('/alerts/{alertId}/dismiss', [AlertController::class, 'dismiss'])->middleware('permission:alerts.manage');
        Route::post('/alerts/bulk-update', [AlertController::class, 'bulkUpdate'])->middleware('permission:alerts.manage');

        // Recommendations
        Route::get('/recommendations', [RecommendationController::class, 'index'])->middleware('permission:findings.manage');

        // Admin
        Route::get('/admin/users', [AdminController::class, 'listUsers'])->middleware('permission:users.manage');
        Route::put('/admin/users/{userId}/roles', [AdminController::class, 'updateUserRole'])->middleware('permission:roles.manage');
        Route::get('/admin/roles', [AdminController::class, 'listRoles'])->middleware('permission:roles.manage');
        Route::get('/admin/audit-logs', [AdminController::class, 'listAuditLogs'])->middleware('permission:audit.view');

        // Reports
        Route::get('/reports/tenants', [ReportController::class, 'exportTenants'])->middleware('permission:reports.export');
        Route::get('/reports/findings', [ReportController::class, 'exportFindings'])->middleware('permission:reports.export');
        Route::get('/reports/scores', [ReportController::class, 'exportScores'])->middleware('permission:reports.export');
        Route::get('/reports/identity', [ReportController::class, 'exportIdentity'])->middleware('permission:reports.export');
        Route::get('/reports/device-compliance', [ReportController::class, 'exportDeviceCompliance'])->middleware('permission:reports.export');
        Route::get('/reports/license-utilization', [ReportController::class, 'exportLicenseUtilization'])->middleware('permission:reports.export');
        Route::get('/reports/security-posture', [ReportController::class, 'exportSecurityPosture'])->middleware('permission:reports.export');
        Route::get('/reports/service-health', [ReportController::class, 'exportServiceHealth'])->middleware('permission:reports.export');
        Route::get('/reports/copilot-usage', [ReportController::class, 'exportCopilotUsage'])->middleware('permission:reports.export');
        Route::get('/reports/sharepoint-sites', [ReportController::class, 'exportSharePointSites'])->middleware('permission:reports.export');

        // Settings
        Route::get('/settings/partner-tenant', [PartnerTenantController::class, 'show'])->middleware('permission:settings.view');
        Route::put('/settings/partner-tenant', [PartnerTenantController::class, 'update'])->middleware('permission:settings.manage');
        Route::post('/settings/partner-tenant/test', [PartnerTenantController::class, 'test'])->middleware('permission:settings.manage');
        Route::post('/settings/tenant-discovery/run', [TenantDiscoveryController::class, 'discover'])->middleware('permission:settings.manage');
        Route::post('/settings/tenant-discovery/import', [TenantDiscoveryController::class, 'import'])->middleware('permission:settings.manage');
        Route::get('/settings/group-role-mappings', [GroupRoleMappingController::class, 'index'])->middleware('permission:settings.view');
        Route::put('/settings/group-role-mappings', [GroupRoleMappingController::class, 'update'])->middleware('permission:settings.manage');
        Route::get('/settings/group/{group}', [SettingsController::class, 'show'])->middleware('permission:settings.view');
        Route::put('/settings/group/{group}', [SettingsController::class, 'update'])->middleware('permission:settings.manage');
    });
});
