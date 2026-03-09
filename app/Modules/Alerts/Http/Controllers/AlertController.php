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
        $query = DB::table('alerts')->orderByDesc('created_at');

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->string('status'));
        }

        $alerts = $query->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $alerts->items(),
            'pagination' => [
                'total' => $alerts->total(),
                'per_page' => $alerts->perPage(),
                'current_page' => $alerts->currentPage(),
                'last_page' => $alerts->lastPage(),
            ],
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
