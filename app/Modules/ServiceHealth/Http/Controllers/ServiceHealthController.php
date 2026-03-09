<?php

declare(strict_types=1);

namespace App\Modules\ServiceHealth\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class ServiceHealthController extends Controller
{
    public function overview(): JsonResponse
    {
        $activeIncidents = DB::table('service_health_events')
            ->where('classification', 'incident')
            ->whereIn('status', ['investigating', 'serviceInterruption', 'serviceRestored'])
            ->count();

        $advisories = DB::table('service_health_events')
            ->where('classification', 'advisory')
            ->whereNull('end_at')
            ->count();

        $affectedServices = DB::table('service_health_events')
            ->whereNull('end_at')
            ->distinct('service')
            ->count('service');

        $resolved7d = DB::table('service_health_events')
            ->whereNotNull('end_at')
            ->where('end_at', '>=', now()->subDays(7))
            ->count();

        $eventsByService = DB::table('service_health_events')
            ->select(['service', DB::raw('COUNT(*) as count')])
            ->groupBy('service')
            ->orderByDesc('count')
            ->get();

        $recentEvents = DB::table('service_health_events')
            ->leftJoin('managed_tenants', 'service_health_events.tenant_id', '=', 'managed_tenants.tenant_id')
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
}
