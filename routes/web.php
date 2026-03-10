<?php

declare(strict_types=1);

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn () => redirect('/dashboard'));
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->name('login.attempt');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::middleware(['auth'])->group(function (): void {
    // ─── Dashboard ──────────────────────────────────────────
    Route::get('/dashboard', fn () => Inertia::render('Dashboard/Index'));

    // ─── Tenants ────────────────────────────────────────────
    Route::get('/tenants', fn () => Inertia::render('Tenants/Index'));
    Route::get('/tenants/{tenantId}', fn (string $tenantId) => Inertia::render('Tenants/Show', ['tenantId' => $tenantId]));
    Route::get('/tenant-comparison', fn () => Inertia::render('TenantComparison/Index'));

    // ─── Identity ───────────────────────────────────────────
    Route::get('/identity', fn () => Inertia::render('Identity/Index'));
    Route::get('/identity/users', fn () => Inertia::render('Identity/Users'));
    Route::get('/identity/risky-users', fn () => Inertia::render('Identity/RiskyUsers'));
    Route::get('/identity/conditional-access', fn () => Inertia::render('Identity/ConditionalAccess'));
    Route::get('/identity/auth-methods', fn () => Inertia::render('Identity/AuthMethods'));
    Route::get('/identity/admin-accounts', fn () => Inertia::render('Identity/AdminAccounts'));
    Route::get('/identity/guest-users', fn () => Inertia::render('Identity/GuestUsers'));
    Route::get('/identity/sign-in-activity', fn () => Inertia::render('Identity/SignInActivity'));
    Route::get('/identity/password-health', fn () => Inertia::render('Identity/PasswordHealth'));
    Route::get('/identity/pim', fn () => Inertia::render('Identity/PimActivations'));

    // ─── Email & Exchange ───────────────────────────────────
    Route::get('/exchange', fn () => Inertia::render('Exchange/Index'));
    Route::get('/exchange/forwarding', fn () => Inertia::render('Exchange/Forwarding'));
    Route::get('/exchange/mail-flow', fn () => Inertia::render('Exchange/MailFlow'));
    Route::get('/exchange/distribution-lists', fn () => Inertia::render('Exchange/DistributionLists'));

    // ─── Groups ─────────────────────────────────────────────
    Route::get('/groups', fn () => Inertia::render('Groups/Index'));

    // ─── Teams ──────────────────────────────────────────────
    Route::get('/teams', fn () => Inertia::render('Teams/Index'));
    Route::get('/teams/usage', fn () => Inertia::render('Teams/Usage'));

    // ─── Copilot ────────────────────────────────────────────
    Route::get('/copilot', fn () => Inertia::render('Copilot/Index'));
    Route::get('/copilot/usage', fn () => Inertia::render('Copilot/Usage'));
    Route::get('/copilot/agents', fn () => Inertia::render('Copilot/Agents'));
    Route::get('/copilot/sharepoint', fn () => Inertia::render('Copilot/SharePoint'));
    Route::get('/copilot/audit', fn () => Inertia::render('Copilot/Audit'));

    // ─── Devices ────────────────────────────────────────────
    Route::get('/devices', fn () => Inertia::render('Devices/Index'));
    Route::get('/devices/compliance-policies', fn () => Inertia::render('Devices/CompliancePolicies'));
    Route::get('/devices/autopilot', fn () => Inertia::render('Devices/Autopilot'));

    // ─── App Registrations ──────────────────────────────────
    Route::get('/app-registrations', fn () => Inertia::render('AppRegistrations/Index'));

    // ─── Security & Compliance ──────────────────────────────
    Route::get('/security', fn () => Inertia::render('Security/Index'));
    Route::get('/security/posture', fn () => Inertia::render('Security/Posture'));
    Route::get('/security/score-actions', fn () => Inertia::render('Security/SecureScoreActions'));
    Route::get('/security/defender-alerts', fn () => Inertia::render('Security/DefenderAlerts'));
    Route::get('/security/recommendations', fn () => Inertia::render('Security/Recommendations'));
    Route::get('/security/compliance', fn () => Inertia::render('Security/Compliance'));
    Route::get('/findings', fn () => Inertia::render('Findings/Index'));
    Route::get('/alerts', fn () => Inertia::render('Alerts/Index'));

    // ─── DLP & Sensitivity Labels ───────────────────────────
    Route::get('/dlp', fn () => Inertia::render('Dlp/Index'));
    Route::get('/dlp/labels', fn () => Inertia::render('Dlp/Labels'));

    // ─── Licensing ──────────────────────────────────────────
    Route::get('/licensing', fn () => Inertia::render('Licensing/Index'));
    Route::get('/licensing/cost-analysis', fn () => Inertia::render('Licensing/CostAnalysis'));

    // ─── Power Platform ─────────────────────────────────────
    Route::get('/power-platform', fn () => Inertia::render('PowerPlatform/Index'));
    Route::get('/power-platform/flows', fn () => Inertia::render('PowerPlatform/Flows'));

    // ─── Service Health ─────────────────────────────────────
    Route::get('/service-health', fn () => Inertia::render('ServiceHealth/Index'));

    // ─── Integrations ───────────────────────────────────────
    Route::get('/integrations', fn () => Inertia::render('Integrations/Index'));
    Route::get('/integrations/health', fn () => Inertia::render('Integrations/Health'));
    Route::get('/playbooks', fn () => Inertia::render('Playbooks/Index'));
    Route::get('/playbooks/{slug}', fn (string $slug) => Inertia::render('Playbooks/Show', ['slug' => $slug]));

    // ─── ConnectWise ────────────────────────────────────────
    Route::get('/connectwise', fn () => Inertia::render('ConnectWise/Index'));

    // ─── Operations ─────────────────────────────────────────
    Route::get('/operations', fn () => Inertia::render('Operations/Index'));
    Route::get('/remediation', fn () => Inertia::render('Remediation/Index'));
    Route::get('/reports', fn () => Inertia::render('Reports/Index'));

    // ─── Administration ─────────────────────────────────────
    Route::get('/admin', fn () => Inertia::render('Admin/Index'));
    Route::get('/settings', fn () => Inertia::render('Settings/Index'));
    Route::get('/notifications', fn () => Inertia::render('Notifications/Index'));
});
