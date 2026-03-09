<?php

declare(strict_types=1);

namespace App\Modules\Devices\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class DevicesDashboardController extends Controller
{
    public function overview(): JsonResponse
    {
        $totalDevices = DB::table('devices')->count();

        $compliant = DB::table('devices')->where('compliance_state', 'compliant')->count();
        $nonCompliant = $totalDevices - $compliant;
        $complianceRate = $totalDevices > 0 ? round(($compliant / $totalDevices) * 100, 1) : 0;

        $managed = DB::table('devices')->where('is_managed', true)->count();
        $unmanaged = $totalDevices - $managed;

        $osDistribution = DB::table('devices')
            ->select(['operating_system', DB::raw('COUNT(*) as count')])
            ->groupBy('operating_system')
            ->orderByDesc('count')
            ->get();

        $complianceByTenant = DB::table('devices')
            ->join('managed_tenants', 'devices.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'managed_tenants.customer_name',
                'devices.tenant_id',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN devices.compliance_state = 'compliant' THEN 1 ELSE 0 END) as compliant"),
            ])
            ->groupBy('managed_tenants.customer_name', 'devices.tenant_id')
            ->orderBy('managed_tenants.customer_name')
            ->get();

        return ApiResponse::success([
            'total' => $totalDevices,
            'compliant' => $compliant,
            'non_compliant' => $nonCompliant,
            'compliance_rate' => $complianceRate,
            'managed' => $managed,
            'unmanaged' => $unmanaged,
            'os_distribution' => $osDistribution,
            'compliance_by_tenant' => $complianceByTenant,
        ]);
    }
}
