<?php

declare(strict_types=1);

namespace App\Modules\Copilot\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class CopilotDashboardController extends Controller
{
    public function readiness(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // Latest readiness entry per tenant
        $readinessQuery = DB::table('copilot_readiness')
            ->whereIn('id', function ($q) use ($tenantId): void {
                $q->selectRaw('MAX(id)')
                    ->from('copilot_readiness')
                    ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
                    ->groupBy('tenant_id');
            });

        $latestReadiness = $readinessQuery->get();

        // Copilot usage aggregates
        $usageQuery = DB::table('copilot_usage')
            ->when($tenantId, fn ($q, $id) => $q->where('copilot_usage.tenant_id', $id));

        $totalLicensed = (clone $usageQuery)->where('copilot_license_assigned', true)->count();
        $totalActive = (clone $usageQuery)
            ->where('copilot_license_assigned', true)
            ->where('last_activity_date', '>=', now()->subDays(30)->toDateString())
            ->count();
        $adoptionRate = $totalLicensed > 0 ? round(($totalActive / $totalLicensed) * 100, 1) : 0;

        // SharePoint oversharing metrics
        $spQuery = DB::table('sharepoint_sites')
            ->when($tenantId, fn ($q, $id) => $q->where('sharepoint_sites.tenant_id', $id));

        $totalSites = (clone $spQuery)->count();
        $sitesWithEveryoneAccess = (clone $spQuery)->where('external_sharing', 'anyone')->count();
        $publicSitesCount = (clone $spQuery)->where('is_public', true)->count();
        $sitesWithExternalSharing = (clone $spQuery)->whereIn('external_sharing', ['anyone', 'org', 'existing'])->count();
        $sitesWithGuestAccess = (clone $spQuery)->where('has_guest_access', true)->count();
        $sensitivityLabelsCount = (clone $spQuery)->whereNotNull('sensitivity_label')->count();
        $sensitivityLabelsAppliedPct = $totalSites > 0 ? round(($sensitivityLabelsCount / $totalSites) * 100, 1) : 0;

        // Build readiness checks
        $readinessChecks = $this->buildReadinessChecks(
            $totalLicensed,
            $totalActive,
            $adoptionRate,
            $totalSites,
            $sitesWithEveryoneAccess,
            $publicSitesCount,
            $sitesWithExternalSharing,
            $sitesWithGuestAccess,
            $sensitivityLabelsAppliedPct
        );

        // Overall scores from latest readiness record(s)
        $overallScore = $latestReadiness->isNotEmpty()
            ? round($latestReadiness->avg('overall_score'), 2)
            : 0;
        $dataExposureScore = $latestReadiness->isNotEmpty()
            ? round($latestReadiness->avg('data_exposure_score'), 2)
            : 0;
        $accessGovernanceScore = $latestReadiness->isNotEmpty()
            ? round($latestReadiness->avg('access_governance_score'), 2)
            : 0;
        $dataProtectionScore = $latestReadiness->isNotEmpty()
            ? round($latestReadiness->avg('data_protection_score'), 2)
            : 0;
        $aiGovernanceScore = $latestReadiness->isNotEmpty()
            ? round($latestReadiness->avg('ai_governance_score'), 2)
            : 0;

        // Readiness by tenant
        $readinessByTenant = DB::table('copilot_readiness')
            ->join('managed_tenants', 'copilot_readiness.tenant_id', '=', 'managed_tenants.tenant_id')
            ->whereIn('copilot_readiness.id', function ($q): void {
                $q->selectRaw('MAX(id)')->from('copilot_readiness')->groupBy('tenant_id');
            })
            ->when($tenantId, fn ($q, $id) => $q->where('copilot_readiness.tenant_id', $id))
            ->select([
                'copilot_readiness.*',
                'managed_tenants.customer_name',
            ])
            ->orderByDesc('copilot_readiness.overall_score')
            ->get();

        return ApiResponse::success([
            'overall_score' => $overallScore,
            'data_exposure_score' => $dataExposureScore,
            'access_governance_score' => $accessGovernanceScore,
            'data_protection_score' => $dataProtectionScore,
            'ai_governance_score' => $aiGovernanceScore,
            'copilot_licensed_users' => $totalLicensed,
            'copilot_active_users' => $totalActive,
            'adoption_rate' => $adoptionRate,
            'sites_with_everyone_access' => $sitesWithEveryoneAccess,
            'public_sites_count' => $publicSitesCount,
            'sites_with_external_sharing' => $sitesWithExternalSharing,
            'sites_with_guest_access' => $sitesWithGuestAccess,
            'sensitivity_labels_applied_pct' => $sensitivityLabelsAppliedPct,
            'readiness_checks' => $readinessChecks,
            'readiness_by_tenant' => $readinessByTenant,
        ]);
    }

    public function usage(Request $request): JsonResponse
    {
        $query = DB::table('copilot_usage')
            ->leftJoin('managed_tenants', 'copilot_usage.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'copilot_usage.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('copilot_usage.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('licensed')) {
            $licensed = (string) $request->string('licensed');
            $query->where('copilot_usage.copilot_license_assigned', $licensed === 'licensed');
        }

        if ($request->filled('active')) {
            $active = (string) $request->string('active');
            if ($active === 'active') {
                $query->where('copilot_usage.last_activity_date', '>=', now()->subDays(30)->toDateString());
            } elseif ($active === 'inactive') {
                $query->where(function ($q): void {
                    $q->where('copilot_usage.last_activity_date', '<', now()->subDays(30)->toDateString())
                      ->orWhereNull('copilot_usage.last_activity_date');
                });
            }
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('copilot_usage.display_name', 'like', "%{$search}%")
                  ->orWhere('copilot_usage.user_principal_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        // Compute summary stats before pagination
        $allQuery = clone $query;
        $totalLicensed = (clone $allQuery)->where('copilot_usage.copilot_license_assigned', true)->count();
        $totalActive = (clone $allQuery)
            ->where('copilot_usage.copilot_license_assigned', true)
            ->where('copilot_usage.last_activity_date', '>=', now()->subDays(30)->toDateString())
            ->count();
        $adoptionRate = $totalLicensed > 0 ? round(($totalActive / $totalLicensed) * 100, 1) : 0;

        // Usage by app
        $baseQuery = DB::table('copilot_usage')
            ->when($request->filled('tenant_id'), fn ($q) => $q->where('tenant_id', (string) $request->string('tenant_id')));

        $usageByApp = [
            'teams' => (clone $baseQuery)->where('last_activity_teams', '>=', now()->subDays(30)->toDateString())->count(),
            'word' => (clone $baseQuery)->where('last_activity_word', '>=', now()->subDays(30)->toDateString())->count(),
            'excel' => (clone $baseQuery)->where('last_activity_excel', '>=', now()->subDays(30)->toDateString())->count(),
            'powerpoint' => (clone $baseQuery)->where('last_activity_powerpoint', '>=', now()->subDays(30)->toDateString())->count(),
            'outlook' => (clone $baseQuery)->where('last_activity_outlook', '>=', now()->subDays(30)->toDateString())->count(),
            'onenote' => (clone $baseQuery)->where('last_activity_onenote', '>=', now()->subDays(30)->toDateString())->count(),
            'copilot_chat' => (clone $baseQuery)->where('last_activity_copilot_chat', '>=', now()->subDays(30)->toDateString())->count(),
        ];

        $items = $query->orderBy('copilot_usage.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'total_licensed' => $totalLicensed,
            'total_active' => $totalActive,
            'adoption_rate' => $adoptionRate,
            'usage_by_app' => $usageByApp,
            'items' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function agents(Request $request): JsonResponse
    {
        $query = DB::table('copilot_agents')
            ->leftJoin('managed_tenants', 'copilot_agents.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'copilot_agents.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('copilot_agents.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('copilot_agents.status', (string) $request->string('status'));
        }

        if ($request->filled('type')) {
            $query->where('copilot_agents.agent_type', (string) $request->string('type'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('copilot_agents.display_name', 'like', "%{$search}%")
                  ->orWhere('copilot_agents.description', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $agents = $query->orderBy('copilot_agents.display_name')->get();

        $total = $agents->count();
        $active = $agents->where('status', 'active')->count();
        $disabled = $agents->where('status', 'disabled')->count();
        $blocked = $agents->where('status', 'blocked')->count();

        $byType = [
            'declarative' => $agents->where('agent_type', 'declarative')->count(),
            'custom_engine' => $agents->where('agent_type', 'custom_engine')->count(),
        ];

        return ApiResponse::success([
            'total' => $total,
            'active' => $active,
            'disabled' => $disabled,
            'blocked' => $blocked,
            'by_type' => $byType,
            'items' => $agents->values(),
        ]);
    }

    public function sharepoint(Request $request): JsonResponse
    {
        $query = DB::table('sharepoint_sites')
            ->leftJoin('managed_tenants', 'sharepoint_sites.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'sharepoint_sites.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('sharepoint_sites.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('external_sharing')) {
            $query->where('sharepoint_sites.external_sharing', (string) $request->string('external_sharing'));
        }

        if ($request->filled('is_public')) {
            $query->where('sharepoint_sites.is_public', $request->boolean('is_public'));
        }

        if ($request->filled('has_guest_access')) {
            $query->where('sharepoint_sites.has_guest_access', $request->boolean('has_guest_access'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('sharepoint_sites.display_name', 'like', "%{$search}%")
                  ->orWhere('sharepoint_sites.site_url', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        // Compute summary stats
        $statsQuery = DB::table('sharepoint_sites')
            ->when($request->filled('tenant_id'), fn ($q) => $q->where('tenant_id', (string) $request->string('tenant_id')));

        $totalSites = (clone $statsQuery)->count();
        $publicSites = (clone $statsQuery)->where('is_public', true)->count();
        $sitesWithEveryone = (clone $statsQuery)->where('external_sharing', 'anyone')->count();
        $sitesWithExternalSharing = (clone $statsQuery)->whereIn('external_sharing', ['anyone', 'org', 'existing'])->count();
        $sitesWithGuests = (clone $statsQuery)->where('has_guest_access', true)->count();
        $avgPermissionedUsers = (clone $statsQuery)->avg('permissioned_user_count') ?? 0;

        $totalStorageUsed = (clone $statsQuery)->sum('storage_used_bytes');
        $totalFiles = (clone $statsQuery)->sum('file_count');

        $sensitivityLabelsCoverage = $totalSites > 0
            ? round(((clone $statsQuery)->whereNotNull('sensitivity_label')->count() / $totalSites) * 100, 1)
            : 0;

        $sharingDistribution = (clone $statsQuery)
            ->select(['external_sharing', DB::raw('COUNT(*) as count')])
            ->groupBy('external_sharing')
            ->get();

        $items = $query->orderByDesc('sharepoint_sites.permissioned_user_count')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'total_sites' => $totalSites,
            'public_sites' => $publicSites,
            'sites_with_everyone' => $sitesWithEveryone,
            'sites_with_external_sharing' => $sitesWithExternalSharing,
            'sites_with_guests' => $sitesWithGuests,
            'average_permissioned_users' => round((float) $avgPermissionedUsers, 1),
            'total_storage_used' => $totalStorageUsed,
            'total_files' => $totalFiles,
            'sensitivity_labels_coverage_pct' => $sensitivityLabelsCoverage,
            'sharing_distribution' => $sharingDistribution,
            'items' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildReadinessChecks(
        int $totalLicensed,
        int $totalActive,
        float $adoptionRate,
        int $totalSites,
        int $sitesWithEveryoneAccess,
        int $publicSitesCount,
        int $sitesWithExternalSharing,
        int $sitesWithGuestAccess,
        float $sensitivityLabelsAppliedPct
    ): array {
        return [
            [
                'id' => 'copilot_licensing',
                'name' => 'Copilot Licensing',
                'category' => 'ai_governance',
                'status' => $totalLicensed > 0 ? 'pass' : 'fail',
                'detail' => "{$totalLicensed} users licensed for Copilot",
            ],
            [
                'id' => 'copilot_adoption',
                'name' => 'Copilot Adoption Rate',
                'category' => 'ai_governance',
                'status' => $adoptionRate >= 50 ? 'pass' : ($adoptionRate >= 20 ? 'warning' : 'fail'),
                'detail' => "{$adoptionRate}% adoption rate ({$totalActive} active of {$totalLicensed} licensed)",
            ],
            [
                'id' => 'oversharing_anyone',
                'name' => 'No Sites Shared with Everyone',
                'category' => 'data_exposure',
                'status' => $sitesWithEveryoneAccess === 0 ? 'pass' : ($sitesWithEveryoneAccess <= 3 ? 'warning' : 'fail'),
                'detail' => "{$sitesWithEveryoneAccess} sites accessible by everyone",
            ],
            [
                'id' => 'public_sites',
                'name' => 'No Public SharePoint Sites',
                'category' => 'data_exposure',
                'status' => $publicSitesCount === 0 ? 'pass' : ($publicSitesCount <= 2 ? 'warning' : 'fail'),
                'detail' => "{$publicSitesCount} public sites detected",
            ],
            [
                'id' => 'external_sharing',
                'name' => 'External Sharing Controls',
                'category' => 'data_exposure',
                'status' => $totalSites > 0 && ($sitesWithExternalSharing / $totalSites) <= 0.2
                    ? 'pass'
                    : (($totalSites > 0 && ($sitesWithExternalSharing / $totalSites) <= 0.5) ? 'warning' : 'fail'),
                'detail' => "{$sitesWithExternalSharing} of {$totalSites} sites have external sharing enabled",
            ],
            [
                'id' => 'guest_access',
                'name' => 'Guest Access Review',
                'category' => 'access_governance',
                'status' => $totalSites > 0 && ($sitesWithGuestAccess / $totalSites) <= 0.1
                    ? 'pass'
                    : (($totalSites > 0 && ($sitesWithGuestAccess / $totalSites) <= 0.3) ? 'warning' : 'fail'),
                'detail' => "{$sitesWithGuestAccess} sites have guest access",
            ],
            [
                'id' => 'sensitivity_labels',
                'name' => 'Sensitivity Labels Coverage',
                'category' => 'data_protection',
                'status' => $sensitivityLabelsAppliedPct >= 80 ? 'pass' : ($sensitivityLabelsAppliedPct >= 40 ? 'warning' : 'fail'),
                'detail' => "{$sensitivityLabelsAppliedPct}% of sites have sensitivity labels",
            ],
            [
                'id' => 'dlp_policies',
                'name' => 'DLP Policies Configured',
                'category' => 'data_protection',
                'status' => 'warning',
                'detail' => 'DLP policy check not yet implemented',
            ],
            [
                'id' => 'site_ownership',
                'name' => 'Site Ownership Assigned',
                'category' => 'access_governance',
                'status' => $totalSites > 0 ? 'pass' : 'warning',
                'detail' => 'Site ownership verification pending full implementation',
            ],
            [
                'id' => 'agent_governance',
                'name' => 'Copilot Agent Governance',
                'category' => 'ai_governance',
                'status' => 'warning',
                'detail' => 'Agent governance policies not yet assessed',
            ],
        ];
    }
}
