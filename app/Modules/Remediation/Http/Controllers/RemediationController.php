<?php

declare(strict_types=1);

namespace App\Modules\Remediation\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class RemediationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('remediation_actions')
            ->leftJoin('managed_tenants', 'remediation_actions.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'remediation_actions.id',
                'remediation_actions.tenant_id',
                'managed_tenants.customer_name',
                'remediation_actions.title',
                'remediation_actions.action_type',
                'remediation_actions.status',
                'remediation_actions.description as finding_title',
                'remediation_actions.initiated_by',
                'remediation_actions.completed_at',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('remediation_actions.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('remediation_actions.status', (string) $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('remediation_actions.title', 'like', "%{$search}%")
                  ->orWhere('remediation_actions.description', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $actions = $query
            ->orderByRaw("CASE remediation_actions.status WHEN 'pending' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'completed' THEN 3 WHEN 'failed' THEN 4 ELSE 5 END")
            ->orderByDesc('remediation_actions.created_at')
            ->paginate((int) $request->integer('per_page', 25));

        // Summary stats
        $statsQuery = DB::table('remediation_actions');
        if ($request->filled('tenant_id')) {
            $statsQuery->where('tenant_id', (string) $request->string('tenant_id'));
        }

        $totalActions = (clone $statsQuery)->count();
        $pendingCount = (clone $statsQuery)->where('status', 'pending')->count();
        $inProgressCount = (clone $statsQuery)->where('status', 'in_progress')->count();
        $completedCount = (clone $statsQuery)->where('status', 'completed')->count();
        $failedCount = (clone $statsQuery)->where('status', 'failed')->count();

        return ApiResponse::success([
            'summary' => [
                'total_actions' => $totalActions,
                'pending' => $pendingCount,
                'in_progress' => $inProgressCount,
                'completed' => $completedCount,
                'failed' => $failedCount,
            ],
            'actions' => $actions->items(),
            'pagination' => [
                'total' => $actions->total(),
                'per_page' => $actions->perPage(),
                'current_page' => $actions->currentPage(),
                'last_page' => $actions->lastPage(),
            ],
        ]);
    }

    public function execute(Request $request, int $id): JsonResponse
    {
        $action = DB::table('remediation_actions')->where('id', $id)->first();

        if ($action === null) {
            return ApiResponse::error('action_not_found', 'Remediation action not found.', 404);
        }

        if ($action->status !== 'pending') {
            return ApiResponse::error(
                'invalid_status',
                'Only pending actions can be executed. Current status: ' . $action->status,
                422
            );
        }

        $now = now();

        DB::table('remediation_actions')->where('id', $id)->update([
            'status' => 'in_progress',
            'initiated_by' => $request->user()?->email,
            'updated_at' => $now,
        ]);

        DB::table('audit_logs')->insert([
            'event_type' => 'remediation.action_executed',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'action_id' => $id,
                'tenant_id' => $action->tenant_id,
                'title' => $action->title,
            ], JSON_THROW_ON_ERROR),
            'created_at' => $now,
        ]);

        return ApiResponse::success(['message' => 'Remediation action marked as in-progress.']);
    }

    public function complete(Request $request, int $id): JsonResponse
    {
        $action = DB::table('remediation_actions')->where('id', $id)->first();

        if ($action === null) {
            return ApiResponse::error('action_not_found', 'Remediation action not found.', 404);
        }

        if ($action->status !== 'in_progress') {
            return ApiResponse::error(
                'invalid_status',
                'Only in-progress actions can be completed. Current status: ' . $action->status,
                422
            );
        }

        $validated = $request->validate([
            'result_json' => ['sometimes', 'array'],
            'notes' => ['sometimes', 'string'],
        ]);

        $now = now();

        $updateData = [
            'status' => 'completed',
            'completed_at' => $now,
            'updated_at' => $now,
        ];

        DB::table('remediation_actions')->where('id', $id)->update($updateData);

        DB::table('audit_logs')->insert([
            'event_type' => 'remediation.action_completed',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'action_id' => $id,
                'tenant_id' => $action->tenant_id,
                'title' => $action->title,
            ], JSON_THROW_ON_ERROR),
            'created_at' => $now,
        ]);

        return ApiResponse::success(['message' => 'Remediation action completed.']);
    }
}
