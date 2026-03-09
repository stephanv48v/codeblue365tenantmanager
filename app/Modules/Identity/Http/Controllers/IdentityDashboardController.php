<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class IdentityDashboardController extends Controller
{
    public function overview(): JsonResponse
    {
        $totalUsers = DB::table('users_normalized')->count();
        $enabledUsers = DB::table('users_normalized')->where('account_enabled', true)->count();
        $disabledUsers = $totalUsers - $enabledUsers;

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

        $caPolicies = DB::table('conditional_access_policies')->count();

        $mfaByTenant = DB::table('users_normalized')
            ->join('managed_tenants', 'users_normalized.tenant_id', '=', 'managed_tenants.tenant_id')
            ->where('users_normalized.account_enabled', true)
            ->select([
                'managed_tenants.customer_name',
                'users_normalized.tenant_id',
                DB::raw('COUNT(*) as total_users'),
                DB::raw("SUM(CASE WHEN users_normalized.mfa_registered = 1 THEN 1 ELSE 0 END) as mfa_users"),
            ])
            ->groupBy('managed_tenants.customer_name', 'users_normalized.tenant_id')
            ->orderBy('managed_tenants.customer_name')
            ->get();

        $riskyByLevel = DB::table('risky_users')
            ->select(['risk_level', DB::raw('COUNT(*) as count')])
            ->groupBy('risk_level')
            ->get();

        return ApiResponse::success([
            'total_users' => $totalUsers,
            'enabled_users' => $enabledUsers,
            'disabled_users' => $disabledUsers,
            'mfa_coverage_percent' => $mfaCoveragePercent,
            'mfa_registered' => $mfaRegistered,
            'stale_users' => $staleUsers,
            'risky_users_count' => $riskyUsers,
            'ca_policies_count' => $caPolicies,
            'mfa_by_tenant' => $mfaByTenant,
            'risky_by_level' => $riskyByLevel,
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $query = DB::table('users_normalized')
            ->leftJoin('managed_tenants', 'users_normalized.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'users_normalized.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('users_normalized.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('mfa_status')) {
            $mfaStatus = (string) $request->string('mfa_status');
            if ($mfaStatus === 'registered') {
                $query->where('users_normalized.mfa_registered', true);
            } elseif ($mfaStatus === 'not_registered') {
                $query->where('users_normalized.mfa_registered', false);
            }
        }

        if ($request->boolean('stale')) {
            $query->where('users_normalized.account_enabled', true)
                ->where(function ($q): void {
                    $q->where('users_normalized.last_sign_in_at', '<', now()->subDays(90))
                      ->orWhereNull('users_normalized.last_sign_in_at');
                });
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('users_normalized.display_name', 'like', "%{$search}%")
                  ->orWhere('users_normalized.user_principal_name', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('users_normalized.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $users->items(),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ]);
    }

    public function riskyUsers(Request $request): JsonResponse
    {
        $query = DB::table('risky_users')
            ->leftJoin('managed_tenants', 'risky_users.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'risky_users.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('risky_users.tenant_id', (string) $request->string('tenant_id'));
        }

        $riskyUsers = $query->orderByRaw("CASE risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 WHEN 'none' THEN 4 ELSE 5 END")
            ->get();

        $totalRisky = $riskyUsers->count();
        $highCount = $riskyUsers->where('risk_level', 'high')->count();
        $mediumCount = $riskyUsers->where('risk_level', 'medium')->count();
        $remediatedCount = DB::table('risky_users')
            ->where('risk_state', 'remediated')
            ->count();

        return ApiResponse::success([
            'total' => $totalRisky,
            'high' => $highCount,
            'medium' => $mediumCount,
            'remediated' => $remediatedCount,
            'items' => $riskyUsers,
        ]);
    }

    public function conditionalAccess(Request $request): JsonResponse
    {
        $query = DB::table('conditional_access_policies')
            ->leftJoin('managed_tenants', 'conditional_access_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'conditional_access_policies.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('conditional_access_policies.tenant_id', (string) $request->string('tenant_id'));
        }

        $policies = $query->orderBy('conditional_access_policies.display_name')->get();

        $totalPolicies = $policies->count();
        $enabled = $policies->where('state', 'enabled')->count();
        $reportOnly = $policies->where('state', 'enabledForReportingButNotEnforced')->count();
        $disabled = $policies->where('state', 'disabled')->count();

        return ApiResponse::success([
            'total' => $totalPolicies,
            'enabled' => $enabled,
            'report_only' => $reportOnly,
            'disabled' => $disabled,
            'items' => $policies,
        ]);
    }
}
