<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class IdentityEnhancedController extends Controller
{
    public function passwordHealth(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $baseQuery = DB::table('password_policies')
            ->when($tenantId, fn ($q, $id) => $q->where('password_policies.tenant_id', $id));

        $expiringWithin30d = (clone $baseQuery)
            ->whereNotNull('password_expiry_date')
            ->where('password_expiry_date', '>=', now()->toDateString())
            ->where('password_expiry_date', '<=', now()->addDays(30)->toDateString())
            ->count();

        $neverExpires = (clone $baseQuery)
            ->where('password_never_expires', true)
            ->count();

        $legacyAuth = (clone $baseQuery)
            ->where('uses_legacy_auth', true)
            ->count();

        $breakGlass = (clone $baseQuery)
            ->where('is_break_glass_account', true)
            ->count();

        // Paginated list
        $query = DB::table('password_policies')
            ->leftJoin('managed_tenants', 'password_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'password_policies.id',
                'password_policies.tenant_id',
                'managed_tenants.customer_name',
                'password_policies.user_principal_name',
                'password_policies.display_name',
                'password_policies.password_last_set',
                'password_policies.password_expiry_date',
                'password_policies.password_never_expires as never_expires',
                'password_policies.uses_legacy_auth',
                'password_policies.is_break_glass_account as is_break_glass',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('password_policies.tenant_id', $id));

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('password_policies.display_name', 'like', "%{$search}%")
                  ->orWhere('password_policies.user_principal_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('filter')) {
            $filter = (string) $request->string('filter');
            match ($filter) {
                'expiring' => $query->whereNotNull('password_policies.password_expiry_date')
                    ->where('password_policies.password_expiry_date', '>=', now()->toDateString())
                    ->where('password_policies.password_expiry_date', '<=', now()->addDays(30)->toDateString()),
                'never_expires' => $query->where('password_policies.password_never_expires', true),
                'legacy_auth' => $query->where('password_policies.uses_legacy_auth', true),
                'break_glass' => $query->where('password_policies.is_break_glass_account', true),
                default => null,
            };
        }

        $paginated = $query->orderBy('password_policies.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'summary' => [
                'expiring_within_30d' => $expiringWithin30d,
                'never_expire_accounts' => $neverExpires,
                'legacy_auth_users' => $legacyAuth,
                'break_glass_accounts' => $breakGlass,
            ],
            'users' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    public function pimActivations(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $baseQuery = DB::table('pim_role_activations')
            ->when($tenantId, fn ($q, $id) => $q->where('pim_role_activations.tenant_id', $id));

        $activeCount = (clone $baseQuery)->where('activation_type', 'active')->count();
        $eligibleCount = (clone $baseQuery)->where('activation_type', 'eligible')->count();

        $byRole = DB::table('pim_role_activations')
            ->when($tenantId, fn ($q, $id) => $q->where('pim_role_activations.tenant_id', $id))
            ->select(['role_name', DB::raw('COUNT(*) as count')])
            ->groupBy('role_name')
            ->orderByDesc('count')
            ->get();

        $query = DB::table('pim_role_activations')
            ->leftJoin('managed_tenants', 'pim_role_activations.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'pim_role_activations.id',
                'pim_role_activations.tenant_id',
                'managed_tenants.customer_name',
                'pim_role_activations.user_principal_name',
                'pim_role_activations.display_name',
                'pim_role_activations.role_name',
                'pim_role_activations.activation_type',
                'pim_role_activations.status',
                'pim_role_activations.start_date',
                'pim_role_activations.end_date',
                'pim_role_activations.justification',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('pim_role_activations.tenant_id', $id));

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('pim_role_activations.user_principal_name', 'like', "%{$search}%")
                  ->orWhere('pim_role_activations.display_name', 'like', "%{$search}%")
                  ->orWhere('pim_role_activations.role_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('activation_type')) {
            $query->where('pim_role_activations.activation_type', (string) $request->string('activation_type'));
        }

        if ($request->filled('status')) {
            $query->where('pim_role_activations.status', (string) $request->string('status'));
        }

        $paginated = $query->orderBy('pim_role_activations.user_principal_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'summary' => [
                'total_eligible' => $eligibleCount,
                'total_active' => $activeCount,
                'roles' => $byRole,
            ],
            'activations' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    public function legacyAuth(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // Users with legacy auth enabled
        $baseQuery = DB::table('password_policies')
            ->where('uses_legacy_auth', true)
            ->when($tenantId, fn ($q, $id) => $q->where('password_policies.tenant_id', $id));

        $totalLegacyUsers = (clone $baseQuery)->count();

        $legacySignIns = (int) DB::table('security_defaults')
            ->when($tenantId, fn ($q, $id) => $q->where('security_defaults.tenant_id', $id))
            ->sum('legacy_auth_sign_ins_30d');

        $legacyAuthBlocked = (int) DB::table('security_defaults')
            ->when($tenantId, fn ($q, $id) => $q->where('security_defaults.tenant_id', $id))
            ->where('legacy_auth_blocked', true)
            ->count();

        $totalTenants = (int) DB::table('security_defaults')
            ->when($tenantId, fn ($q, $id) => $q->where('security_defaults.tenant_id', $id))
            ->count();

        // Paginated list of users with legacy auth characteristics
        $query = DB::table('password_policies')
            ->leftJoin('managed_tenants', 'password_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'password_policies.id',
                'password_policies.tenant_id',
                'managed_tenants.customer_name',
                'password_policies.display_name',
                'password_policies.user_principal_name',
                'password_policies.password_last_set',
                'password_policies.uses_legacy_auth',
                'password_policies.legacy_protocols_json',
            ])
            ->where('password_policies.uses_legacy_auth', true)
            ->when($tenantId, fn ($q, $id) => $q->where('password_policies.tenant_id', $id));

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('password_policies.display_name', 'like', "%{$search}%")
                  ->orWhere('password_policies.user_principal_name', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderBy('password_policies.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'total_legacy_users' => $totalLegacyUsers,
            'legacy_auth_sign_ins_30d' => $legacySignIns,
            'tenants_legacy_blocked' => $legacyAuthBlocked,
            'tenants_total' => $totalTenants,
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }
}
