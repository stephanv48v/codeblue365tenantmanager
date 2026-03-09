<?php

declare(strict_types=1);

namespace App\Modules\Devices\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class DevicesDashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $totalDevices = DB::table('devices')->when($tenantId, fn($q, $id) => $q->where('devices.tenant_id', $id))->count();

        $compliant = DB::table('devices')->where('compliance_state', 'compliant')->when($tenantId, fn($q, $id) => $q->where('devices.tenant_id', $id))->count();
        $nonCompliant = $totalDevices - $compliant;
        $complianceRate = $totalDevices > 0 ? round(($compliant / $totalDevices) * 100, 1) : 0;

        $managed = DB::table('devices')->whereNotNull('managed_by')->when($tenantId, fn($q, $id) => $q->where('devices.tenant_id', $id))->count();
        $unmanaged = $totalDevices - $managed;

        $osDistribution = DB::table('devices')
            ->when($tenantId, fn($q, $id) => $q->where('devices.tenant_id', $id))
            ->select(['os', DB::raw('COUNT(*) as count')])
            ->groupBy('os')
            ->orderByDesc('count')
            ->get();

        $complianceByTenant = DB::table('devices')
            ->join('managed_tenants', 'devices.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn($q, $id) => $q->where('devices.tenant_id', $id))
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
