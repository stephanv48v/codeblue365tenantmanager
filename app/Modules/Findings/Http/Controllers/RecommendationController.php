<?php

declare(strict_types=1);

namespace App\Modules\Findings\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('recommendations')
            ->leftJoin('managed_tenants', 'recommendations.tenant_id', '=', 'managed_tenants.tenant_id')
            ->leftJoin('findings', 'recommendations.finding_id', '=', 'findings.id')
            ->select([
                'recommendations.*',
                'managed_tenants.customer_name',
                'findings.severity as finding_severity',
                'findings.description as finding_description',
                'findings.category as finding_category',
                'findings.status as finding_status',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('recommendations.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('recommendations.status', (string) $request->string('status'));
        }

        if ($request->filled('priority')) {
            $query->where('recommendations.priority', (string) $request->string('priority'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('recommendations.title', 'like', "%{$search}%")
                  ->orWhere('recommendations.description', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $recommendations = $query
            ->orderByRaw("CASE recommendations.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
            ->orderByDesc('recommendations.created_at')
            ->paginate((int) $request->integer('per_page', 25));

        // Summary counts
        $countQuery = DB::table('recommendations');
        if ($request->filled('tenant_id')) {
            $countQuery->where('tenant_id', (string) $request->string('tenant_id'));
        }

        $total = $countQuery->count();
        $open = (clone $countQuery)->where('status', 'open')->count();
        $inProgress = (clone $countQuery)->where('status', 'in_progress')->count();
        $resolved = (clone $countQuery)->where('status', 'resolved')->count();

        return ApiResponse::success([
            'items' => $recommendations->items(),
            'pagination' => [
                'total' => $recommendations->total(),
                'per_page' => $recommendations->perPage(),
                'current_page' => $recommendations->currentPage(),
                'last_page' => $recommendations->lastPage(),
            ],
            'summary' => [
                'total' => $total,
                'open' => $open,
                'in_progress' => $inProgress,
                'resolved' => $resolved,
            ],
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:open,in_progress,resolved'],
        ]);

        $affected = DB::table('recommendations')
            ->where('id', $id)
            ->update([
                'status' => $validated['status'],
                'updated_at' => now(),
            ]);

        if ($affected === 0) {
            return ApiResponse::error('not_found', 'Recommendation not found.', 404);
        }

        return ApiResponse::success(['message' => 'Recommendation updated.']);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
            'action' => ['required', 'string', 'in:start,resolve,reopen'],
        ]);

        $statusMap = [
            'start' => 'in_progress',
            'resolve' => 'resolved',
            'reopen' => 'open',
        ];

        $newStatus = $statusMap[$validated['action']];

        $affected = DB::table('recommendations')
            ->whereIn('id', $validated['ids'])
            ->update([
                'status' => $newStatus,
                'updated_at' => now(),
            ]);

        DB::table('audit_logs')->insert([
            'event_type' => 'recommendations.bulk_' . $validated['action'],
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'recommendation_ids' => $validated['ids'],
                'action' => $validated['action'],
                'affected' => $affected,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success([
            'message' => "Successfully updated {$affected} recommendations.",
            'affected' => $affected,
        ]);
    }
}
