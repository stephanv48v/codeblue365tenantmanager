<?php

declare(strict_types=1);

namespace App\Modules\Licensing\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class LicensingController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $totalLicenses = (int) DB::table('licenses')->when($tenantId, fn($q, $id) => $q->where('licenses.tenant_id', $id))->sum('total');
        $assigned = (int) DB::table('licenses')->when($tenantId, fn($q, $id) => $q->where('licenses.tenant_id', $id))->sum('assigned');
        $available = $totalLicenses - $assigned;
        $wastePercent = $totalLicenses > 0 ? round(($available / $totalLicenses) * 100, 1) : 0;

        $topSkus = DB::table('licenses')
            ->when($tenantId, fn($q, $id) => $q->where('licenses.tenant_id', $id))
            ->select([
                'sku_name',
                DB::raw('SUM(total) as total'),
                DB::raw('SUM(assigned) as assigned'),
                DB::raw('SUM(total) - SUM(assigned) as available'),
            ])
            ->groupBy('sku_name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $perTenantUtilization = DB::table('licenses')
            ->join('managed_tenants', 'licenses.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn($q, $id) => $q->where('licenses.tenant_id', $id))
            ->select([
                'managed_tenants.customer_name',
                'licenses.tenant_id',
                DB::raw('SUM(licenses.total) as total'),
                DB::raw('SUM(licenses.assigned) as assigned'),
                DB::raw('SUM(licenses.total) - SUM(licenses.assigned) as available'),
            ])
            ->groupBy('managed_tenants.customer_name', 'licenses.tenant_id')
            ->orderBy('managed_tenants.customer_name')
            ->get();

        return ApiResponse::success([
            'total_licenses' => $totalLicenses,
            'assigned' => $assigned,
            'available' => $available,
            'waste_percent' => $wastePercent,
            'top_skus' => $topSkus,
            'per_tenant_utilization' => $perTenantUtilization,
        ]);
    }
}
