<?php

declare(strict_types=1);

namespace App\Modules\Groups\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class GroupsController extends Controller
{
    /**
     * Combined overview + paginated list endpoint.
     *
     * The frontend hook (useGroupsData) calls ONLY this endpoint and expects:
     *   - summary stats: total_groups, m365_groups, security_groups,
     *     distribution_groups, mail_enabled_security, ownerless_groups, dynamic_groups
     *   - type_distribution: [{type, count}, ...]
     *   - items: paginated Group[] rows with aliased fields
     *   - pagination: {total, per_page, current_page, last_page}
     */
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // ── Summary stats ────────────────────────────────────────────────────
        $baseQuery = DB::table('groups')
            ->when($tenantId, fn ($q, $id) => $q->where('groups.tenant_id', $id));

        $totalGroups = (clone $baseQuery)->count();

        $typeCounts = DB::table('groups')
            ->when($tenantId, fn ($q, $id) => $q->where('groups.tenant_id', $id))
            ->select(['group_type', DB::raw('COUNT(*) as count')])
            ->groupBy('group_type')
            ->pluck('count', 'group_type');

        $m365Groups       = (int) ($typeCounts['microsoft365'] ?? 0);
        $securityGroups   = (int) ($typeCounts['security'] ?? 0);
        $distributionGroups = (int) ($typeCounts['distribution'] ?? 0);
        $mailEnabledSecurity = (int) ($typeCounts['mail_enabled_security'] ?? 0);

        $ownerlessGroups = (clone $baseQuery)->where('owner_count', 0)->count();
        $dynamicGroups   = (clone $baseQuery)->where('membership_type', 'dynamic')->count();

        // ── Type distribution for chart ──────────────────────────────────────
        $typeDistribution = DB::table('groups')
            ->when($tenantId, fn ($q, $id) => $q->where('groups.tenant_id', $id))
            ->select([
                'group_type as type',
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy('group_type')
            ->orderByDesc('count')
            ->get();

        // ── Paginated items list ─────────────────────────────────────────────
        $query = DB::table('groups')
            ->leftJoin('managed_tenants', 'groups.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'groups.id',
                'groups.tenant_id',
                'managed_tenants.customer_name',
                'groups.display_name',
                'groups.group_type',
                'groups.membership_type',
                'groups.member_count',
                'groups.owner_count',
                'groups.visibility',
                'groups.last_activity_date as last_activity',
            ]);

        if ($tenantId) {
            $query->where('groups.tenant_id', $tenantId);
        }

        if ($request->filled('group_type')) {
            $query->where('groups.group_type', (string) $request->string('group_type'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('groups.display_name', 'like', "%{$search}%")
                  ->orWhere('groups.mail', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $groups = $query->orderBy('groups.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'total_groups'          => $totalGroups,
            'm365_groups'           => $m365Groups,
            'security_groups'       => $securityGroups,
            'distribution_groups'   => $distributionGroups,
            'mail_enabled_security' => $mailEnabledSecurity,
            'ownerless_groups'      => $ownerlessGroups,
            'dynamic_groups'        => $dynamicGroups,
            'type_distribution'     => $typeDistribution,
            'items'                 => $groups->items(),
            'pagination'            => [
                'total'        => $groups->total(),
                'per_page'     => $groups->perPage(),
                'current_page' => $groups->currentPage(),
                'last_page'    => $groups->lastPage(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('groups')
            ->leftJoin('managed_tenants', 'groups.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'groups.id',
                'groups.tenant_id',
                'managed_tenants.customer_name',
                'groups.display_name',
                'groups.group_type',
                'groups.membership_type',
                'groups.member_count',
                'groups.owner_count',
                'groups.visibility',
                'groups.last_activity_date as last_activity',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('groups.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('group_type')) {
            $query->where('groups.group_type', (string) $request->string('group_type'));
        }

        if ($request->filled('has_owners')) {
            if ($request->boolean('has_owners')) {
                $query->where('groups.owner_count', '>', 0);
            } else {
                $query->where('groups.owner_count', 0);
            }
        }

        if ($request->filled('membership_type')) {
            $query->where('groups.membership_type', (string) $request->string('membership_type'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('groups.display_name', 'like', "%{$search}%")
                  ->orWhere('groups.mail', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $groups = $query->orderBy('groups.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $groups->items(),
            'pagination' => [
                'total' => $groups->total(),
                'per_page' => $groups->perPage(),
                'current_page' => $groups->currentPage(),
                'last_page' => $groups->lastPage(),
            ],
        ]);
    }
}
