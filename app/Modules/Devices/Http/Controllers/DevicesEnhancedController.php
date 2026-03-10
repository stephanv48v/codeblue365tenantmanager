<?php

declare(strict_types=1);

namespace App\Modules\Devices\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class DevicesEnhancedController extends Controller
{
    public function compliancePolicies(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $baseQuery = DB::table('compliance_policies')
            ->when($tenantId, fn ($q, $id) => $q->where('compliance_policies.tenant_id', $id));

        $totalPolicies = (clone $baseQuery)->count();
        $totalAssigned = (int) (clone $baseQuery)->sum('assigned_count');
        $totalCompliant = (int) (clone $baseQuery)->sum('compliant_count');
        $totalNonCompliant = (int) (clone $baseQuery)->sum('non_compliant_count');
        $overallComplianceRate = $totalAssigned > 0 ? round(($totalCompliant / $totalAssigned) * 100, 1) : 0;

        $byPlatform = DB::table('compliance_policies')
            ->when($tenantId, fn ($q, $id) => $q->where('compliance_policies.tenant_id', $id))
            ->select([
                'platform',
                DB::raw('SUM(compliant_count) as compliant'),
                DB::raw('SUM(non_compliant_count) as non_compliant'),
                DB::raw('SUM(error_count) as error'),
            ])
            ->groupBy('platform')
            ->orderBy('platform')
            ->get();

        // Paginated list
        $query = DB::table('compliance_policies')
            ->leftJoin('managed_tenants', 'compliance_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'compliance_policies.id',
                'compliance_policies.tenant_id',
                'managed_tenants.customer_name',
                'compliance_policies.policy_name',
                'compliance_policies.platform',
                'compliance_policies.assigned_count',
                'compliance_policies.compliant_count',
                'compliance_policies.non_compliant_count',
                'compliance_policies.error_count',
                DB::raw("CASE WHEN compliance_policies.assigned_count > 0 THEN ROUND((compliance_policies.compliant_count * 100.0 / compliance_policies.assigned_count), 1) ELSE 0 END as compliance_rate"),
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('compliance_policies.tenant_id', $id));

        if ($request->filled('platform')) {
            $query->where('compliance_policies.platform', (string) $request->string('platform'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('compliance_policies.policy_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $policies = $query->orderBy('compliance_policies.policy_name')->get();

        return ApiResponse::success([
            'summary' => [
                'total_policies' => $totalPolicies,
                'overall_compliance_rate' => $overallComplianceRate,
                'non_compliant_devices' => $totalNonCompliant,
            ],
            'policies' => $policies,
            'platform_breakdown' => $byPlatform,
        ]);
    }

    public function autopilot(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $baseQuery = DB::table('autopilot_devices')
            ->when($tenantId, fn ($q, $id) => $q->where('autopilot_devices.tenant_id', $id));

        $totalDevices = (clone $baseQuery)->count();
        $enrolled = (clone $baseQuery)->where('enrollment_status', 'enrolled')->count();
        $pending = (clone $baseQuery)->where('enrollment_status', 'pending')->count();
        $failed = (clone $baseQuery)->where('enrollment_status', 'failed')->count();

        $byStatus = DB::table('autopilot_devices')
            ->when($tenantId, fn ($q, $id) => $q->where('autopilot_devices.tenant_id', $id))
            ->select([
                'enrollment_status as status',
                DB::raw('COUNT(*) as count'),
            ])
            ->groupBy('enrollment_status')
            ->orderBy('enrollment_status')
            ->get();

        // Paginated list
        $query = DB::table('autopilot_devices')
            ->leftJoin('managed_tenants', 'autopilot_devices.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'autopilot_devices.id',
                'autopilot_devices.tenant_id',
                'managed_tenants.customer_name',
                'autopilot_devices.serial_number',
                'autopilot_devices.model',
                'autopilot_devices.manufacturer',
                'autopilot_devices.enrollment_status',
                'autopilot_devices.deployment_profile',
                'autopilot_devices.group_tag',
                'autopilot_devices.last_contacted_date as last_contacted',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('autopilot_devices.tenant_id', $id));

        if ($request->filled('enrollment_status')) {
            $query->where('autopilot_devices.enrollment_status', (string) $request->string('enrollment_status'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('autopilot_devices.serial_number', 'like', "%{$search}%")
                  ->orWhere('autopilot_devices.model', 'like', "%{$search}%")
                  ->orWhere('autopilot_devices.manufacturer', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderBy('autopilot_devices.serial_number')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'summary' => [
                'total_devices' => $totalDevices,
                'enrolled' => $enrolled,
                'pending' => $pending,
                'failed' => $failed,
            ],
            'devices' => $paginated->items(),
            'enrollment_breakdown' => $byStatus,
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }
}
