<?php

declare(strict_types=1);

namespace App\Modules\Tenants\Http\Controllers;

use App\Modules\Ingestion\Application\Services\TenantSyncPipelineService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenants = DB::table('managed_tenants')
            ->select([
                'id',
                'tenant_id',
                'customer_name',
                'primary_domain',
                'gdap_status',
                'gdap_expiry_at',
                'integration_status',
                'last_sync_at',
                'assigned_engineer',
                'support_tier',
            ])
            ->orderBy('customer_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $tenants->items(),
            'pagination' => [
                'total' => $tenants->total(),
                'per_page' => $tenants->perPage(),
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
            ],
        ]);
    }

    public function show(string $tenantId): JsonResponse
    {
        $tenant = DB::table('managed_tenants')->where('tenant_id', $tenantId)->first();

        if ($tenant === null) {
            return ApiResponse::error('tenant_not_found', 'Tenant not found.', 404);
        }

        $domains = DB::table('tenant_domains')
            ->where('managed_tenant_id', $tenant->id)
            ->orderBy('domain')
            ->pluck('domain');

        $gdapRelationships = DB::table('gdap_relationships')
            ->where('managed_tenant_id', $tenant->id)
            ->orderByDesc('starts_at')
            ->get();

        $scores = DB::table('scores')
            ->where('tenant_id', $tenantId)
            ->orderByDesc('calculated_at')
            ->limit(10)
            ->get();

        $findings = DB::table('findings')
            ->where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->orderByDesc('last_detected_at')
            ->get();

        return ApiResponse::success([
            'tenant' => $tenant,
            'domains' => $domains,
            'gdap_relationships' => $gdapRelationships,
            'scores' => $scores,
            'findings' => $findings,
        ]);
    }

    public function dashboardStats(): JsonResponse
    {
        $tenantCount = DB::table('managed_tenants')->count();
        $openFindings = DB::table('findings')->where('status', 'open')->count();
        $playbookCount = DB::table('integration_playbooks')->where('is_active', true)->count();
        $integrationCount = DB::table('integrations')->count();

        $gdapActive = DB::table('gdap_relationships')->where('status', 'active')->count();
        $gdapExpiringSoon = DB::table('gdap_relationships')
            ->where('status', 'active')
            ->where('expires_at', '<=', now()->addDays(30))
            ->where('expires_at', '>', now())
            ->count();

        $criticalFindings = DB::table('findings')
            ->where('status', 'open')
            ->where('severity', 'critical')
            ->count();

        $highFindings = DB::table('findings')
            ->where('status', 'open')
            ->where('severity', 'high')
            ->count();

        $recentScores = DB::table('scores')
            ->join('managed_tenants', 'scores.tenant_id', '=', 'managed_tenants.tenant_id')
            ->orderByDesc('scores.calculated_at')
            ->limit(20)
            ->get([
                'scores.tenant_id',
                'managed_tenants.customer_name',
                'scores.composite_score',
                'scores.identity_currency',
                'scores.device_currency',
                'scores.app_currency',
                'scores.security_posture',
                'scores.governance_readiness',
                'scores.integration_readiness',
                'scores.calculated_at',
            ]);

        $avgComposite = $recentScores->count() > 0
            ? round($recentScores->avg('composite_score'), 1)
            : 0;

        return ApiResponse::success([
            'tenants' => $tenantCount,
            'open_findings' => $openFindings,
            'critical_findings' => $criticalFindings,
            'high_findings' => $highFindings,
            'playbooks' => $playbookCount,
            'integrations' => $integrationCount,
            'gdap_active' => $gdapActive,
            'gdap_expiring_soon' => $gdapExpiringSoon,
            'avg_composite_score' => $avgComposite,
            'recent_scores' => $recentScores,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'string', 'max:128', 'unique:managed_tenants,tenant_id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'primary_domain' => ['required', 'string', 'max:255'],
            'support_tier' => ['nullable', 'string', 'max:64'],
            'assigned_engineer' => ['nullable', 'string', 'max:255'],
        ]);

        $id = DB::table('managed_tenants')->insertGetId([
            'tenant_id' => $validated['tenant_id'],
            'customer_name' => $validated['customer_name'],
            'primary_domain' => $validated['primary_domain'],
            'support_tier' => $validated['support_tier'] ?? null,
            'assigned_engineer' => $validated['assigned_engineer'] ?? null,
            'gdap_status' => 'unknown',
            'integration_status' => 'not_configured',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ApiResponse::success(['id' => $id], 201);
    }

    public function sync(string $tenantId, TenantSyncPipelineService $tenantSyncPipelineService): JsonResponse
    {
        $tenantSyncPipelineService->dispatch($tenantId);

        return ApiResponse::success([
            'message' => 'Tenant sync pipeline queued.',
            'tenant_id' => $tenantId,
        ], 202);
    }

    public function integrationHealth(): JsonResponse
    {
        $integrations = DB::table('integrations')->get(['id', 'slug', 'name', 'status']);

        $syncStats = DB::table('sync_runs')
            ->select([
                'sync_job',
                DB::raw('COUNT(*) as total_runs'),
                DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful"),
                DB::raw("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed"),
                DB::raw('MAX(finished_at) as last_run'),
            ])
            ->groupBy('sync_job')
            ->get();

        $recentErrors = DB::table('sync_runs')
            ->where('status', 'failed')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get(['tenant_id', 'sync_job', 'started_at', 'finished_at']);

        return ApiResponse::success([
            'integrations' => $integrations,
            'sync_stats' => $syncStats,
            'recent_errors' => $recentErrors,
        ]);
    }

    public function securityStats(): JsonResponse
    {
        $findingsBySeverity = DB::table('findings')
            ->where('status', 'open')
            ->select(['severity', DB::raw('COUNT(*) as count')])
            ->groupBy('severity')
            ->get();

        $findingsByCategory = DB::table('findings')
            ->where('status', 'open')
            ->select(['category', DB::raw('COUNT(*) as count')])
            ->groupBy('category')
            ->get();

        $scoreDistribution = DB::table('scores')
            ->join('managed_tenants', 'scores.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'scores.tenant_id',
                'managed_tenants.customer_name',
                'scores.security_posture',
                'scores.composite_score',
                'scores.calculated_at',
            ])
            ->whereIn('scores.id', function ($query): void {
                $query->selectRaw('MAX(id)')
                    ->from('scores')
                    ->groupBy('tenant_id');
            })
            ->orderByDesc('scores.composite_score')
            ->get();

        $gdapCoverage = DB::table('managed_tenants')
            ->select([
                DB::raw("SUM(CASE WHEN gdap_status = 'active' THEN 1 ELSE 0 END) as active"),
                DB::raw("SUM(CASE WHEN gdap_status = 'expired' THEN 1 ELSE 0 END) as expired"),
                DB::raw("SUM(CASE WHEN gdap_status = 'unknown' THEN 1 ELSE 0 END) as unknown"),
                DB::raw('COUNT(*) as total'),
            ])
            ->first();

        return ApiResponse::success([
            'findings_by_severity' => $findingsBySeverity,
            'findings_by_category' => $findingsByCategory,
            'score_distribution' => $scoreDistribution,
            'gdap_coverage' => $gdapCoverage,
        ]);
    }

    public function operationsStats(): JsonResponse
    {
        $recentSyncRuns = DB::table('sync_runs')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get(['id', 'tenant_id', 'sync_job', 'status', 'records_processed', 'started_at', 'finished_at']);

        $syncSummary = DB::table('sync_runs')
            ->select([
                DB::raw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed"),
                DB::raw("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed"),
                DB::raw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending"),
                DB::raw('COUNT(*) as total'),
            ])
            ->first();

        $staleTenants = DB::table('managed_tenants')
            ->where(function ($q): void {
                $q->where('last_sync_at', '<', now()->subDays(7))
                    ->orWhereNull('last_sync_at');
            })
            ->orderBy('last_sync_at')
            ->limit(20)
            ->get(['tenant_id', 'customer_name', 'last_sync_at']);

        $openAlerts = DB::table('alerts')
            ->where('status', 'open')
            ->count();

        return ApiResponse::success([
            'recent_sync_runs' => $recentSyncRuns,
            'sync_summary' => $syncSummary,
            'stale_tenants' => $staleTenants,
            'open_alerts' => $openAlerts,
        ]);
    }

    public function identityLicensingSummary(): JsonResponse
    {
        $enabledUsers = DB::table('users_normalized')->where('account_enabled', true)->count();
        $mfaRegistered = DB::table('users_normalized')
            ->where('account_enabled', true)
            ->where('mfa_registered', true)
            ->count();
        $mfaCoveragePercent = $enabledUsers > 0 ? round(($mfaRegistered / $enabledUsers) * 100, 1) : 0;

        $staleUsers = DB::table('users_normalized')
            ->where('account_enabled', true)
            ->where(function ($q): void {
                $q->where('last_sign_in_at', '<', now()->subDays(90))
                  ->orWhereNull('last_sign_in_at');
            })
            ->count();

        $riskyUsers = DB::table('risky_users')
            ->whereIn('risk_level', ['high', 'medium'])
            ->where('risk_state', 'atRisk')
            ->count();

        $totalLicenses = (int) DB::table('licenses')->sum('total_units');
        $assignedLicenses = (int) DB::table('licenses')->sum('assigned_units');
        $licenseWastePercent = $totalLicenses > 0
            ? round((($totalLicenses - $assignedLicenses) / $totalLicenses) * 100, 1)
            : 0;

        return ApiResponse::success([
            'mfa_coverage_percent' => $mfaCoveragePercent,
            'stale_users' => $staleUsers,
            'risky_users' => $riskyUsers,
            'total_licenses' => $totalLicenses,
            'assigned_licenses' => $assignedLicenses,
            'license_waste_percent' => $licenseWastePercent,
        ]);
    }

    public function findings(Request $request): JsonResponse
    {
        $query = DB::table('findings')->orderByDesc('last_detected_at');

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', (string) $request->string('tenant_id'));
        }

        $findings = $query->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $findings->items(),
            'pagination' => [
                'total' => $findings->total(),
                'per_page' => $findings->perPage(),
                'current_page' => $findings->currentPage(),
                'last_page' => $findings->lastPage(),
            ],
        ]);
    }
}
