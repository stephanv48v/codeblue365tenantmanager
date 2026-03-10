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

        $actionItems = $this->buildActionItems($readinessChecks);
        $licenseInsights = $this->buildLicenseInsights($tenantId);

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
            'action_items' => $actionItems,
            'license_insights' => $licenseInsights,
        ]);
    }

    public function readinessHistory(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;
        $days = $request->integer('days', 90);

        $query = DB::table('copilot_readiness')
            ->where('calculated_at', '>=', now()->subDays($days))
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
            ->orderBy('calculated_at');

        if ($tenantId) {
            // Single tenant: return individual records
            $rows = $query->select([
                DB::raw("DATE(calculated_at) as date"),
                'overall_score as overall',
                'data_exposure_score as data_exposure',
                'access_governance_score as access_governance',
                'data_protection_score as data_protection',
                'ai_governance_score as ai_governance',
            ])->get();
        } else {
            // All tenants: average scores by date
            $rows = $query->select([
                DB::raw("DATE(calculated_at) as date"),
                DB::raw("ROUND(AVG(overall_score), 1) as overall"),
                DB::raw("ROUND(AVG(data_exposure_score), 1) as data_exposure"),
                DB::raw("ROUND(AVG(access_governance_score), 1) as access_governance"),
                DB::raw("ROUND(AVG(data_protection_score), 1) as data_protection"),
                DB::raw("ROUND(AVG(ai_governance_score), 1) as ai_governance"),
            ])->groupBy(DB::raw("DATE(calculated_at)"))->get();
        }

        $trend = $rows->map(fn ($r) => [
            'date' => $r->date,
            'overall' => (float) $r->overall,
            'data_exposure' => (float) $r->data_exposure,
            'access_governance' => (float) $r->access_governance,
            'data_protection' => (float) $r->data_protection,
            'ai_governance' => (float) $r->ai_governance,
        ])->values()->toArray();

        // Calculate change from first to last data point
        $change = [
            'overall' => 0, 'data_exposure' => 0, 'access_governance' => 0,
            'data_protection' => 0, 'ai_governance' => 0,
        ];

        if (count($trend) >= 2) {
            $first = $trend[0];
            $last = $trend[count($trend) - 1];
            foreach ($change as $key => &$val) {
                $val = round($last[$key] - $first[$key], 1);
            }
            unset($val);
        }

        return ApiResponse::success([
            'trend' => $trend,
            'change' => $change,
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

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildActionItems(array $checks): array
    {
        $pillarWeights = [
            'data_exposure' => 40,
            'access_governance' => 25,
            'data_protection' => 25,
            'ai_governance' => 10,
        ];

        $checksPerCategory = [];
        foreach ($checks as $check) {
            $cat = $check['category'];
            $checksPerCategory[$cat] = ($checksPerCategory[$cat] ?? 0) + 1;
        }

        $remediationGuide = [
            'copilot_licensing' => 'Assign Microsoft 365 Copilot licenses to target users in the Microsoft 365 Admin Center under Billing > Licenses. Prioritise power users and early adopters.',
            'copilot_adoption' => 'Drive adoption through training sessions, champions programmes, and Copilot prompt libraries. Consider Microsoft Copilot Dashboard for adoption tracking.',
            'oversharing_anyone' => 'Navigate to SharePoint Admin Center > Active Sites. For each site with "Anyone" sharing, change to "Only people in your organization" or more restrictive.',
            'public_sites' => 'In SharePoint Admin Center, identify public sites and change their visibility to Private. Review site content before restricting access.',
            'external_sharing' => 'Review SharePoint sharing policies in the Admin Center. Set organisation-level sharing to "Existing guests" or more restrictive where possible.',
            'guest_access' => 'Audit guest user access in Azure AD > External Identities. Remove stale guest accounts and implement access reviews for active guests.',
            'sensitivity_labels' => 'Configure and publish sensitivity labels in Microsoft Purview. Enable auto-labelling policies and train users on manual label application.',
            'dlp_policies' => 'Create Data Loss Prevention policies in Microsoft Purview to protect sensitive information. Start with pre-built templates for common data types.',
            'site_ownership' => 'Ensure every SharePoint site has at least one active owner. Use the SharePoint Admin Center to assign owners to orphaned sites.',
            'agent_governance' => 'Establish a Copilot agent governance policy defining who can create agents, approved data sources, and review processes. Configure in Microsoft 365 Admin Center.',
        ];

        $priorityOrder = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];

        $items = array_map(function ($check) use ($pillarWeights, $checksPerCategory, $remediationGuide) {
            $category = $check['category'];
            $status = $check['status'];

            // Determine priority
            if ($status === 'fail' && $category === 'data_exposure') {
                $priority = 'critical';
            } elseif ($status === 'fail') {
                $priority = 'high';
            } elseif ($status === 'warning' && $category === 'data_exposure') {
                $priority = 'high';
            } elseif ($status === 'warning') {
                $priority = 'medium';
            } else {
                $priority = 'low';
            }

            // Calculate impact points
            $pillarWeight = $pillarWeights[$category] ?? 10;
            $countInCategory = $checksPerCategory[$category] ?? 1;
            $perCheckWeight = $pillarWeight / $countInCategory;

            if ($status === 'fail') {
                $impactPoints = round($perCheckWeight * 0.8, 1);
            } elseif ($status === 'warning') {
                $impactPoints = round($perCheckWeight * 0.4, 1);
            } else {
                $impactPoints = 0;
            }

            return array_merge($check, [
                'priority' => $priority,
                'impact_points' => $impactPoints,
                'remediation' => $remediationGuide[$check['id']] ?? 'Review and address this item to improve your readiness score.',
            ]);
        }, $checks);

        // Sort by priority (critical first), then by impact_points descending
        usort($items, function ($a, $b) use ($priorityOrder) {
            $pa = $priorityOrder[$a['priority']] ?? 3;
            $pb = $priorityOrder[$b['priority']] ?? 3;
            if ($pa !== $pb) return $pa - $pb;
            return $b['impact_points'] <=> $a['impact_points'];
        });

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildLicenseInsights(?string $tenantId): array
    {
        $thirtyDaysAgo = now()->subDays(30)->toDateString();

        $baseQuery = DB::table('copilot_usage')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));

        $licensedUsers = (clone $baseQuery)->where('copilot_license_assigned', true)->count();
        $activeUsers = (clone $baseQuery)
            ->where('copilot_license_assigned', true)
            ->where('last_activity_date', '>=', $thirtyDaysAgo)
            ->count();

        $inactiveLicensed = (clone $baseQuery)
            ->where('copilot_license_assigned', true)
            ->where(function ($q) use ($thirtyDaysAgo) {
                $q->where('last_activity_date', '<', $thirtyDaysAgo)
                  ->orWhereNull('last_activity_date');
            })
            ->count();

        $neverUsed = (clone $baseQuery)
            ->where('copilot_license_assigned', true)
            ->whereNull('last_activity_date')
            ->count();

        // Power users: active in 3+ apps in the last 30 days
        // Use portable CASE WHEN syntax for SQLite compatibility
        $appColumns = [
            'last_activity_teams', 'last_activity_word', 'last_activity_excel',
            'last_activity_powerpoint', 'last_activity_outlook', 'last_activity_onenote',
            'last_activity_copilot_chat',
        ];

        $caseExpressions = array_map(
            fn ($col) => "CASE WHEN {$col} >= '{$thirtyDaysAgo}' THEN 1 ELSE 0 END",
            $appColumns
        );
        $appCountExpr = '(' . implode(' + ', $caseExpressions) . ')';

        $powerUsers = (clone $baseQuery)
            ->where('copilot_license_assigned', true)
            ->where('last_activity_date', '>=', $thirtyDaysAgo)
            ->whereRaw("{$appCountExpr} >= 3")
            ->count();

        $casualUsers = $activeUsers - $powerUsers;

        // Build adoption funnel
        // Stage 4: Power Users (5+ apps)
        $superUsers = (clone $baseQuery)
            ->where('copilot_license_assigned', true)
            ->where('last_activity_date', '>=', $thirtyDaysAgo)
            ->whereRaw("{$appCountExpr} >= 5")
            ->count();

        $adoptionRate = $licensedUsers > 0 ? round(($activeUsers / $licensedUsers) * 100, 1) : 0;
        $estimatedMonthlyWaste = $inactiveLicensed * 30;

        return [
            'licensed_users' => $licensedUsers,
            'active_users' => $activeUsers,
            'inactive_licensed' => $inactiveLicensed,
            'estimated_monthly_waste' => $estimatedMonthlyWaste,
            'adoption_rate' => $adoptionRate,
            'power_users' => $powerUsers,
            'casual_users' => max(0, $casualUsers),
            'never_used' => $neverUsed,
            'adoption_funnel' => [
                ['stage' => 'Licensed', 'count' => $licensedUsers],
                ['stage' => 'Active (30d)', 'count' => $activeUsers],
                ['stage' => 'Multi-App (3+)', 'count' => $powerUsers],
                ['stage' => 'Power User (5+)', 'count' => $superUsers],
            ],
        ];
    }

    // ─── Comprehensive Tenant Audit ──────────────────────────────────

    public function audit(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $categories = [];

        // ── Category 1: Identity & Authentication ────────────────────
        $identityChecks = $this->buildIdentityAuthChecks($tenantId);
        $categories[] = $this->wrapCategory('identity_auth', 'Identity & Authentication', $identityChecks);

        // ── Category 2: Compliance & Data Protection ─────────────────
        $complianceChecks = $this->buildComplianceChecks($tenantId);
        $categories[] = $this->wrapCategory('compliance', 'Compliance & Data Protection', $complianceChecks);

        // ── Category 3: SharePoint & OneDrive ────────────────────────
        $sharepointChecks = $this->buildSharePointChecks($tenantId);
        $categories[] = $this->wrapCategory('sharepoint', 'SharePoint & OneDrive', $sharepointChecks);

        // ── Category 4: Teams Configuration ──────────────────────────
        $teamsChecks = $this->buildTeamsChecks($tenantId);
        $categories[] = $this->wrapCategory('teams', 'Teams Configuration', $teamsChecks);

        // ── Category 5: Device Standards ─────────────────────────────
        $deviceChecks = $this->buildDeviceChecks($tenantId);
        $categories[] = $this->wrapCategory('devices', 'Device Standards', $deviceChecks);

        // ── Category 6: Power Platform & AI Governance ───────────────
        $powerChecks = $this->buildPowerPlatformChecks($tenantId);
        $categories[] = $this->wrapCategory('power_platform', 'Power Platform & AI Governance', $powerChecks);

        // ── Summary ──────────────────────────────────────────────────
        $totalPass = 0;
        $totalWarn = 0;
        $totalFail = 0;
        foreach ($categories as $cat) {
            $totalPass += $cat['checks_pass'];
            $totalWarn += $cat['checks_warn'];
            $totalFail += $cat['checks_fail'];
        }
        $totalChecks = $totalPass + $totalWarn + $totalFail;
        $overallPct = $totalChecks > 0 ? round(($totalPass / $totalChecks) * 100, 1) : 0;

        // ── Top Actions ──────────────────────────────────────────────
        $categoryWeights = [
            'identity_auth' => 25,
            'compliance' => 20,
            'sharepoint' => 25,
            'teams' => 10,
            'devices' => 10,
            'power_platform' => 10,
        ];

        $nonPassChecks = [];
        foreach ($categories as $cat) {
            foreach ($cat['checks'] as $check) {
                if ($check['status'] !== 'pass') {
                    $check['category_key'] = $cat['key'];
                    $check['category_name'] = $cat['name'];
                    $check['category_weight'] = $categoryWeights[$cat['key']] ?? 0;
                    $nonPassChecks[] = $check;
                }
            }
        }

        usort($nonPassChecks, function ($a, $b) {
            $statusOrder = ['fail' => 0, 'warning' => 1];
            $sa = $statusOrder[$a['status']] ?? 2;
            $sb = $statusOrder[$b['status']] ?? 2;
            if ($sa !== $sb) {
                return $sa - $sb;
            }

            return $b['category_weight'] <=> $a['category_weight'];
        });

        $topActions = array_slice(array_map(fn ($c) => [
            'id' => $c['id'],
            'name' => $c['name'],
            'status' => $c['status'],
            'category' => $c['category_name'],
            'detail' => $c['detail'],
            'remediation' => $c['remediation'],
        ], $nonPassChecks), 0, 10);

        return ApiResponse::success([
            'summary' => [
                'overall_pct' => $overallPct,
                'total_checks' => $totalChecks,
                'total_pass' => $totalPass,
                'total_warn' => $totalWarn,
                'total_fail' => $totalFail,
            ],
            'categories' => $categories,
            'top_actions' => $topActions,
        ]);
    }

    // ─── Audit helper: wrap category ─────────────────────────────────

    /**
     * @param  array<int, array<string, mixed>>  $checks
     * @return array<string, mixed>
     */
    private function wrapCategory(string $key, string $name, array $checks): array
    {
        $pass = 0;
        $warn = 0;
        $fail = 0;
        foreach ($checks as $c) {
            match ($c['status']) {
                'pass' => $pass++,
                'warning' => $warn++,
                'fail' => $fail++,
                default => null,
            };
        }
        $total = $pass + $warn + $fail;

        return [
            'key' => $key,
            'name' => $name,
            'checks_pass' => $pass,
            'checks_warn' => $warn,
            'checks_fail' => $fail,
            'score_pct' => $total > 0 ? round(($pass / $total) * 100, 1) : 0,
            'checks' => $checks,
        ];
    }

    // ─── Category 1: Identity & Authentication checks ────────────────

    /** @return array<int, array<string, mixed>> */
    private function buildIdentityAuthChecks(?string $tenantId): array
    {
        $checks = [];

        // 1. MFA Coverage
        $usersQuery = DB::table('users_normalized')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $totalUsers = (clone $usersQuery)->count();
        $mfaRegistered = (clone $usersQuery)->where('mfa_registered', true)->count();
        $mfaPct = $totalUsers > 0 ? round(($mfaRegistered / $totalUsers) * 100, 1) : 0;
        $checks[] = [
            'id' => 'mfa_coverage',
            'name' => 'MFA Coverage',
            'status' => $mfaPct >= 90 ? 'pass' : ($mfaPct >= 70 ? 'warning' : 'fail'),
            'detail' => "{$mfaPct}% of users have MFA registered ({$mfaRegistered}/{$totalUsers})",
            'value' => $mfaPct,
            'target' => '>=90%',
            'remediation' => 'Enable MFA for all users via Conditional Access policies. Prioritise Security Defaults or a CA policy requiring MFA for all users.',
        ];

        // 2. Conditional Access policies
        $caQuery = DB::table('conditional_access_policies')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $enabledCa = (clone $caQuery)->where('state', 'enabled')->count();
        $checks[] = [
            'id' => 'conditional_access',
            'name' => 'Conditional Access Policies',
            'status' => $enabledCa >= 5 ? 'pass' : ($enabledCa >= 2 ? 'warning' : 'fail'),
            'detail' => "{$enabledCa} enabled Conditional Access policies detected",
            'value' => $enabledCa,
            'target' => '>=5',
            'remediation' => 'Deploy baseline Conditional Access policies: require MFA for admins, block legacy auth, require compliant devices, and restrict risky sign-ins.',
        ];

        // 3. MFA Enforcement via CA
        $mfaEnforced = (clone $caQuery)
            ->where('state', 'enabled')
            ->where('grant_controls', 'like', '%mfa%')
            ->exists();
        $checks[] = [
            'id' => 'mfa_enforcement',
            'name' => 'MFA Enforcement Policy',
            'status' => $mfaEnforced ? 'pass' : 'fail',
            'detail' => $mfaEnforced ? 'At least one CA policy enforces MFA' : 'No CA policy found that enforces MFA grant control',
            'value' => $mfaEnforced ? 'Yes' : 'No',
            'target' => 'At least 1 policy',
            'remediation' => 'Create a Conditional Access policy that requires MFA as a grant control for all users or all cloud apps.',
        ];

        // 4. Risky Users
        $riskyQuery = DB::table('risky_users')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $riskyCount = (clone $riskyQuery)->whereIn('risk_level', ['high', 'medium'])->count();
        $checks[] = [
            'id' => 'risky_users',
            'name' => 'Risky Users',
            'status' => $riskyCount === 0 ? 'pass' : ($riskyCount <= 5 ? 'warning' : 'fail'),
            'detail' => "{$riskyCount} users with high or medium risk level",
            'value' => $riskyCount,
            'target' => '0',
            'remediation' => 'Investigate risky users in Azure AD Identity Protection. Confirm compromised accounts, reset passwords, and enforce MFA re-registration.',
        ];

        // 5. Stale Accounts
        $ninetyDaysAgo = now()->subDays(90)->toDateString();
        $staleCount = (clone $usersQuery)
            ->where('account_enabled', true)
            ->where(function ($q) use ($ninetyDaysAgo) {
                $q->where('last_sign_in_at', '<', $ninetyDaysAgo)
                  ->orWhereNull('last_sign_in_at');
            })
            ->count();
        $stalePct = $totalUsers > 0 ? round(($staleCount / $totalUsers) * 100, 1) : 0;
        $checks[] = [
            'id' => 'stale_accounts',
            'name' => 'Stale Accounts',
            'status' => $stalePct <= 5 ? 'pass' : ($stalePct <= 15 ? 'warning' : 'fail'),
            'detail' => "{$stalePct}% of enabled accounts have not signed in for 90+ days ({$staleCount}/{$totalUsers})",
            'value' => $stalePct,
            'target' => '<=5%',
            'remediation' => 'Disable or remove accounts inactive for 90+ days. Implement an automated access review to catch stale accounts regularly.',
        ];

        // 6. Admin Accounts (Global Admins)
        $adminQuery = DB::table('directory_role_assignments')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $globalAdmins = (clone $adminQuery)
            ->where('role_display_name', 'like', '%Global Admin%')
            ->distinct('user_principal_name')
            ->count('user_principal_name');
        $checks[] = [
            'id' => 'admin_accounts',
            'name' => 'Global Admin Accounts',
            'status' => $globalAdmins <= 5 ? 'pass' : ($globalAdmins <= 10 ? 'warning' : 'fail'),
            'detail' => "{$globalAdmins} distinct Global Administrator accounts",
            'value' => $globalAdmins,
            'target' => '<=5',
            'remediation' => 'Reduce Global Admin count to 2-5. Use least-privilege roles (e.g. Exchange Admin, SharePoint Admin) and enable PIM for just-in-time access.',
        ];

        // 7. Guest Accounts (stale or never signed in, still enabled)
        $guestQuery = DB::table('guest_users')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $staleGuests = (clone $guestQuery)
            ->where('account_enabled', true)
            ->where(function ($q) use ($ninetyDaysAgo) {
                $q->whereNull('last_sign_in_at')
                  ->orWhere('last_sign_in_at', '<', $ninetyDaysAgo);
            })
            ->count();
        $checks[] = [
            'id' => 'guest_accounts',
            'name' => 'Stale Guest Accounts',
            'status' => $staleGuests === 0 ? 'pass' : ($staleGuests <= 10 ? 'warning' : 'fail'),
            'detail' => "{$staleGuests} enabled guest accounts with no sign-in or inactive 90+ days",
            'value' => $staleGuests,
            'target' => '0',
            'remediation' => 'Review stale guest accounts in Azure AD External Identities. Remove guests that no longer need access and set up periodic guest access reviews.',
        ];

        // 8. Secure Score
        $secureScore = DB::table('secure_scores')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
            ->orderByDesc('id')
            ->first();
        if ($secureScore && $secureScore->max_score > 0) {
            $scorePct = round(($secureScore->current_score / $secureScore->max_score) * 100, 1);
        } else {
            $scorePct = 0;
        }
        $checks[] = [
            'id' => 'secure_score',
            'name' => 'Microsoft Secure Score',
            'status' => $scorePct >= 80 ? 'pass' : ($scorePct >= 60 ? 'warning' : 'fail'),
            'detail' => $secureScore
                ? "{$scorePct}% ({$secureScore->current_score}/{$secureScore->max_score})"
                : 'No Secure Score data available',
            'value' => $scorePct,
            'target' => '>=80%',
            'remediation' => 'Review Microsoft Secure Score recommendations in the Microsoft 365 Defender portal and implement high-impact improvement actions.',
        ];

        return $checks;
    }

    // ─── Category 2: Compliance & Data Protection checks ─────────────

    /** @return array<int, array<string, mixed>> */
    private function buildComplianceChecks(?string $tenantId): array
    {
        $checks = [];

        $spQuery = DB::table('sharepoint_sites')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $totalSites = (clone $spQuery)->count();
        $labeledSites = (clone $spQuery)->whereNotNull('sensitivity_label')->count();
        $labelPct = $totalSites > 0 ? round(($labeledSites / $totalSites) * 100, 1) : 0;

        // 1. Sensitivity Labels Deployed
        $checks[] = [
            'id' => 'sensitivity_labels_deployed',
            'name' => 'Sensitivity Labels Deployed',
            'status' => $labelPct >= 80 ? 'pass' : ($labelPct >= 40 ? 'warning' : 'fail'),
            'detail' => "{$labelPct}% of SharePoint sites have sensitivity labels applied ({$labeledSites}/{$totalSites})",
            'value' => $labelPct,
            'target' => '>=80%',
            'remediation' => 'Publish sensitivity labels in Microsoft Purview and enable auto-labelling policies to increase coverage.',
        ];

        // 2. Label Coverage Trend (advisory)
        $checks[] = [
            'id' => 'label_coverage_trend',
            'name' => 'Label Coverage Trend',
            'status' => 'warning',
            'detail' => "Current coverage: {$labelPct}%. Consider enabling auto-labelling policies to improve coverage over time.",
            'value' => $labelPct,
            'target' => 'Improving',
            'remediation' => 'Configure auto-labelling policies in Microsoft Purview to automatically classify and protect sensitive content.',
        ];

        // 3. DLP Policies (advisory via license check)
        $licQuery = DB::table('licenses')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $hasPurview = (clone $licQuery)
            ->where(function ($q) {
                $q->where('sku_name', 'like', '%purview%')
                  ->orWhere('sku_name', 'like', '%Purview%')
                  ->orWhere('sku_name', 'like', '%PURVIEW%')
                  ->orWhere('sku_name', 'like', '%compliance%')
                  ->orWhere('sku_name', 'like', '%Compliance%')
                  ->orWhere('sku_name', 'like', '%COMPLIANCE%');
            })
            ->exists();
        $checks[] = [
            'id' => 'dlp_policies',
            'name' => 'DLP Policies',
            'status' => 'warning',
            'detail' => $hasPurview
                ? 'Purview/Compliance license detected. Verify DLP policies are configured in the Purview portal.'
                : 'No Purview or Compliance license detected. DLP policies may not be available.',
            'value' => $hasPurview ? 'License found' : 'No license',
            'target' => 'Configured',
            'remediation' => 'Configure Data Loss Prevention policies in Microsoft Purview to protect sensitive data types (SSN, credit cards, etc.) across Exchange, SharePoint, and Teams.',
        ];

        // 4. Retention Policies (advisory)
        $checks[] = [
            'id' => 'retention_policies',
            'name' => 'Retention Policies',
            'status' => 'warning',
            'detail' => 'Retention policy audit requires manual review in the Microsoft Purview compliance portal.',
            'value' => 'Manual review',
            'target' => 'Configured',
            'remediation' => 'Configure retention policies in Microsoft Purview to ensure data is retained or deleted according to compliance requirements.',
        ];

        // 5. Information Barriers (advisory)
        $checks[] = [
            'id' => 'information_barriers',
            'name' => 'Information Barriers',
            'status' => 'warning',
            'detail' => 'Information barrier configuration requires manual review. Verify segments and policies in the Purview portal.',
            'value' => 'Manual review',
            'target' => 'Configured',
            'remediation' => 'If required by regulation, configure information barriers in Microsoft Purview to restrict communication between user segments.',
        ];

        return $checks;
    }

    // ─── Category 3: SharePoint & OneDrive checks ────────────────────

    /** @return array<int, array<string, mixed>> */
    private function buildSharePointChecks(?string $tenantId): array
    {
        $checks = [];

        $spQuery = DB::table('sharepoint_sites')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $totalSites = (clone $spQuery)->count();

        // 1. Public Sites
        $publicCount = (clone $spQuery)->where('is_public', true)->count();
        $checks[] = [
            'id' => 'public_sites',
            'name' => 'Public SharePoint Sites',
            'status' => $publicCount === 0 ? 'pass' : ($publicCount <= 2 ? 'warning' : 'fail'),
            'detail' => "{$publicCount} sites are publicly accessible",
            'value' => $publicCount,
            'target' => '0',
            'remediation' => 'Change public sites to private in SharePoint Admin Center > Active Sites. Review content before restricting access.',
        ];

        // 2. Everyone Access
        $everyoneCount = (clone $spQuery)->where('external_sharing', 'anyone')->count();
        $checks[] = [
            'id' => 'everyone_access',
            'name' => 'Sites with Everyone/Anonymous Access',
            'status' => $everyoneCount === 0 ? 'pass' : ($everyoneCount <= 3 ? 'warning' : 'fail'),
            'detail' => "{$everyoneCount} sites allow anonymous access",
            'value' => $everyoneCount,
            'target' => '0',
            'remediation' => 'Change sharing to "Only people in your organisation" or "Existing guests" for sites currently set to "Anyone".',
        ];

        // 3. External Sharing
        $extSharingCount = (clone $spQuery)->whereIn('external_sharing', ['anyone', 'org', 'existing'])->count();
        $extPct = $totalSites > 0 ? round(($extSharingCount / $totalSites) * 100, 1) : 0;
        $checks[] = [
            'id' => 'external_sharing',
            'name' => 'External Sharing Enabled',
            'status' => $extPct <= 20 ? 'pass' : ($extPct <= 50 ? 'warning' : 'fail'),
            'detail' => "{$extPct}% of sites have external sharing enabled ({$extSharingCount}/{$totalSites})",
            'value' => $extPct,
            'target' => '<=20%',
            'remediation' => 'Restrict external sharing at the organisation level in SharePoint Admin Center. Apply per-site exceptions only where business-justified.',
        ];

        // 4. Guest Access Sites
        $guestCount = (clone $spQuery)->where('has_guest_access', true)->count();
        $guestPct = $totalSites > 0 ? round(($guestCount / $totalSites) * 100, 1) : 0;
        $checks[] = [
            'id' => 'guest_access_sites',
            'name' => 'Sites with Guest Access',
            'status' => $guestPct <= 10 ? 'pass' : ($guestPct <= 30 ? 'warning' : 'fail'),
            'detail' => "{$guestPct}% of sites have guest access ({$guestCount}/{$totalSites})",
            'value' => $guestPct,
            'target' => '<=10%',
            'remediation' => 'Review guest permissions on each site. Remove guest access where not required and implement periodic guest access reviews.',
        ];

        // 5. Site Ownership
        $ownedCount = (clone $spQuery)
            ->whereNotNull('owner_email')
            ->where('owner_email', '!=', '')
            ->count();
        $ownedPct = $totalSites > 0 ? round(($ownedCount / $totalSites) * 100, 1) : 0;
        $checks[] = [
            'id' => 'site_ownership',
            'name' => 'Site Ownership Assigned',
            'status' => $ownedPct >= 100 ? 'pass' : ($ownedPct >= 80 ? 'warning' : 'fail'),
            'detail' => "{$ownedPct}% of sites have an assigned owner ({$ownedCount}/{$totalSites})",
            'value' => $ownedPct,
            'target' => '100%',
            'remediation' => 'Assign owners to orphaned SharePoint sites in the Admin Center. Orphaned sites lack accountability for content and access.',
        ];

        // 6. Site Labels
        $labeledCount = (clone $spQuery)->whereNotNull('sensitivity_label')->count();
        $labelPct = $totalSites > 0 ? round(($labeledCount / $totalSites) * 100, 1) : 0;
        $checks[] = [
            'id' => 'site_labels',
            'name' => 'Sensitivity Labels on Sites',
            'status' => $labelPct >= 80 ? 'pass' : ($labelPct >= 40 ? 'warning' : 'fail'),
            'detail' => "{$labelPct}% of sites have sensitivity labels ({$labeledCount}/{$totalSites})",
            'value' => $labelPct,
            'target' => '>=80%',
            'remediation' => 'Apply sensitivity labels to SharePoint sites to control access and sharing based on content classification.',
        ];

        // 7. Overshared Content
        $oversharedCount = (clone $spQuery)->where('permissioned_user_count', '>', 50)->count();
        $oversharedPct = $totalSites > 0 ? round(($oversharedCount / $totalSites) * 100, 1) : 0;
        $checks[] = [
            'id' => 'overshared_content',
            'name' => 'Overshared Content',
            'status' => $oversharedPct <= 5 ? 'pass' : ($oversharedPct <= 20 ? 'warning' : 'fail'),
            'detail' => "{$oversharedPct}% of sites have >50 permissioned users ({$oversharedCount}/{$totalSites})",
            'value' => $oversharedPct,
            'target' => '<=5%',
            'remediation' => 'Review sites with excessive permissions. Use security groups instead of individual permissions and remove unnecessary access.',
        ];

        return $checks;
    }

    // ─── Category 4: Teams Configuration checks ─────────────────────

    /** @return array<int, array<string, mixed>> */
    private function buildTeamsChecks(?string $tenantId): array
    {
        $checks = [];

        $spQuery = DB::table('sharepoint_sites')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));

        // Teams-connected sites
        $teamsSites = (clone $spQuery)
            ->where(function ($q) {
                $q->where('site_template', 'like', '%GROUP%')
                  ->orWhere('site_template', 'like', '%TEAM%');
            });
        $totalTeamsSites = (clone $teamsSites)->count();

        // 1. Teams Site Governance
        $teamsExtSharing = (clone $teamsSites)->where('external_sharing', '!=', 'disabled')->count();
        $teamsExtPct = $totalTeamsSites > 0 ? round(($teamsExtSharing / $totalTeamsSites) * 100, 1) : 0;
        $checks[] = [
            'id' => 'teams_site_governance',
            'name' => 'Teams Site Governance',
            'status' => $teamsExtPct <= 30 ? 'pass' : ($teamsExtPct <= 60 ? 'warning' : 'fail'),
            'detail' => "{$teamsExtPct}% of Teams-connected sites have external sharing enabled ({$teamsExtSharing}/{$totalTeamsSites})",
            'value' => $teamsExtPct,
            'target' => '<=30%',
            'remediation' => 'Restrict external sharing on Teams-connected SharePoint sites. Use Teams admin policies to control guest access at the team level.',
        ];

        // 2. Teams External Collaboration
        $teamsGuests = (clone $teamsSites)->where('has_guest_access', true)->count();
        $teamsGuestPct = $totalTeamsSites > 0 ? round(($teamsGuests / $totalTeamsSites) * 100, 1) : 0;
        $checks[] = [
            'id' => 'teams_external_collab',
            'name' => 'Teams External Collaboration',
            'status' => $teamsGuestPct <= 20 ? 'pass' : ($teamsGuestPct <= 40 ? 'warning' : 'fail'),
            'detail' => "{$teamsGuestPct}% of Teams sites have guest users ({$teamsGuests}/{$totalTeamsSites})",
            'value' => $teamsGuestPct,
            'target' => '<=20%',
            'remediation' => 'Review guest membership in Teams. Remove guests from teams where external collaboration is not needed and set up periodic access reviews.',
        ];

        // 3. Meeting Policies (advisory)
        $checks[] = [
            'id' => 'meeting_policies',
            'name' => 'Meeting Policies',
            'status' => 'warning',
            'detail' => 'Meeting policy audit requires review in Teams Admin Center. Verify lobby, recording, and external participant settings.',
            'value' => 'Manual review',
            'target' => 'Configured',
            'remediation' => 'Review Teams meeting policies in the Teams Admin Center. Ensure lobby bypass is restricted, anonymous join is disabled where appropriate, and recording policies are set.',
        ];

        return $checks;
    }

    // ─── Category 5: Device Standards checks ─────────────────────────

    /** @return array<int, array<string, mixed>> */
    private function buildDeviceChecks(?string $tenantId): array
    {
        $checks = [];

        $devQuery = DB::table('devices')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $totalDevices = (clone $devQuery)->count();

        // 1. Device Compliance
        $compliant = (clone $devQuery)->where('compliance_state', 'compliant')->count();
        $compliantPct = $totalDevices > 0 ? round(($compliant / $totalDevices) * 100, 1) : 0;
        $checks[] = [
            'id' => 'device_compliance',
            'name' => 'Device Compliance',
            'status' => $compliantPct >= 90 ? 'pass' : ($compliantPct >= 70 ? 'warning' : 'fail'),
            'detail' => "{$compliantPct}% of devices are compliant ({$compliant}/{$totalDevices})",
            'value' => $compliantPct,
            'target' => '>=90%',
            'remediation' => 'Review non-compliant devices in Intune. Ensure compliance policies cover encryption, OS version, and antivirus. Use Conditional Access to block non-compliant devices.',
        ];

        // 2. Managed Devices
        $managed = (clone $devQuery)
            ->whereNotNull('managed_by')
            ->where('managed_by', '!=', '')
            ->count();
        $managedPct = $totalDevices > 0 ? round(($managed / $totalDevices) * 100, 1) : 0;
        $checks[] = [
            'id' => 'managed_devices',
            'name' => 'Managed Devices',
            'status' => $managedPct >= 80 ? 'pass' : ($managedPct >= 50 ? 'warning' : 'fail'),
            'detail' => "{$managedPct}% of devices are managed ({$managed}/{$totalDevices})",
            'value' => $managedPct,
            'target' => '>=80%',
            'remediation' => 'Enrol unmanaged devices in Intune or another MDM solution. Use Conditional Access to require managed devices for access.',
        ];

        // 3. OS Currency
        $currentOs = (clone $devQuery)
            ->where('os', 'like', '%Windows%')
            ->whereNotNull('os_version')
            ->count();
        $totalWindows = (clone $devQuery)->where('os', 'like', '%Windows%')->count();
        $osPct = $totalWindows > 0 ? round(($currentOs / $totalWindows) * 100, 1) : 0;
        $checks[] = [
            'id' => 'os_currency',
            'name' => 'OS Currency (Windows)',
            'status' => $osPct >= 80 ? 'pass' : ($osPct >= 60 ? 'warning' : 'fail'),
            'detail' => "{$osPct}% of Windows devices have a recorded OS version ({$currentOs}/{$totalWindows})",
            'value' => $osPct,
            'target' => '>=80%',
            'remediation' => 'Ensure Windows devices are running supported OS versions. Use Windows Update for Business or Intune to manage OS updates.',
        ];

        // 4. Stale Devices
        $thirtyDaysAgo = now()->subDays(30)->toDateString();
        $staleDevices = (clone $devQuery)
            ->where(function ($q) use ($thirtyDaysAgo) {
                $q->where('last_sync_at', '<', $thirtyDaysAgo)
                  ->orWhereNull('last_sync_at');
            })
            ->count();
        $stalePct = $totalDevices > 0 ? round(($staleDevices / $totalDevices) * 100, 1) : 0;
        $checks[] = [
            'id' => 'stale_devices',
            'name' => 'Stale Devices',
            'status' => $stalePct <= 5 ? 'pass' : ($stalePct <= 15 ? 'warning' : 'fail'),
            'detail' => "{$stalePct}% of devices have not synced in 30+ days ({$staleDevices}/{$totalDevices})",
            'value' => $stalePct,
            'target' => '<=5%',
            'remediation' => 'Remove or retire devices that have not synced in 30+ days. Investigate why devices are not checking in and remediate connectivity issues.',
        ];

        return $checks;
    }

    // ─── Category 6: Power Platform & AI Governance checks ──────────

    /** @return array<int, array<string, mixed>> */
    private function buildPowerPlatformChecks(?string $tenantId): array
    {
        $checks = [];

        // 1. Copilot Licensing
        $usersTotal = DB::table('users_normalized')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
            ->count();
        $copilotLicensed = DB::table('copilot_usage')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
            ->where('copilot_license_assigned', true)
            ->count();
        $licensePct = $usersTotal > 0 ? round(($copilotLicensed / $usersTotal) * 100, 1) : 0;
        $checks[] = [
            'id' => 'copilot_licensing',
            'name' => 'Copilot License Coverage',
            'status' => $licensePct >= 80 ? 'pass' : ($licensePct >= 40 ? 'warning' : 'fail'),
            'detail' => "{$licensePct}% of users have Copilot licenses ({$copilotLicensed}/{$usersTotal})",
            'value' => $licensePct,
            'target' => '>=80%',
            'remediation' => 'Assign Microsoft 365 Copilot licenses to users in the Admin Center. Prioritise users in roles that benefit most from AI assistance.',
        ];

        // 2. Copilot Adoption
        $thirtyDaysAgo = now()->subDays(30)->toDateString();
        $activeUsers = DB::table('copilot_usage')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
            ->where('copilot_license_assigned', true)
            ->where('last_activity_date', '>=', $thirtyDaysAgo)
            ->count();
        $adoptionPct = $copilotLicensed > 0 ? round(($activeUsers / $copilotLicensed) * 100, 1) : 0;
        $checks[] = [
            'id' => 'copilot_adoption',
            'name' => 'Copilot Adoption Rate',
            'status' => $adoptionPct >= 50 ? 'pass' : ($adoptionPct >= 20 ? 'warning' : 'fail'),
            'detail' => "{$adoptionPct}% of licensed users are active in last 30 days ({$activeUsers}/{$copilotLicensed})",
            'value' => $adoptionPct,
            'target' => '>=50%',
            'remediation' => 'Drive adoption with training sessions, prompt libraries, and champions programmes. Use Microsoft Copilot Dashboard for tracking.',
        ];

        // 3. Agent Governance
        $agentQuery = DB::table('copilot_agents')
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id));
        $problematicAgents = (clone $agentQuery)->where('status', '!=', 'active')->count();
        $checks[] = [
            'id' => 'agent_governance',
            'name' => 'Agent Governance',
            'status' => $problematicAgents === 0 ? 'pass' : 'warning',
            'detail' => $problematicAgents === 0
                ? 'All agents are active and properly governed'
                : "{$problematicAgents} agents are blocked or disabled and require review",
            'value' => $problematicAgents,
            'target' => '0 blocked/disabled',
            'remediation' => 'Review blocked or disabled agents in the Microsoft 365 Admin Center. Investigate why they were blocked and either remediate or remove them.',
        ];

        // 4. Custom Agents
        $customAgents = (clone $agentQuery)->where('agent_type', 'custom_engine')->count();
        $checks[] = [
            'id' => 'custom_agents',
            'name' => 'Custom Agents Review',
            'status' => 'pass',
            'detail' => "{$customAgents} custom engine agents deployed. Review data sources and permissions for each.",
            'value' => $customAgents,
            'target' => 'Reviewed',
            'remediation' => 'Periodically review custom Copilot agents for appropriate data source connections, permissions, and usage patterns.',
        ];

        return $checks;
    }
}
