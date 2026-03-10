<?php

declare(strict_types=1);

namespace App\Modules\TenantComparison\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class TenantComparisonController extends Controller
{
    /**
     * The metric names expected by the frontend.
     */
    private const METRIC_NAMES = [
        'secure_score',
        'mfa_coverage',
        'device_compliance',
        'copilot_adoption',
        'conditional_access_policies',
        'admin_mfa_coverage',
        'stale_accounts',
        'license_utilization',
    ];

    public function benchmarks(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // Get the latest report_date per tenant per metric from tenant_benchmarks
        $latestDates = DB::table('tenant_benchmarks')
            ->select('tenant_id', 'metric_name', DB::raw('MAX(report_date) as max_date'))
            ->whereIn('metric_name', self::METRIC_NAMES)
            ->when($tenantId, fn ($q, $id) => $q->where('tenant_id', $id))
            ->groupBy('tenant_id', 'metric_name');

        $rawBenchmarks = DB::table('tenant_benchmarks as tb')
            ->joinSub($latestDates, 'latest', function ($join): void {
                $join->on('tb.tenant_id', '=', 'latest.tenant_id')
                    ->on('tb.metric_name', '=', 'latest.metric_name')
                    ->on('tb.report_date', '=', 'latest.max_date');
            })
            ->leftJoin('managed_tenants', 'tb.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'tb.tenant_id',
                'managed_tenants.customer_name',
                'tb.metric_name',
                'tb.metric_value',
                'tb.fleet_average',
            ])
            ->get();

        if ($rawBenchmarks->isEmpty()) {
            $emptyAverages = array_fill_keys(self::METRIC_NAMES, 0);

            return ApiResponse::success([
                'fleet_averages' => $emptyAverages,
                'tenants' => [],
            ]);
        }

        // Pivot: group by tenant, turning metric_name rows into columns
        $grouped = $rawBenchmarks->groupBy('tenant_id');

        $tenants = $grouped->map(function ($rows, $tenantIdKey) {
            $entry = [
                'tenant_id' => $tenantIdKey,
                'customer_name' => $rows->first()->customer_name ?? $tenantIdKey,
            ];

            foreach (self::METRIC_NAMES as $metric) {
                $row = $rows->firstWhere('metric_name', $metric);
                $entry[$metric] = $row ? round((float) $row->metric_value, 1) : 0;
            }

            return $entry;
        })->values();

        // Compute fleet averages from the fleet_average column in the data,
        // or if that's not reliable, compute from actual tenant values
        $fleetAverages = [];
        foreach (self::METRIC_NAMES as $metric) {
            // Try to get fleet_average from the first row that has this metric
            $metricRow = $rawBenchmarks->firstWhere('metric_name', $metric);
            if ($metricRow && $metricRow->fleet_average > 0) {
                $fleetAverages[$metric] = round((float) $metricRow->fleet_average, 1);
            } else {
                // Fall back to computing from tenant values
                $values = $tenants->pluck($metric)->filter(fn ($v) => $v > 0);
                $fleetAverages[$metric] = $values->isNotEmpty() ? round($values->avg(), 1) : 0;
            }
        }

        return ApiResponse::success([
            'fleet_averages' => $fleetAverages,
            'tenants' => $tenants,
        ]);
    }

    public function compare(Request $request): JsonResponse
    {
        $tenantIds = $request->input('tenant_ids', []);

        if (! is_array($tenantIds) || count($tenantIds) < 2) {
            return ApiResponse::error(
                'invalid_request',
                'Please provide at least 2 tenant IDs in the tenant_ids[] parameter.',
                422
            );
        }

        // Get the latest report_date per tenant per metric
        $latestDates = DB::table('tenant_benchmarks')
            ->select('tenant_id', 'metric_name', DB::raw('MAX(report_date) as max_date'))
            ->whereIn('tenant_id', $tenantIds)
            ->whereIn('metric_name', self::METRIC_NAMES)
            ->groupBy('tenant_id', 'metric_name');

        $rawBenchmarks = DB::table('tenant_benchmarks as tb')
            ->joinSub($latestDates, 'latest', function ($join): void {
                $join->on('tb.tenant_id', '=', 'latest.tenant_id')
                    ->on('tb.metric_name', '=', 'latest.metric_name')
                    ->on('tb.report_date', '=', 'latest.max_date');
            })
            ->leftJoin('managed_tenants', 'tb.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'tb.tenant_id',
                'managed_tenants.customer_name',
                'tb.metric_name',
                'tb.metric_value',
                'tb.fleet_average',
            ])
            ->get();

        // Pivot: group by tenant
        $grouped = $rawBenchmarks->groupBy('tenant_id');

        $comparison = $grouped->map(function ($rows, $tenantIdKey) {
            $entry = [
                'tenant_id' => $tenantIdKey,
                'customer_name' => $rows->first()->customer_name ?? $tenantIdKey,
            ];

            foreach (self::METRIC_NAMES as $metric) {
                $row = $rows->firstWhere('metric_name', $metric);
                $entry[$metric] = $row ? round((float) $row->metric_value, 1) : 0;
            }

            return $entry;
        })->values();

        // Compute fleet averages
        $fleetAverages = [];
        foreach (self::METRIC_NAMES as $metric) {
            $metricRow = $rawBenchmarks->firstWhere('metric_name', $metric);
            if ($metricRow && $metricRow->fleet_average > 0) {
                $fleetAverages[$metric] = round((float) $metricRow->fleet_average, 1);
            } else {
                $values = $comparison->pluck($metric)->filter(fn ($v) => $v > 0);
                $fleetAverages[$metric] = $values->isNotEmpty() ? round($values->avg(), 1) : 0;
            }
        }

        return ApiResponse::success([
            'tenant_count' => count($tenantIds),
            'fleet_averages' => $fleetAverages,
            'comparison' => $comparison,
        ]);
    }
}
