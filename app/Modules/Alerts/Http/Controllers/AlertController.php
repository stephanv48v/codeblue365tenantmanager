<?php

declare(strict_types=1);

namespace App\Modules\Alerts\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class AlertController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('alerts')
            ->leftJoin('managed_tenants', 'alerts.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['alerts.*', 'managed_tenants.customer_name']);

        if ($request->filled('tenant_id')) {
            $query->where('alerts.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('alerts.status', (string) $request->string('status'));
        }

        if ($request->filled('severity')) {
            $query->where('alerts.severity', (string) $request->string('severity'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('alerts.title', 'like', "%{$search}%")
                  ->orWhere('alerts.message', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $alerts = $query->orderByDesc('alerts.created_at')
            ->paginate((int) $request->integer('per_page', 25));

        // Summary counts
        $summaryQuery = DB::table('alerts');
        if ($request->filled('tenant_id')) {
            $summaryQuery->where('tenant_id', (string) $request->string('tenant_id'));
        }
        $totalAlerts = (clone $summaryQuery)->count();
        $openAlerts = (clone $summaryQuery)->where('status', 'open')->count();
        $acknowledgedAlerts = (clone $summaryQuery)->where('status', 'acknowledged')->count();
        $dismissedAlerts = (clone $summaryQuery)->where('status', 'dismissed')->count();

        return ApiResponse::success([
            'items' => $alerts->items(),
            'pagination' => [
                'total' => $alerts->total(),
                'per_page' => $alerts->perPage(),
                'current_page' => $alerts->currentPage(),
                'last_page' => $alerts->lastPage(),
            ],
            'summary' => [
                'total' => $totalAlerts,
                'open' => $openAlerts,
                'acknowledged' => $acknowledgedAlerts,
                'dismissed' => $dismissedAlerts,
            ],
        ]);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer'],
            'action' => ['required', 'string', 'in:dismiss,acknowledge'],
        ]);

        $updateData = ['updated_at' => now()];

        if ($validated['action'] === 'dismiss') {
            $updateData['status'] = 'dismissed';
        } elseif ($validated['action'] === 'acknowledge') {
            $updateData['status'] = 'acknowledged';
            $updateData['acknowledged_by'] = $request->user()?->email;
            $updateData['acknowledged_at'] = now();
        }

        $affected = DB::table('alerts')
            ->whereIn('id', $validated['ids'])
            ->update($updateData);

        DB::table('audit_logs')->insert([
            'event_type' => 'alerts.bulk_' . $validated['action'],
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'alert_ids' => $validated['ids'],
                'action' => $validated['action'],
                'affected' => $affected,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success([
            'message' => "Successfully updated {$affected} alerts.",
            'affected' => $affected,
        ]);
    }

    public function acknowledge(Request $request, int $alertId): JsonResponse
    {
        $alert = DB::table('alerts')->where('id', $alertId)->first();

        if ($alert === null) {
            return ApiResponse::error('alert_not_found', 'Alert not found.', 404);
        }

        DB::table('alerts')->where('id', $alertId)->update([
            'status' => 'acknowledged',
            'acknowledged_by' => $request->user()?->email,
            'acknowledged_at' => now(),
            'updated_at' => now(),
        ]);

        return ApiResponse::success(['message' => 'Alert acknowledged.']);
    }

    public function dismiss(int $alertId): JsonResponse
    {
        $alert = DB::table('alerts')->where('id', $alertId)->first();

        if ($alert === null) {
            return ApiResponse::error('alert_not_found', 'Alert not found.', 404);
        }

        DB::table('alerts')->where('id', $alertId)->update([
            'status' => 'dismissed',
            'updated_at' => now(),
        ]);

        return ApiResponse::success(['message' => 'Alert dismissed.']);
    }
}
