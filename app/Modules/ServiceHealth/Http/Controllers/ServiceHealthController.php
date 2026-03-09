<?php

declare(strict_types=1);

namespace App\Modules\ServiceHealth\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class ServiceHealthController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $activeIncidents = DB::table('service_health_events')
            ->where('classification', 'incident')
            ->whereIn('status', ['investigating', 'serviceInterruption', 'serviceRestored'])
            ->when($tenantId, fn($q, $id) => $q->where('service_health_events.tenant_id', $id))
            ->count();

        $advisories = DB::table('service_health_events')
            ->where('classification', 'advisory')
            ->whereNull('end_at')
            ->when($tenantId, fn($q, $id) => $q->where('service_health_events.tenant_id', $id))
            ->count();

        $affectedServices = DB::table('service_health_events')
            ->whereNull('end_at')
            ->when($tenantId, fn($q, $id) => $q->where('service_health_events.tenant_id', $id))
            ->distinct('service')
            ->count('service');

        $resolved7d = DB::table('service_health_events')
            ->whereNotNull('end_at')
            ->where('end_at', '>=', now()->subDays(7))
            ->when($tenantId, fn($q, $id) => $q->where('service_health_events.tenant_id', $id))
            ->count();

        $eventsByService = DB::table('service_health_events')
            ->when($tenantId, fn($q, $id) => $q->where('service_health_events.tenant_id', $id))
            ->select(['service', DB::raw('COUNT(*) as count')])
            ->groupBy('service')
            ->orderByDesc('count')
            ->get();

        $recentEvents = DB::table('service_health_events')
            ->leftJoin('managed_tenants', 'service_health_events.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn($q, $id) => $q->where('service_health_events.tenant_id', $id))
            ->select([
                'service_health_events.*',
                'managed_tenants.customer_name',
            ])
            ->orderByDesc('service_health_events.start_at')
            ->limit(20)
            ->get();

        return ApiResponse::success([
            'active_incidents' => $activeIncidents,
            'advisories' => $advisories,
            'affected_services' => $affectedServices,
            'resolved_7d' => $resolved7d,
            'events_by_service' => $eventsByService,
            'recent_events' => $recentEvents,
        ]);
    }

    public function events(Request $request): JsonResponse
    {
        $query = DB::table('service_health_events')
            ->leftJoin('managed_tenants', 'service_health_events.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'service_health_events.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('service_health_events.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('classification')) {
            $query->where('service_health_events.classification', (string) $request->string('classification'));
        }

        if ($request->filled('service')) {
            $query->where('service_health_events.service', (string) $request->string('service'));
        }

        if ($request->filled('status')) {
            $query->where('service_health_events.status', (string) $request->string('status'));
        }

        $events = $query->orderByDesc('service_health_events.start_at')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $events->items(),
            'pagination' => [
                'total' => $events->total(),
                'per_page' => $events->perPage(),
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
            ],
        ]);
    }
}
