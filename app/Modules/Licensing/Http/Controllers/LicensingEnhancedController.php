<?php

declare(strict_types=1);

namespace App\Modules\Licensing\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class LicensingEnhancedController extends Controller
{
    public function costAnalysis(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $baseQuery = DB::table('license_cost_analysis')
            ->when($tenantId, fn ($q, $id) => $q->where('license_cost_analysis.tenant_id', $id));

        $totalMonthlyCost = (float) (clone $baseQuery)->sum('total_monthly_cost');
        $totalWasted = (float) (clone $baseQuery)->sum('wasted_monthly_cost');
        $totalPurchased = (int) (clone $baseQuery)->sum('purchased_units');
        $totalAssigned = (int) (clone $baseQuery)->sum('assigned_units');
        $potentialSavings = $totalWasted;
        $utilizationPercent = $totalPurchased > 0 ? round(($totalAssigned / $totalPurchased) * 100, 1) : 0;

        // Paginated list
        $query = DB::table('license_cost_analysis')
            ->leftJoin('managed_tenants', 'license_cost_analysis.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'license_cost_analysis.id',
                'license_cost_analysis.tenant_id',
                'managed_tenants.customer_name',
                'license_cost_analysis.sku_friendly_name',
                'license_cost_analysis.purchased_units',
                'license_cost_analysis.assigned_units',
                'license_cost_analysis.active_units',
                'license_cost_analysis.cost_per_unit_monthly as cost_per_unit',
                'license_cost_analysis.total_monthly_cost',
                'license_cost_analysis.wasted_monthly_cost',
                'license_cost_analysis.optimization_recommendation',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('license_cost_analysis.tenant_id', $id));

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('license_cost_analysis.sku_name', 'like', "%{$search}%")
                  ->orWhere('license_cost_analysis.sku_friendly_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderByDesc('license_cost_analysis.total_monthly_cost')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'summary' => [
                'total_monthly_spend' => round($totalMonthlyCost, 2),
                'total_wasted' => round($totalWasted, 2),
                'potential_savings' => round($potentialSavings, 2),
                'license_utilization_percent' => $utilizationPercent,
            ],
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }
}
