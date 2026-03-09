<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class SyncController extends Controller
{
    public function tenantHistory(Request $request, string $tenantId): JsonResponse
    {
        $query = DB::table('sync_runs')
            ->where('tenant_id', $tenantId);

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        $runs = $query->orderByDesc('started_at')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $runs->items(),
            'pagination' => [
                'total' => $runs->total(),
                'per_page' => $runs->perPage(),
                'current_page' => $runs->currentPage(),
                'last_page' => $runs->lastPage(),
            ],
        ]);
    }

    public function trends(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;
        $thirtyDaysAgo = now()->subDays(30)->toDateString();

        $trends = DB::table('sync_runs')
            ->select([
                DB::raw("DATE(started_at) as date"),
                DB::raw("SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success"),
                DB::raw("SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed"),
                DB::raw("SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial"),
                DB::raw('COUNT(*) as total'),
            ])
            ->where('started_at', '>=', $thirtyDaysAgo)
            ->when($tenantId, fn($q, $id) => $q->where('tenant_id', $id))
            ->groupBy(DB::raw('DATE(started_at)'))
            ->orderBy('date')
            ->get();

        return ApiResponse::success([
            'items' => $trends,
        ]);
    }
}
