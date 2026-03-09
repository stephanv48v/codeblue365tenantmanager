<?php

declare(strict_types=1);

namespace App\Modules\Licensing\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class LicensingController extends Controller
{
    public function overview(): JsonResponse
    {
        $totalLicenses = (int) DB::table('licenses')->sum('total_units');
        $assigned = (int) DB::table('licenses')->sum('assigned_units');
        $available = $totalLicenses - $assigned;
        $wastePercent = $totalLicenses > 0 ? round(($available / $totalLicenses) * 100, 1) : 0;

        $topSkus = DB::table('licenses')
            ->select([
                'sku_name',
                DB::raw('SUM(total_units) as total'),
                DB::raw('SUM(assigned_units) as assigned'),
                DB::raw('SUM(total_units) - SUM(assigned_units) as available'),
            ])
            ->groupBy('sku_name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $perTenantUtilization = DB::table('licenses')
            ->join('managed_tenants', 'licenses.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'managed_tenants.customer_name',
                'licenses.tenant_id',
                DB::raw('SUM(licenses.total_units) as total'),
                DB::raw('SUM(licenses.assigned_units) as assigned'),
                DB::raw('SUM(licenses.total_units) - SUM(licenses.assigned_units) as available'),
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
