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
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $totalUsers = DB::table('users_normalized')->when($tenantId, fn($q, $id) => $q->where('users_normalized.tenant_id', $id))->count();
        $enabledUsers = DB::table('users_normalized')->where('account_enabled', true)->when($tenantId, fn($q, $id) => $q->where('users_normalized.tenant_id', $id))->count();
        $disabledUsers = $totalUsers - $enabledUsers;

        $mfaRegistered = DB::table('users_normalized')
            ->where('account_enabled', true)
            ->where('mfa_registered', true)
            ->when($tenantId, fn($q, $id) => $q->where('users_normalized.tenant_id', $id))
            ->count();
        $mfaCoveragePercent = $enabledUsers > 0 ? round(($mfaRegistered / $enabledUsers) * 100, 1) : 0;

        $staleUsers = DB::table('users_normalized')
            ->where('account_enabled', true)
            ->where(function ($q): void {
                $q->where('last_sign_in_at', '<', now()->subDays(90))
                  ->orWhereNull('last_sign_in_at');
            })
            ->when($tenantId, fn($q, $id) => $q->where('users_normalized.tenant_id', $id))
            ->count();

        $riskyUsers = DB::table('risky_users')
            ->whereIn('risk_level', ['high', 'medium'])
            ->where('risk_state', 'atRisk')
            ->when($tenantId, fn($q, $id) => $q->where('risky_users.tenant_id', $id))
            ->count();

        $caPolicies = DB::table('conditional_access_policies')
            ->when($tenantId, fn($q, $id) => $q->where('conditional_access_policies.tenant_id', $id))
            ->count();

        $enabledNoMfa = DB::table('users_normalized')
            ->where('account_enabled', true)
            ->where('mfa_registered', false)
            ->when($tenantId, fn($q, $id) => $q->where('users_normalized.tenant_id', $id))
            ->count();

        $mfaByTenant = DB::table('users_normalized')
            ->join('managed_tenants', 'users_normalized.tenant_id', '=', 'managed_tenants.tenant_id')
            ->where('users_normalized.account_enabled', true)
            ->when($tenantId, fn($q, $id) => $q->where('users_normalized.tenant_id', $id))
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
            ->when($tenantId, fn($q, $id) => $q->where('risky_users.tenant_id', $id))
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
            'enabled_no_mfa' => $enabledNoMfa,
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

        if ($request->filled('account_enabled')) {
            $enabled = (string) $request->string('account_enabled');
            $query->where('users_normalized.account_enabled', $enabled === 'enabled');
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
                  ->orWhere('users_normalized.user_principal_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
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
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $query = DB::table('risky_users')
            ->leftJoin('managed_tenants', 'risky_users.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'risky_users.*',
                'managed_tenants.customer_name',
            ]);

        if ($tenantId) {
            $query->where('risky_users.tenant_id', $tenantId);
        }

        if ($request->filled('risk_level')) {
            $query->where('risky_users.risk_level', (string) $request->string('risk_level'));
        }

        if ($request->filled('risk_state')) {
            $query->where('risky_users.risk_state', (string) $request->string('risk_state'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('risky_users.display_name', 'like', "%{$search}%")
                  ->orWhere('risky_users.user_principal_name', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderByRaw("CASE risk_level WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 WHEN 'none' THEN 4 ELSE 5 END")
            ->paginate((int) $request->integer('per_page', 25));

        // Stats from unfiltered query (tenant filter only)
        $statsQuery = DB::table('risky_users')
            ->when($tenantId, fn ($q, $id) => $q->where('risky_users.tenant_id', $id));

        $totalRisky = (clone $statsQuery)->count();
        $highCount = (clone $statsQuery)->where('risk_level', 'high')->count();
        $mediumCount = (clone $statsQuery)->where('risk_level', 'medium')->count();
        $remediatedCount = (clone $statsQuery)->where('risk_state', 'remediated')->count();

        return ApiResponse::success([
            'total' => $totalRisky,
            'high' => $highCount,
            'medium' => $mediumCount,
            'remediated' => $remediatedCount,
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
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

        if ($request->filled('state')) {
            $query->where('conditional_access_policies.state', (string) $request->string('state'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where('conditional_access_policies.display_name', 'like', "%{$search}%");
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

    public function authMethods(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $query = DB::table('authentication_method_stats')
            ->join('managed_tenants', 'authentication_method_stats.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn ($q, $id) => $q->where('authentication_method_stats.tenant_id', $id));

        if ($tenantId) {
            $row = $query->select(['authentication_method_stats.*', 'managed_tenants.customer_name'])->first();

            $totalUsers = $row->total_users ?? 0;
            $mfaCapable = $row->mfa_capable_users ?? 0;
            $authApp = $row->authenticator_app_count ?? 0;
            $fido2 = $row->fido2_count ?? 0;
            $windowsHello = $row->windows_hello_count ?? 0;
            $phoneSms = $row->phone_sms_count ?? 0;
            $phoneCall = $row->phone_call_count ?? 0;
            $emailOtp = $row->email_otp_count ?? 0;
            $passwordOnly = $row->password_only_count ?? 0;
            $passwordless = $row->passwordless_count ?? 0;
            $ssprCapable = $row->sspr_capable_count ?? 0;
            $ssprRegistered = $row->sspr_registered_count ?? 0;
        } else {
            $agg = DB::table('authentication_method_stats')
                ->selectRaw('
                    SUM(total_users) as total_users,
                    SUM(mfa_capable_users) as mfa_capable_users,
                    SUM(authenticator_app_count) as authenticator_app_count,
                    SUM(fido2_count) as fido2_count,
                    SUM(windows_hello_count) as windows_hello_count,
                    SUM(phone_sms_count) as phone_sms_count,
                    SUM(phone_call_count) as phone_call_count,
                    SUM(email_otp_count) as email_otp_count,
                    SUM(password_only_count) as password_only_count,
                    SUM(passwordless_count) as passwordless_count,
                    SUM(sspr_capable_count) as sspr_capable_count,
                    SUM(sspr_registered_count) as sspr_registered_count
                ')
                ->first();

            $totalUsers = (int) ($agg->total_users ?? 0);
            $mfaCapable = (int) ($agg->mfa_capable_users ?? 0);
            $authApp = (int) ($agg->authenticator_app_count ?? 0);
            $fido2 = (int) ($agg->fido2_count ?? 0);
            $windowsHello = (int) ($agg->windows_hello_count ?? 0);
            $phoneSms = (int) ($agg->phone_sms_count ?? 0);
            $phoneCall = (int) ($agg->phone_call_count ?? 0);
            $emailOtp = (int) ($agg->email_otp_count ?? 0);
            $passwordOnly = (int) ($agg->password_only_count ?? 0);
            $passwordless = (int) ($agg->passwordless_count ?? 0);
            $ssprCapable = (int) ($agg->sspr_capable_count ?? 0);
            $ssprRegistered = (int) ($agg->sspr_registered_count ?? 0);
        }

        $byTenant = DB::table('authentication_method_stats')
            ->join('managed_tenants', 'authentication_method_stats.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn ($q, $id) => $q->where('authentication_method_stats.tenant_id', $id))
            ->select(['authentication_method_stats.*', 'managed_tenants.customer_name'])
            ->orderBy('managed_tenants.customer_name')
            ->get();

        return ApiResponse::success([
            'total_users' => $totalUsers,
            'mfa_capable_users' => $mfaCapable,
            'mfa_capable_pct' => round($mfaCapable / max($totalUsers, 1) * 100, 1),
            'methods' => [
                'authenticator_app' => $authApp,
                'fido2' => $fido2,
                'windows_hello' => $windowsHello,
                'phone_sms' => $phoneSms,
                'phone_call' => $phoneCall,
                'email_otp' => $emailOtp,
                'password_only' => $passwordOnly,
                'passwordless' => $passwordless,
            ],
            'sspr' => [
                'capable' => $ssprCapable,
                'registered' => $ssprRegistered,
                'registered_pct' => round($ssprRegistered / max($ssprCapable, 1) * 100, 1),
            ],
            'by_tenant' => $byTenant,
        ]);
    }

    public function adminAccounts(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $query = DB::table('directory_role_assignments')
            ->leftJoin('managed_tenants', 'directory_role_assignments.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'directory_role_assignments.*',
                'managed_tenants.customer_name',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('directory_role_assignments.tenant_id', $id));

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('directory_role_assignments.display_name', 'like', "%{$search}%")
                  ->orWhere('directory_role_assignments.user_principal_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('role')) {
            $query->where('directory_role_assignments.role_display_name', (string) $request->string('role'));
        }

        if ($request->filled('status')) {
            $query->where('directory_role_assignments.status', (string) $request->string('status'));
        }

        $paginated = $query->orderBy('directory_role_assignments.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        // Stats from unfiltered query (tenant filter only)
        $statsBase = DB::table('directory_role_assignments')
            ->when($tenantId, fn ($q, $id) => $q->where('directory_role_assignments.tenant_id', $id));

        $totalAdmins = (clone $statsBase)->distinct('user_id')->count('user_id');
        $globalAdmins = (clone $statsBase)->where('role_display_name', 'Global Administrator')->count();
        $rolesInUse = (clone $statsBase)->distinct('role_display_name')->count('role_display_name');
        $pimEligible = (clone $statsBase)->where('status', 'eligible')->count();

        $byRole = DB::table('directory_role_assignments')
            ->when($tenantId, fn ($q, $id) => $q->where('directory_role_assignments.tenant_id', $id))
            ->select(['role_display_name', DB::raw('COUNT(*) as count')])
            ->groupBy('role_display_name')
            ->orderByDesc('count')
            ->get();

        $excessiveAdmins = DB::table('directory_role_assignments')
            ->join('managed_tenants', 'directory_role_assignments.tenant_id', '=', 'managed_tenants.tenant_id')
            ->where('directory_role_assignments.role_display_name', 'Global Administrator')
            ->when($tenantId, fn ($q, $id) => $q->where('directory_role_assignments.tenant_id', $id))
            ->select([
                'directory_role_assignments.tenant_id',
                'managed_tenants.customer_name',
                DB::raw('COUNT(*) as global_admin_count'),
            ])
            ->groupBy('directory_role_assignments.tenant_id', 'managed_tenants.customer_name')
            ->having(DB::raw('COUNT(*)'), '>', 3)
            ->orderByDesc('global_admin_count')
            ->get();

        return ApiResponse::success([
            'total_admins' => $totalAdmins,
            'global_admins' => $globalAdmins,
            'roles_in_use' => $rolesInUse,
            'pim_eligible' => $pimEligible,
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
            'by_role' => $byRole,
            'tenants_with_excessive_admins' => $excessiveAdmins,
        ]);
    }

    public function guestUsers(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $query = DB::table('guest_users')
            ->leftJoin('managed_tenants', 'guest_users.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'guest_users.*',
                'managed_tenants.customer_name',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('guest_users.tenant_id', $id));

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('guest_users.display_name', 'like', "%{$search}%")
                  ->orWhere('guest_users.user_principal_name', 'like', "%{$search}%")
                  ->orWhere('guest_users.mail', 'like', "%{$search}%");
            });
        }

        if ($request->filled('state')) {
            $state = (string) $request->string('state');
            match ($state) {
                'stale' => $query->where('guest_users.account_enabled', true)
                    ->where(function ($q): void {
                        $q->where('guest_users.last_sign_in_at', '<', now()->subDays(90))
                          ->orWhereNull('guest_users.last_sign_in_at');
                    }),
                'active' => $query->where('guest_users.account_enabled', true)
                    ->where('guest_users.last_sign_in_at', '>=', now()->subDays(90)),
                'pending' => $query->where('guest_users.external_user_state', 'PendingAcceptance'),
                'disabled' => $query->where('guest_users.account_enabled', false),
                default => null,
            };
        }

        $paginated = $query->orderBy('guest_users.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        // Stats from unfiltered query (tenant filter only)
        $statsBase = DB::table('guest_users')
            ->when($tenantId, fn ($q, $id) => $q->where('guest_users.tenant_id', $id));

        $totalGuests = (clone $statsBase)->count();
        $activeGuests = (clone $statsBase)
            ->where('account_enabled', true)
            ->where('last_sign_in_at', '>=', now()->subDays(90))
            ->count();
        $staleGuests = (clone $statsBase)
            ->where('account_enabled', true)
            ->where(function ($q): void {
                $q->where('last_sign_in_at', '<', now()->subDays(90))
                  ->orWhereNull('last_sign_in_at');
            })
            ->count();
        $pendingAcceptance = (clone $statsBase)
            ->where('external_user_state', 'PendingAcceptance')
            ->count();
        $disabledGuests = (clone $statsBase)
            ->where('account_enabled', false)
            ->count();

        $byDomain = DB::table('guest_users')
            ->when($tenantId, fn ($q, $id) => $q->where('guest_users.tenant_id', $id))
            ->select(['domain', DB::raw('COUNT(*) as count')])
            ->groupBy('domain')
            ->orderByDesc('count')
            ->limit(15)
            ->get();

        return ApiResponse::success([
            'total_guests' => $totalGuests,
            'active_guests' => $activeGuests,
            'stale_guests' => $staleGuests,
            'pending_acceptance' => $pendingAcceptance,
            'disabled_guests' => $disabledGuests,
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
            'by_domain' => $byDomain,
        ]);
    }

    public function signInActivity(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $baseQuery = DB::table('sign_in_summaries')
            ->where('date', '>=', now()->subDays(30))
            ->when($tenantId, fn ($q, $id) => $q->where('sign_in_summaries.tenant_id', $id));

        $agg = (clone $baseQuery)
            ->selectRaw('
                SUM(total_sign_ins) as total_sign_ins,
                SUM(successful_sign_ins) as successful,
                SUM(failed_sign_ins) as failed,
                SUM(unique_users) as unique_users
            ')
            ->first();

        $totalSignIns = (int) ($agg->total_sign_ins ?? 0);
        $successful = (int) ($agg->successful ?? 0);
        $failed = (int) ($agg->failed ?? 0);
        $uniqueUsers = (int) ($agg->unique_users ?? 0);
        $successRate = $totalSignIns > 0 ? round(($successful / $totalSignIns) * 100, 1) : 0;

        $trend = (clone $baseQuery)
            ->select([
                'date as date',
                DB::raw('SUM(successful_sign_ins) as successful'),
                DB::raw('SUM(failed_sign_ins) as failed'),
            ])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $failureReasons = (clone $baseQuery)
            ->whereNotNull('top_failure_reason')
            ->select([
                'top_failure_reason as reason',
                DB::raw('SUM(top_failure_count) as count'),
            ])
            ->groupBy('top_failure_reason')
            ->orderByDesc('count')
            ->get();

        // Parse by_location JSON and aggregate counts across all rows
        $locationRows = (clone $baseQuery)
            ->whereNotNull('by_location')
            ->pluck('by_location');

        $locationCounts = [];
        foreach ($locationRows as $locationJson) {
            $locations = json_decode($locationJson, true);
            if (is_array($locations)) {
                foreach ($locations as $loc) {
                    $country = $loc['country'] ?? 'Unknown';
                    $city = $loc['city'] ?? 'Unknown';
                    $key = "{$country}|{$city}";
                    $count = (int) ($loc['count'] ?? 0);
                    if (! isset($locationCounts[$key])) {
                        $locationCounts[$key] = ['country' => $country, 'city' => $city, 'count' => 0];
                    }
                    $locationCounts[$key]['count'] += $count;
                }
            }
        }
        usort($locationCounts, fn ($a, $b) => $b['count'] <=> $a['count']);
        $topLocations = array_slice($locationCounts, 0, 10);

        $byTenant = DB::table('sign_in_summaries')
            ->join('managed_tenants', 'sign_in_summaries.tenant_id', '=', 'managed_tenants.tenant_id')
            ->where('sign_in_summaries.date', '>=', now()->subDays(30))
            ->when($tenantId, fn ($q, $id) => $q->where('sign_in_summaries.tenant_id', $id))
            ->select([
                'sign_in_summaries.tenant_id',
                'managed_tenants.customer_name',
                DB::raw('SUM(total_sign_ins) as total'),
                DB::raw('SUM(failed_sign_ins) as failed'),
            ])
            ->groupBy('sign_in_summaries.tenant_id', 'managed_tenants.customer_name')
            ->orderBy('managed_tenants.customer_name')
            ->get()
            ->map(fn ($row) => [
                'tenant_id' => $row->tenant_id,
                'customer_name' => $row->customer_name,
                'total' => (int) $row->total,
                'failed' => (int) $row->failed,
                'success_rate' => $row->total > 0 ? round((($row->total - $row->failed) / $row->total) * 100, 1) : 0,
            ]);

        return ApiResponse::success([
            'total_sign_ins_30d' => $totalSignIns,
            'success_rate' => $successRate,
            'failed_sign_ins_30d' => $failed,
            'unique_users_30d' => $uniqueUsers,
            'trend' => $trend,
            'failure_reasons' => $failureReasons,
            'top_locations' => $topLocations,
            'by_tenant' => $byTenant,
        ]);
    }
}
