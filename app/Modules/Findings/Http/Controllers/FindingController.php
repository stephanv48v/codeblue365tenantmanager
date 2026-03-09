<?php

declare(strict_types=1);

namespace App\Modules\Findings\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class FindingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('findings')
            ->leftJoin('managed_tenants', 'findings.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'findings.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('findings.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('severity')) {
            $query->where('findings.severity', (string) $request->string('severity'));
        }

        if ($request->filled('category')) {
            $query->where('findings.category', (string) $request->string('category'));
        }

        if ($request->filled('status')) {
            $query->where('findings.status', (string) $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('findings.description', 'like', "%{$search}%")
                  ->orWhere('findings.category', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $findings = $query->orderByRaw("CASE findings.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END")
            ->orderByDesc('findings.last_detected_at')
            ->paginate((int) $request->integer('per_page', 25));

        // Summary counts
        $countQuery = DB::table('findings');

        if ($request->filled('tenant_id')) {
            $countQuery->where('tenant_id', (string) $request->string('tenant_id'));
        }

        $total = $countQuery->count();
        $critical = (clone $countQuery)->where('severity', 'critical')->count();
        $high = (clone $countQuery)->where('severity', 'high')->count();
        $medium = (clone $countQuery)->where('severity', 'medium')->count();
        $low = (clone $countQuery)->where('severity', 'low')->count();
        $open = (clone $countQuery)->where(function ($q): void {
            $q->where('status', 'open')->orWhereNull('status');
        })->count();

        return ApiResponse::success([
            'items' => $findings->items(),
            'pagination' => [
                'total' => $findings->total(),
                'per_page' => $findings->perPage(),
                'current_page' => $findings->currentPage(),
                'last_page' => $findings->lastPage(),
            ],
            'summary' => [
                'total' => $total,
                'critical' => $critical,
                'high' => $high,
                'medium' => $medium,
                'low' => $low,
                'open' => $open,
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $finding = DB::table('findings')
            ->leftJoin('managed_tenants', 'findings.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'findings.*',
                'managed_tenants.customer_name',
            ])
            ->where('findings.id', $id)
            ->first();

        if ($finding === null) {
            return ApiResponse::error('finding_not_found', 'Finding not found.', 404);
        }

        return ApiResponse::success(['finding' => (array) $finding]);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
            'action' => ['required', 'string', 'in:dismiss,acknowledge,reopen'],
        ]);

        $statusMap = [
            'dismiss' => 'dismissed',
            'acknowledge' => 'acknowledged',
            'reopen' => 'open',
        ];

        $newStatus = $statusMap[$validated['action']];
        $updateData = [
            'status' => $newStatus,
            'updated_at' => now(),
        ];

        if ($validated['action'] === 'dismiss' || $validated['action'] === 'acknowledge') {
            $updateData['resolved_at'] = now();
        } elseif ($validated['action'] === 'reopen') {
            $updateData['resolved_at'] = null;
        }

        $affected = DB::table('findings')
            ->whereIn('id', $validated['ids'])
            ->update($updateData);

        DB::table('audit_logs')->insert([
            'event_type' => 'findings.bulk_' . $validated['action'],
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'finding_ids' => $validated['ids'],
                'action' => $validated['action'],
                'affected' => $affected,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success([
            'message' => "Successfully updated {$affected} findings.",
            'affected' => $affected,
        ]);
    }
}
