<?php

declare(strict_types=1);

namespace App\Modules\AppRegistrations\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class AppRegistrationsController extends Controller
{
    /**
     * Combined overview + paginated list endpoint.
     *
     * The frontend hook (useAppRegistrationsData) calls ONLY this endpoint and expects:
     *   - summary stats: total_apps, expired_credentials, expiring_soon,
     *     admin_consented, high_risk_consents
     *   - items: paginated AppRegistration[] with aliased fields
     *   - oauth_consents: OAuthConsent[] (top consents by risk)
     *   - pagination: {total, per_page, current_page, last_page}
     */
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // ── Summary stats ────────────────────────────────────────────────────
        $baseQuery = DB::table('app_registrations')
            ->when($tenantId, fn ($q, $id) => $q->where('app_registrations.tenant_id', $id));

        $totalApps = (clone $baseQuery)->count();

        $expiredCredentials = (clone $baseQuery)
            ->where('has_expired_credentials', true)
            ->count();

        $expiringSoon = (clone $baseQuery)
            ->where('nearest_credential_expiry', '>=', now()->toDateString())
            ->where('nearest_credential_expiry', '<=', now()->addDays(30)->toDateString())
            ->count();

        $adminConsented = (clone $baseQuery)
            ->where('has_admin_consent', true)
            ->count();

        $highRiskConsents = DB::table('oauth_consent_grants')
            ->when($tenantId, fn ($q, $id) => $q->where('oauth_consent_grants.tenant_id', $id))
            ->where('risk_level', 'high')
            ->count();

        // ── Paginated app registrations list ─────────────────────────────────
        $query = DB::table('app_registrations')
            ->leftJoin('managed_tenants', 'app_registrations.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'app_registrations.id',
                'app_registrations.tenant_id',
                'managed_tenants.customer_name',
                'app_registrations.display_name',
                'app_registrations.app_type',
                'app_registrations.credential_count',
                'app_registrations.nearest_credential_expiry',
                'app_registrations.has_admin_consent',
                'app_registrations.api_permissions_count',
                'app_registrations.last_sign_in_date as last_sign_in',
            ]);

        if ($tenantId) {
            $query->where('app_registrations.tenant_id', $tenantId);
        }

        if ($request->filled('app_type')) {
            $query->where('app_registrations.app_type', (string) $request->string('app_type'));
        }

        if ($request->filled('credential_status')) {
            $status = (string) $request->string('credential_status');
            if ($status === 'expired') {
                $query->where('app_registrations.has_expired_credentials', true);
            } elseif ($status === 'expiring_soon') {
                $query->where('app_registrations.nearest_credential_expiry', '>=', now()->toDateString())
                    ->where('app_registrations.nearest_credential_expiry', '<=', now()->addDays(30)->toDateString());
            } elseif ($status === 'valid') {
                $query->where('app_registrations.has_expired_credentials', false)
                    ->where(function ($q): void {
                        $q->whereNull('app_registrations.nearest_credential_expiry')
                          ->orWhere('app_registrations.nearest_credential_expiry', '>', now()->addDays(30)->toDateString());
                    });
            }
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('app_registrations.display_name', 'like', "%{$search}%")
                  ->orWhere('app_registrations.app_id', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $apps = $query->orderBy('app_registrations.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        // ── OAuth consent grants (top results by risk) ───────────────────────
        $consentsQuery = DB::table('oauth_consent_grants')
            ->leftJoin('managed_tenants', 'oauth_consent_grants.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'oauth_consent_grants.id',
                'oauth_consent_grants.tenant_id',
                'managed_tenants.customer_name',
                'oauth_consent_grants.app_display_name as app_name',
                'oauth_consent_grants.principal_name',
                'oauth_consent_grants.scopes as scope',
                'oauth_consent_grants.risk_level',
                'oauth_consent_grants.consent_type',
                'oauth_consent_grants.created_at as granted_at',
            ]);

        if ($tenantId) {
            $consentsQuery->where('oauth_consent_grants.tenant_id', $tenantId);
        }

        $oauthConsents = $consentsQuery
            ->orderByRaw("CASE oauth_consent_grants.risk_level WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
            ->orderBy('oauth_consent_grants.app_display_name')
            ->limit(50)
            ->get();

        return ApiResponse::success([
            'total_apps'          => $totalApps,
            'expired_credentials' => $expiredCredentials,
            'expiring_soon'       => $expiringSoon,
            'admin_consented'     => $adminConsented,
            'high_risk_consents'  => $highRiskConsents,
            'items'               => $apps->items(),
            'oauth_consents'      => $oauthConsents,
            'pagination'          => [
                'total'        => $apps->total(),
                'per_page'     => $apps->perPage(),
                'current_page' => $apps->currentPage(),
                'last_page'    => $apps->lastPage(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('app_registrations')
            ->leftJoin('managed_tenants', 'app_registrations.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'app_registrations.id',
                'app_registrations.tenant_id',
                'managed_tenants.customer_name',
                'app_registrations.display_name',
                'app_registrations.app_type',
                'app_registrations.credential_count',
                'app_registrations.nearest_credential_expiry',
                'app_registrations.has_admin_consent',
                'app_registrations.api_permissions_count',
                'app_registrations.last_sign_in_date as last_sign_in',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('app_registrations.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('credential_status')) {
            $status = (string) $request->string('credential_status');
            if ($status === 'expired') {
                $query->where('app_registrations.has_expired_credentials', true);
            } elseif ($status === 'expiring_soon') {
                $query->where('app_registrations.nearest_credential_expiry', '>=', now()->toDateString())
                    ->where('app_registrations.nearest_credential_expiry', '<=', now()->addDays(30)->toDateString());
            } elseif ($status === 'valid') {
                $query->where('app_registrations.has_expired_credentials', false)
                    ->where(function ($q): void {
                        $q->whereNull('app_registrations.nearest_credential_expiry')
                          ->orWhere('app_registrations.nearest_credential_expiry', '>', now()->addDays(30)->toDateString());
                    });
            }
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('app_registrations.display_name', 'like', "%{$search}%")
                  ->orWhere('app_registrations.app_id', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $apps = $query->orderBy('app_registrations.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $apps->items(),
            'pagination' => [
                'total' => $apps->total(),
                'per_page' => $apps->perPage(),
                'current_page' => $apps->currentPage(),
                'last_page' => $apps->lastPage(),
            ],
        ]);
    }

    public function consents(Request $request): JsonResponse
    {
        $query = DB::table('oauth_consent_grants')
            ->leftJoin('managed_tenants', 'oauth_consent_grants.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'oauth_consent_grants.id',
                'oauth_consent_grants.tenant_id',
                'managed_tenants.customer_name',
                'oauth_consent_grants.app_display_name as app_name',
                'oauth_consent_grants.principal_name',
                'oauth_consent_grants.scopes as scope',
                'oauth_consent_grants.risk_level',
                'oauth_consent_grants.consent_type',
                'oauth_consent_grants.created_at as granted_at',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('oauth_consent_grants.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('risk_level')) {
            $query->where('oauth_consent_grants.risk_level', (string) $request->string('risk_level'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('oauth_consent_grants.app_display_name', 'like', "%{$search}%")
                  ->orWhere('oauth_consent_grants.principal_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $consents = $query
            ->orderByRaw("CASE oauth_consent_grants.risk_level WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END")
            ->orderBy('oauth_consent_grants.app_display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $consents->items(),
            'pagination' => [
                'total' => $consents->total(),
                'per_page' => $consents->perPage(),
                'current_page' => $consents->currentPage(),
                'last_page' => $consents->lastPage(),
            ],
        ]);
    }
}
