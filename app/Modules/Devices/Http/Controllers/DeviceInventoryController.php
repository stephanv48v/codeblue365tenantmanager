<?php

declare(strict_types=1);

namespace App\Modules\Devices\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class DeviceInventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DB::table('devices')
            ->leftJoin('managed_tenants', 'devices.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'devices.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('devices.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('compliance_status')) {
            $query->where('devices.compliance_state', (string) $request->string('compliance_status'));
        }

        if ($request->filled('os')) {
            $query->where('devices.os', (string) $request->string('os'));
        }

        if ($request->filled('managed')) {
            $managed = (string) $request->string('managed');
            if ($managed === 'managed') {
                $query->whereNotNull('devices.managed_by');
            } elseif ($managed === 'unmanaged') {
                $query->whereNull('devices.managed_by');
            }
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('devices.display_name', 'like', "%{$search}%")
                  ->orWhere('devices.os', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $devices = $query->orderBy('devices.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $devices->items(),
            'pagination' => [
                'total' => $devices->total(),
                'per_page' => $devices->perPage(),
                'current_page' => $devices->currentPage(),
                'last_page' => $devices->lastPage(),
            ],
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $device = DB::table('devices')
            ->leftJoin('managed_tenants', 'devices.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'devices.*',
                'managed_tenants.customer_name',
            ])
            ->where('devices.id', $id)
            ->first();

        if ($device === null) {
            return ApiResponse::error('device_not_found', 'Device not found.', 404);
        }

        return ApiResponse::success(['device' => (array) $device]);
    }
}
