<?php

declare(strict_types=1);

namespace App\Modules\PowerPlatform\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class PowerPlatformController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // --- Summary stats ---
        $appsQuery = DB::table('power_apps')
            ->when($tenantId, fn ($q, $id) => $q->where('power_apps.tenant_id', $id));

        $totalApps = (clone $appsQuery)->count();

        $flowsQuery = DB::table('power_automate_flows')
            ->when($tenantId, fn ($q, $id) => $q->where('power_automate_flows.tenant_id', $id));

        $totalFlows = (clone $flowsQuery)->count();
        $flowsWithFailures = (clone $flowsQuery)->where('failures_last_30d', '>', 0)->count();

        // Count premium connector usage across apps and flows
        $premiumApps = DB::table('power_apps')
            ->when($tenantId, fn ($q, $id) => $q->where('power_apps.tenant_id', $id))
            ->where('connectors_json', 'like', '%premium%')
            ->count();

        $premiumFlows = DB::table('power_automate_flows')
            ->when($tenantId, fn ($q, $id) => $q->where('power_automate_flows.tenant_id', $id))
            ->where('uses_premium_connector', true)
            ->count();

        $externalConnections = DB::table('power_automate_flows')
            ->when($tenantId, fn ($q, $id) => $q->where('power_automate_flows.tenant_id', $id))
            ->where('has_external_connection', true)
            ->count();

        // --- Apps list with aliased field names ---
        $apps = DB::table('power_apps')
            ->leftJoin('managed_tenants', 'power_apps.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn ($q, $id) => $q->where('power_apps.tenant_id', $id))
            ->select([
                'power_apps.id',
                'power_apps.tenant_id',
                'managed_tenants.customer_name',
                'power_apps.display_name',
                'power_apps.owner',
                'power_apps.environment_name',
                'power_apps.app_type',
                'power_apps.sessions_last_30d',
                'power_apps.shared_users_count',
                'power_apps.status',
            ])
            ->orderBy('power_apps.display_name')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'tenant_id' => $a->tenant_id,
                'customer_name' => $a->customer_name,
                'display_name' => $a->display_name,
                'owner' => $a->owner ?? '',
                'environment' => $a->environment_name ?? '',
                'type' => $a->app_type,
                'sessions_30d' => (int) $a->sessions_last_30d,
                'shared_users' => (int) $a->shared_users_count,
                'status' => $a->status,
            ]);

        // --- Flows list with aliased field names ---
        $flows = DB::table('power_automate_flows')
            ->leftJoin('managed_tenants', 'power_automate_flows.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn ($q, $id) => $q->where('power_automate_flows.tenant_id', $id))
            ->select([
                'power_automate_flows.id',
                'power_automate_flows.tenant_id',
                'managed_tenants.customer_name',
                'power_automate_flows.display_name',
                'power_automate_flows.owner',
                'power_automate_flows.flow_type',
                'power_automate_flows.status',
                'power_automate_flows.runs_last_30d',
                'power_automate_flows.failures_last_30d',
                'power_automate_flows.uses_premium_connector',
                'power_automate_flows.has_external_connection',
            ])
            ->orderBy('power_automate_flows.display_name')
            ->get()
            ->map(fn ($f) => [
                'id' => $f->id,
                'tenant_id' => $f->tenant_id,
                'customer_name' => $f->customer_name,
                'display_name' => $f->display_name,
                'owner' => $f->owner ?? '',
                'type' => $f->flow_type,
                'status' => $f->status,
                'runs_30d' => (int) $f->runs_last_30d,
                'failures_30d' => (int) $f->failures_last_30d,
                'is_premium' => (bool) $f->uses_premium_connector,
                'is_external' => (bool) $f->has_external_connection,
            ]);

        return ApiResponse::success([
            'summary' => [
                'total_apps' => $totalApps,
                'total_flows' => $totalFlows,
                'flows_with_failures' => $flowsWithFailures,
                'premium_connector_usage' => $premiumApps + $premiumFlows,
                'external_connections' => $externalConnections,
            ],
            'apps' => $apps,
            'flows' => $flows,
        ]);
    }

    public function apps(Request $request): JsonResponse
    {
        $query = DB::table('power_apps')
            ->leftJoin('managed_tenants', 'power_apps.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'power_apps.id',
                'power_apps.tenant_id',
                'managed_tenants.customer_name',
                'power_apps.display_name',
                'power_apps.owner',
                'power_apps.environment_name',
                'power_apps.app_type',
                'power_apps.sessions_last_30d',
                'power_apps.shared_users_count',
                'power_apps.status',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('power_apps.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('power_apps.display_name', 'like', "%{$search}%")
                  ->orWhere('power_apps.owner', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $apps = $query->orderBy('power_apps.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        $items = collect($apps->items())->map(fn ($a) => [
            'id' => $a->id,
            'tenant_id' => $a->tenant_id,
            'customer_name' => $a->customer_name,
            'display_name' => $a->display_name,
            'owner' => $a->owner ?? '',
            'environment' => $a->environment_name ?? '',
            'type' => $a->app_type,
            'sessions_30d' => (int) $a->sessions_last_30d,
            'shared_users' => (int) $a->shared_users_count,
            'status' => $a->status,
        ]);

        return ApiResponse::success([
            'items' => $items,
            'pagination' => [
                'total' => $apps->total(),
                'per_page' => $apps->perPage(),
                'current_page' => $apps->currentPage(),
                'last_page' => $apps->lastPage(),
            ],
        ]);
    }

    public function flows(Request $request): JsonResponse
    {
        $query = DB::table('power_automate_flows')
            ->leftJoin('managed_tenants', 'power_automate_flows.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'power_automate_flows.id',
                'power_automate_flows.tenant_id',
                'managed_tenants.customer_name',
                'power_automate_flows.display_name',
                'power_automate_flows.owner',
                'power_automate_flows.flow_type',
                'power_automate_flows.status',
                'power_automate_flows.runs_last_30d',
                'power_automate_flows.failures_last_30d',
                'power_automate_flows.uses_premium_connector',
                'power_automate_flows.has_external_connection',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('power_automate_flows.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('has_failures')) {
            $query->where('power_automate_flows.failures_last_30d', '>', 0);
        }

        if ($request->filled('status')) {
            $query->where('power_automate_flows.status', (string) $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('power_automate_flows.display_name', 'like', "%{$search}%")
                  ->orWhere('power_automate_flows.owner', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $flows = $query->orderBy('power_automate_flows.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        $items = collect($flows->items())->map(fn ($f) => [
            'id' => $f->id,
            'tenant_id' => $f->tenant_id,
            'customer_name' => $f->customer_name,
            'display_name' => $f->display_name,
            'owner' => $f->owner ?? '',
            'type' => $f->flow_type,
            'status' => $f->status,
            'runs_30d' => (int) $f->runs_last_30d,
            'failures_30d' => (int) $f->failures_last_30d,
            'is_premium' => (bool) $f->uses_premium_connector,
            'is_external' => (bool) $f->has_external_connection,
        ]);

        return ApiResponse::success([
            'items' => $items,
            'pagination' => [
                'total' => $flows->total(),
                'per_page' => $flows->perPage(),
                'current_page' => $flows->currentPage(),
                'last_page' => $flows->lastPage(),
            ],
        ]);
    }
}
