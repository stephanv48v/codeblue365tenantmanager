<?php

declare(strict_types=1);

use App\Modules\Admin\Http\Controllers\AdminController;
use App\Modules\Alerts\Http\Controllers\AlertController;
use App\Modules\AppRegistrations\Http\Controllers\AppRegistrationsController;
use App\Modules\ConnectWise\Http\Controllers\ConnectWiseController;
use App\Modules\Copilot\Http\Controllers\CopilotDashboardController;
use App\Modules\Devices\Http\Controllers\DeviceInventoryController;
use App\Modules\Devices\Http\Controllers\DevicesDashboardController;
use App\Modules\Devices\Http\Controllers\DevicesEnhancedController;
use App\Modules\Dlp\Http\Controllers\DlpController;
use App\Modules\Exchange\Http\Controllers\ExchangeController;
use App\Modules\Findings\Http\Controllers\FindingController;
use App\Modules\Findings\Http\Controllers\RecommendationController;
use App\Modules\Groups\Http\Controllers\GroupsController;
use App\Modules\Identity\Http\Controllers\EntraAuthController;
use App\Modules\Identity\Http\Controllers\IdentityDashboardController;
use App\Modules\Identity\Http\Controllers\IdentityEnhancedController;
use App\Modules\Ingestion\Http\Controllers\SyncController;
use App\Modules\Integrations\Http\Controllers\IntegrationController;
use App\Modules\Integrations\Http\Controllers\IntegrationPlaybookController;
use App\Modules\Licensing\Http\Controllers\LicensingController;
use App\Modules\Licensing\Http\Controllers\LicensingEnhancedController;
use App\Modules\Notifications\Http\Controllers\NotificationController;
use App\Modules\PowerPlatform\Http\Controllers\PowerPlatformController;
use App\Modules\Remediation\Http\Controllers\RemediationController;
use App\Modules\Reports\Http\Controllers\ReportController;
use App\Modules\Reports\Http\Controllers\ReportEnhancedController;
use App\Modules\Security\Http\Controllers\ComplianceController;
use App\Modules\Security\Http\Controllers\SecurityEnhancedController;
use App\Modules\Security\Http\Controllers\SecurityPostureController;
use App\Modules\ServiceHealth\Http\Controllers\ServiceHealthController;
use App\Modules\Settings\Http\Controllers\BrandingController;
use App\Modules\Settings\Http\Controllers\GroupRoleMappingController;
use App\Modules\Settings\Http\Controllers\PartnerTenantController;
use App\Modules\Settings\Http\Controllers\SettingsController;
use App\Modules\Settings\Http\Controllers\TenantDiscoveryController;
use App\Modules\Teams\Http\Controllers\TeamsController;
use App\Modules\TenantComparison\Http\Controllers\TenantComparisonController;
use App\Modules\Tenants\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('/auth/entra/callback', [EntraAuthController::class, 'callback']);

    Route::middleware(['auth:sanctum'])->group(function (): void {
        // ─── Tenants ────────────────────────────────────────
        Route::get('/tenants', [TenantController::class, 'index'])->middleware('permission:tenants.view');
        Route::get('/tenants/{tenantId}', [TenantController::class, 'show'])->middleware('permission:tenants.view');
        Route::post('/tenants', [TenantController::class, 'store'])->middleware('permission:tenants.manage');

        // ─── Dashboard Stats ────────────────────────────────
        Route::get('/dashboard/stats', [TenantController::class, 'dashboardStats'])->middleware('permission:tenants.view');
        Route::get('/dashboard/integration-health', [TenantController::class, 'integrationHealth'])->middleware('permission:integrations.view');
        Route::get('/dashboard/security', [TenantController::class, 'securityStats'])->middleware('permission:tenants.view');
        Route::get('/dashboard/operations', [TenantController::class, 'operationsStats'])->middleware('permission:tenants.view');
        Route::get('/dashboard/identity-licensing', [TenantController::class, 'identityLicensingSummary'])->middleware('permission:tenants.view');

        // ─── Identity ───────────────────────────────────────
        Route::get('/identity/overview', [IdentityDashboardController::class, 'overview'])->middleware('permission:identity.view');
        Route::get('/identity/users', [IdentityDashboardController::class, 'users'])->middleware('permission:identity.view');
        Route::get('/identity/risky-users', [IdentityDashboardController::class, 'riskyUsers'])->middleware('permission:identity.view');
        Route::get('/identity/conditional-access', [IdentityDashboardController::class, 'conditionalAccess'])->middleware('permission:identity.view');
        Route::get('/identity/auth-methods', [IdentityDashboardController::class, 'authMethods'])->middleware('permission:identity.view');
        Route::get('/identity/admin-accounts', [IdentityDashboardController::class, 'adminAccounts'])->middleware('permission:identity.view');
        Route::get('/identity/guest-users', [IdentityDashboardController::class, 'guestUsers'])->middleware('permission:identity.view');
        Route::get('/identity/sign-in-activity', [IdentityDashboardController::class, 'signInActivity'])->middleware('permission:identity.view');

        // ─── Identity Enhanced ──────────────────────────────
        Route::get('/identity/password-health', [IdentityEnhancedController::class, 'passwordHealth'])->middleware('permission:identity.view');
        Route::get('/identity/pim-activations', [IdentityEnhancedController::class, 'pimActivations'])->middleware('permission:identity.view');
        Route::get('/identity/legacy-auth', [IdentityEnhancedController::class, 'legacyAuth'])->middleware('permission:identity.view');

        // ─── Email & Exchange ───────────────────────────────
        Route::get('/exchange/overview', [ExchangeController::class, 'overview'])->middleware('permission:identity.view');
        Route::get('/exchange/mailboxes', [ExchangeController::class, 'mailboxes'])->middleware('permission:identity.view');
        Route::get('/exchange/forwarding-rules', [ExchangeController::class, 'forwardingRules'])->middleware('permission:identity.view');
        Route::get('/exchange/forwarding', [ExchangeController::class, 'forwardingRules'])->middleware('permission:identity.view');
        Route::get('/exchange/mail-flow-rules', [ExchangeController::class, 'mailFlowRules'])->middleware('permission:identity.view');
        Route::get('/exchange/mail-flow', [ExchangeController::class, 'mailFlowRules'])->middleware('permission:identity.view');
        Route::get('/exchange/distribution-lists', [ExchangeController::class, 'distributionLists'])->middleware('permission:identity.view');

        // ─── Groups ─────────────────────────────────────────
        Route::get('/groups/overview', [GroupsController::class, 'overview'])->middleware('permission:identity.view');
        Route::get('/groups', [GroupsController::class, 'index'])->middleware('permission:identity.view');

        // ─── Teams ──────────────────────────────────────────
        Route::get('/teams/overview', [TeamsController::class, 'overview'])->middleware('permission:identity.view');
        Route::get('/teams', [TeamsController::class, 'index'])->middleware('permission:identity.view');
        Route::get('/teams/usage', [TeamsController::class, 'usage'])->middleware('permission:identity.view');

        // ─── App Registrations ──────────────────────────────
        Route::get('/app-registrations/overview', [AppRegistrationsController::class, 'overview'])->middleware('permission:identity.view');
        Route::get('/app-registrations', [AppRegistrationsController::class, 'index'])->middleware('permission:identity.view');
        Route::get('/app-registrations/consents', [AppRegistrationsController::class, 'consents'])->middleware('permission:identity.view');

        // ─── Devices ────────────────────────────────────────
        Route::get('/devices/overview', [DevicesDashboardController::class, 'overview'])->middleware('permission:devices.view');
        Route::get('/devices/inventory', [DeviceInventoryController::class, 'index'])->middleware('permission:devices.view');
        Route::get('/devices/inventory/{id}', [DeviceInventoryController::class, 'show'])->middleware('permission:devices.view');
        Route::get('/devices/compliance-policies', [DevicesEnhancedController::class, 'compliancePolicies'])->middleware('permission:devices.view');
        Route::get('/devices/autopilot', [DevicesEnhancedController::class, 'autopilot'])->middleware('permission:devices.view');

        // ─── Licensing ──────────────────────────────────────
        Route::get('/licensing/overview', [LicensingController::class, 'overview'])->middleware('permission:licensing.view');
        Route::get('/licensing/cost-analysis', [LicensingEnhancedController::class, 'costAnalysis'])->middleware('permission:licensing.view');

        // ─── Service Health ─────────────────────────────────
        Route::get('/service-health/overview', [ServiceHealthController::class, 'overview'])->middleware('permission:service-health.view');
        Route::get('/service-health/events', [ServiceHealthController::class, 'events'])->middleware('permission:service-health.view');

        // ─── Copilot ────────────────────────────────────────
        Route::get('/copilot/readiness', [CopilotDashboardController::class, 'readiness'])->middleware('permission:copilot.view');
        Route::get('/copilot/usage', [CopilotDashboardController::class, 'usage'])->middleware('permission:copilot.view');
        Route::get('/copilot/agents', [CopilotDashboardController::class, 'agents'])->middleware('permission:copilot.view');
        Route::get('/copilot/sharepoint', [CopilotDashboardController::class, 'sharepoint'])->middleware('permission:copilot.view');
        Route::get('/copilot/readiness/history', [CopilotDashboardController::class, 'readinessHistory'])->middleware('permission:copilot.view');
        Route::get('/copilot/audit', [CopilotDashboardController::class, 'audit'])->middleware('permission:copilot.view');

        // ─── DLP & Sensitivity Labels ───────────────────────
        Route::get('/dlp/overview', [DlpController::class, 'overview'])->middleware('permission:findings.manage');
        Route::get('/dlp/policies', [DlpController::class, 'policies'])->middleware('permission:findings.manage');
        Route::get('/dlp/labels', [DlpController::class, 'labels'])->middleware('permission:findings.manage');

        // ─── Power Platform ─────────────────────────────────
        Route::get('/power-platform/overview', [PowerPlatformController::class, 'overview'])->middleware('permission:identity.view');
        Route::get('/power-platform/apps', [PowerPlatformController::class, 'apps'])->middleware('permission:identity.view');
        Route::get('/power-platform/flows', [PowerPlatformController::class, 'flows'])->middleware('permission:identity.view');

        // ─── Security Enhanced ──────────────────────────────
        Route::get('/security/secure-score-actions', [SecurityEnhancedController::class, 'secureScoreActions'])->middleware('permission:findings.manage');
        Route::get('/security/defender-alerts', [SecurityEnhancedController::class, 'defenderAlerts'])->middleware('permission:findings.manage');
        Route::get('/security/security-defaults', [SecurityEnhancedController::class, 'securityDefaults'])->middleware('permission:findings.manage');

        // ─── Security Posture ───────────────────────────────
        Route::get('/security/posture', [SecurityPostureController::class, 'posture'])->middleware('permission:findings.manage');
        Route::get('/security/posture/history', [SecurityPostureController::class, 'history'])->middleware('permission:findings.manage');

        // ─── Compliance ─────────────────────────────────────
        Route::get('/compliance', [ComplianceController::class, 'index'])->middleware('permission:findings.manage');
        Route::get('/compliance/{slug}', [ComplianceController::class, 'show'])->middleware('permission:findings.manage');

        // ─── Sync ───────────────────────────────────────────
        Route::post('/sync/tenant/{tenantId}', [TenantController::class, 'sync'])->middleware('permission:graph.sync.run');
        Route::get('/sync/tenant/{tenantId}/history', [SyncController::class, 'tenantHistory'])->middleware('permission:tenants.view');
        Route::get('/sync/trends', [SyncController::class, 'trends'])->middleware('permission:tenants.view');

        // ─── Findings ───────────────────────────────────────
        Route::get('/findings', [FindingController::class, 'index'])->middleware('permission:findings.manage');
        Route::get('/findings/{id}', [FindingController::class, 'show'])->middleware('permission:findings.manage');
        Route::post('/findings/bulk-update', [FindingController::class, 'bulkUpdate'])->middleware('permission:findings.manage');

        // ─── Alerts ─────────────────────────────────────────
        Route::get('/alerts', [AlertController::class, 'index'])->middleware('permission:alerts.manage');
        Route::put('/alerts/{alertId}/acknowledge', [AlertController::class, 'acknowledge'])->middleware('permission:alerts.manage');
        Route::put('/alerts/{alertId}/dismiss', [AlertController::class, 'dismiss'])->middleware('permission:alerts.manage');
        Route::post('/alerts/bulk-update', [AlertController::class, 'bulkUpdate'])->middleware('permission:alerts.manage');

        // ─── Recommendations ────────────────────────────────
        Route::get('/recommendations', [RecommendationController::class, 'index'])->middleware('permission:findings.manage');
        Route::put('/recommendations/{id}', [RecommendationController::class, 'update'])->middleware('permission:findings.manage');
        Route::post('/recommendations/bulk-update', [RecommendationController::class, 'bulkUpdate'])->middleware('permission:findings.manage');

        // ─── ConnectWise ────────────────────────────────────
        Route::get('/connectwise/overview', [ConnectWiseController::class, 'overview'])->middleware('permission:integrations.view');
        Route::get('/connectwise/tickets', [ConnectWiseController::class, 'tickets'])->middleware('permission:integrations.view');
        Route::post('/connectwise/tickets', [ConnectWiseController::class, 'createTicket'])->middleware('permission:integrations.manage');
        Route::get('/connectwise/config', [ConnectWiseController::class, 'config'])->middleware('permission:integrations.manage');
        Route::put('/connectwise/config', [ConnectWiseController::class, 'updateConfig'])->middleware('permission:integrations.manage');

        // ─── Notifications ──────────────────────────────────
        Route::get('/notifications/channels', [NotificationController::class, 'channels'])->middleware('permission:identity.view');
        Route::post('/notifications/channels', [NotificationController::class, 'createChannel'])->middleware('permission:settings.manage');
        Route::put('/notifications/channels/{id}', [NotificationController::class, 'updateChannel'])->middleware('permission:settings.manage');
        Route::delete('/notifications/channels/{id}', [NotificationController::class, 'deleteChannel'])->middleware('permission:settings.manage');
        Route::get('/notifications/rules', [NotificationController::class, 'rules'])->middleware('permission:identity.view');
        Route::put('/notifications/rules/{id}', [NotificationController::class, 'updateRule'])->middleware('permission:settings.manage');

        // ─── Remediation ────────────────────────────────────
        Route::get('/remediation', [RemediationController::class, 'index'])->middleware('permission:findings.manage');
        Route::put('/remediation/{id}/execute', [RemediationController::class, 'execute'])->middleware('permission:findings.manage');
        Route::put('/remediation/{id}/complete', [RemediationController::class, 'complete'])->middleware('permission:findings.manage');

        // ─── Tenant Comparison ──────────────────────────────
        Route::get('/tenant-comparison/benchmarks', [TenantComparisonController::class, 'benchmarks'])->middleware('permission:tenants.view');
        Route::get('/tenant-comparison/compare', [TenantComparisonController::class, 'compare'])->middleware('permission:tenants.view');

        // ─── Integrations ───────────────────────────────────
        Route::get('/integrations', [IntegrationController::class, 'index'])->middleware('permission:integrations.view');
        Route::post('/integrations/validate', [IntegrationController::class, 'validateIntegration'])->middleware('permission:integrations.manage');
        Route::get('/playbooks', [IntegrationPlaybookController::class, 'index'])->middleware('permission:integrations.view');
        Route::get('/playbooks/{slug}', [IntegrationPlaybookController::class, 'show'])->middleware('permission:integrations.view');
        Route::post('/playbooks/{slug}/validate', [IntegrationPlaybookController::class, 'validatePlaybook'])->middleware('permission:integrations.manage');

        // ─── Admin ──────────────────────────────────────────
        Route::get('/admin/users', [AdminController::class, 'listUsers'])->middleware('permission:users.manage');
        Route::post('/admin/users', [AdminController::class, 'createUser'])->middleware('permission:users.manage');
        Route::get('/admin/users/{userId}', [AdminController::class, 'getUserDetail'])->middleware('permission:users.manage');
        Route::put('/admin/users/{userId}/roles', [AdminController::class, 'updateUserRole'])->middleware('permission:roles.manage');
        Route::delete('/admin/users/{userId}', [AdminController::class, 'deleteUser'])->middleware('permission:users.manage');
        Route::get('/admin/roles', [AdminController::class, 'listRoles'])->middleware('permission:roles.manage');
        Route::get('/admin/role-permissions', [AdminController::class, 'getRolePermissionMatrix'])->middleware('permission:roles.manage');
        Route::get('/admin/audit-logs', [AdminController::class, 'listAuditLogs'])->middleware('permission:audit.view');

        // ─── Reports (existing) ─────────────────────────────
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
        Route::get('/reports/admin-accounts', [ReportController::class, 'exportAdminAccounts'])->middleware('permission:reports.export');
        Route::get('/reports/guest-users', [ReportController::class, 'exportGuestUsers'])->middleware('permission:reports.export');
        Route::get('/reports/risky-users', [ReportController::class, 'exportRiskyUsers'])->middleware('permission:reports.export');
        Route::get('/reports/conditional-access', [ReportController::class, 'exportConditionalAccess'])->middleware('permission:reports.export');
        Route::get('/reports/sign-in-activity', [ReportController::class, 'exportSignInActivity'])->middleware('permission:reports.export');
        Route::get('/reports/auth-methods', [ReportController::class, 'exportAuthMethods'])->middleware('permission:reports.export');
        Route::get('/reports/alerts', [ReportController::class, 'exportAlerts'])->middleware('permission:reports.export');
        Route::get('/reports/recommendations', [ReportController::class, 'exportRecommendations'])->middleware('permission:reports.export');
        Route::get('/reports/compliance', [ReportController::class, 'exportComplianceControls'])->middleware('permission:reports.export');
        Route::get('/reports/copilot-agents', [ReportController::class, 'exportCopilotAgents'])->middleware('permission:reports.export');
        Route::get('/reports/sync-runs', [ReportController::class, 'exportSyncRuns'])->middleware('permission:reports.export');
        Route::get('/reports/copilot-audit', [ReportController::class, 'exportCopilotAudit'])->middleware('permission:reports.export');

        // ─── Reports (new) ──────────────────────────────────
        Route::get('/reports/mailboxes', [ReportEnhancedController::class, 'exportMailboxes'])->middleware('permission:reports.export');
        Route::get('/reports/forwarding-rules', [ReportEnhancedController::class, 'exportForwardingRules'])->middleware('permission:reports.export');
        Route::get('/reports/groups', [ReportEnhancedController::class, 'exportGroups'])->middleware('permission:reports.export');
        Route::get('/reports/app-registrations', [ReportEnhancedController::class, 'exportAppRegistrations'])->middleware('permission:reports.export');
        Route::get('/reports/teams', [ReportEnhancedController::class, 'exportTeams'])->middleware('permission:reports.export');
        Route::get('/reports/dlp-policies', [ReportEnhancedController::class, 'exportDlpPolicies'])->middleware('permission:reports.export');
        Route::get('/reports/sensitivity-labels', [ReportEnhancedController::class, 'exportSensitivityLabels'])->middleware('permission:reports.export');
        Route::get('/reports/power-apps', [ReportEnhancedController::class, 'exportPowerApps'])->middleware('permission:reports.export');
        Route::get('/reports/power-automate-flows', [ReportEnhancedController::class, 'exportPowerAutomateFlows'])->middleware('permission:reports.export');
        Route::get('/reports/connectwise-tickets', [ReportEnhancedController::class, 'exportConnectWiseTickets'])->middleware('permission:reports.export');
        Route::get('/reports/secure-score-actions', [ReportEnhancedController::class, 'exportSecureScoreActions'])->middleware('permission:reports.export');
        Route::get('/reports/defender-alerts', [ReportEnhancedController::class, 'exportDefenderAlerts'])->middleware('permission:reports.export');
        Route::get('/reports/compliance-policies', [ReportEnhancedController::class, 'exportCompliancePolicies'])->middleware('permission:reports.export');
        Route::get('/reports/license-cost-analysis', [ReportEnhancedController::class, 'exportLicenseCostAnalysis'])->middleware('permission:reports.export');
        Route::get('/reports/password-health', [ReportEnhancedController::class, 'exportPasswordHealth'])->middleware('permission:reports.export');
        Route::get('/reports/tenant-benchmarks', [ReportEnhancedController::class, 'exportTenantBenchmarks'])->middleware('permission:reports.export');

        // ─── Settings ───────────────────────────────────────
        Route::get('/settings/partner-tenant', [PartnerTenantController::class, 'show'])->middleware('permission:settings.view');
        Route::put('/settings/partner-tenant', [PartnerTenantController::class, 'update'])->middleware('permission:settings.manage');
        Route::post('/settings/partner-tenant/test', [PartnerTenantController::class, 'test'])->middleware('permission:settings.manage');
        Route::post('/settings/tenant-discovery/run', [TenantDiscoveryController::class, 'discover'])->middleware('permission:settings.manage');
        Route::post('/settings/tenant-discovery/import', [TenantDiscoveryController::class, 'import'])->middleware('permission:settings.manage');
        Route::get('/settings/group-role-mappings', [GroupRoleMappingController::class, 'index'])->middleware('permission:settings.view');
        Route::put('/settings/group-role-mappings', [GroupRoleMappingController::class, 'update'])->middleware('permission:settings.manage');
        Route::post('/settings/branding/logo', [BrandingController::class, 'uploadLogo'])->middleware('permission:settings.manage');
        Route::delete('/settings/branding/logo', [BrandingController::class, 'deleteLogo'])->middleware('permission:settings.manage');
        Route::get('/settings/group/{group}', [SettingsController::class, 'show'])->middleware('permission:settings.view');
        Route::put('/settings/group/{group}', [SettingsController::class, 'update'])->middleware('permission:settings.manage');
    });
});
