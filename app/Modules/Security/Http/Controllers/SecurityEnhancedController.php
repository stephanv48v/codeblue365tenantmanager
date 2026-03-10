<?php

declare(strict_types=1);

namespace App\Modules\Security\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class SecurityEnhancedController extends Controller
{
    public function secureScoreActions(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $baseQuery = DB::table('secure_score_actions')
            ->when($tenantId, fn ($q, $id) => $q->where('secure_score_actions.tenant_id', $id));

        $totalActions = (clone $baseQuery)->count();
        $completed = (clone $baseQuery)->where('implementation_status', 'completed')->count();
        $inProgress = (clone $baseQuery)->where('implementation_status', 'inprogress')->count();
        $riskAccepted = (clone $baseQuery)->where('implementation_status', 'riskaccepted')->count();

        $maxScoreTotal = (float) (clone $baseQuery)->sum('max_score');
        $currentScoreTotal = (float) (clone $baseQuery)->sum('current_score');
        $potentialPointsGain = round($maxScoreTotal - $currentScoreTotal, 1);

        $byCategory = DB::table('secure_score_actions')
            ->when($tenantId, fn ($q, $id) => $q->where('secure_score_actions.tenant_id', $id))
            ->select([
                'category',
                DB::raw('SUM(current_score) as current_score'),
                DB::raw('SUM(max_score) as max_score'),
            ])
            ->groupBy('category')
            ->orderBy('category')
            ->get();

        // Paginated list with filters
        $query = DB::table('secure_score_actions')
            ->leftJoin('managed_tenants', 'secure_score_actions.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'secure_score_actions.id',
                'secure_score_actions.tenant_id',
                'managed_tenants.customer_name',
                'secure_score_actions.title',
                'secure_score_actions.category',
                'secure_score_actions.max_score',
                'secure_score_actions.current_score',
                'secure_score_actions.implementation_status as status',
                'secure_score_actions.user_impact',
                'secure_score_actions.remediation_description',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('secure_score_actions.tenant_id', $id));

        if ($request->filled('status')) {
            $query->where('secure_score_actions.implementation_status', (string) $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('secure_score_actions.category', (string) $request->string('category'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('secure_score_actions.title', 'like', "%{$search}%")
                  ->orWhere('secure_score_actions.category', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderBy('secure_score_actions.category')
            ->orderBy('secure_score_actions.title')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'summary' => [
                'total_actions' => $totalActions,
                'completed' => $completed,
                'in_progress' => $inProgress,
                'risk_accepted' => $riskAccepted,
                'potential_points_gain' => $potentialPointsGain,
            ],
            'actions' => $paginated->items(),
            'score_by_category' => $byCategory,
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    public function defenderAlerts(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $baseQuery = DB::table('defender_alerts')
            ->when($tenantId, fn ($q, $id) => $q->where('defender_alerts.tenant_id', $id));

        $totalAlerts = (clone $baseQuery)->count();
        $highSeverity = (clone $baseQuery)->where('severity', 'high')->count();
        $inProgressCount = (clone $baseQuery)->where('status', 'inProgress')->count();
        $resolvedCount = (clone $baseQuery)->where('status', 'resolved')->count();

        // Paginated list with filters
        $query = DB::table('defender_alerts')
            ->leftJoin('managed_tenants', 'defender_alerts.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'defender_alerts.id',
                'defender_alerts.tenant_id',
                'managed_tenants.customer_name',
                'defender_alerts.title',
                'defender_alerts.severity',
                'defender_alerts.category',
                'defender_alerts.status',
                'defender_alerts.service_source',
                'defender_alerts.detection_source',
                'defender_alerts.assigned_to',
                'defender_alerts.first_activity_date',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('defender_alerts.tenant_id', $id));

        if ($request->filled('severity')) {
            $query->where('defender_alerts.severity', (string) $request->string('severity'));
        }

        if ($request->filled('status')) {
            $query->where('defender_alerts.status', (string) $request->string('status'));
        }

        if ($request->filled('category')) {
            $query->where('defender_alerts.category', (string) $request->string('category'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('defender_alerts.title', 'like', "%{$search}%")
                  ->orWhere('defender_alerts.description', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderByRaw("CASE defender_alerts.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 WHEN 'informational' THEN 4 ELSE 5 END")
            ->orderByDesc('defender_alerts.first_activity_date')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'summary' => [
                'total_alerts' => $totalAlerts,
                'high_severity' => $highSeverity,
                'in_progress' => $inProgressCount,
                'resolved' => $resolvedCount,
            ],
            'alerts' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    public function securityDefaults(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $query = DB::table('security_defaults')
            ->leftJoin('managed_tenants', 'security_defaults.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'security_defaults.*',
                'managed_tenants.customer_name',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('security_defaults.tenant_id', $id))
            ->orderBy('managed_tenants.customer_name');

        $records = $query->get();

        $totalTenants = $records->count();
        $securityDefaultsEnabled = $records->where('security_defaults_enabled', true)->count();
        $perUserMfaEnforced = $records->where('per_user_mfa_enforced', true)->count();
        $legacyAuthBlocked = $records->where('legacy_auth_blocked', true)->count();

        return ApiResponse::success([
            'total_tenants' => $totalTenants,
            'security_defaults_enabled' => $securityDefaultsEnabled,
            'per_user_mfa_enforced' => $perUserMfaEnforced,
            'legacy_auth_blocked' => $legacyAuthBlocked,
            'items' => $records,
        ]);
    }
}
