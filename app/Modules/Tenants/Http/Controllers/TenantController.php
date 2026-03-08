<?php

declare(strict_types=1);

namespace App\Modules\Tenants\Http\Controllers;

use App\Modules\Ingestion\Application\Services\TenantSyncPipelineService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class TenantController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tenants = DB::table('managed_tenants')
            ->select([
                'id',
                'tenant_id',
                'customer_name',
                'primary_domain',
                'gdap_status',
                'gdap_expiry_at',
                'integration_status',
                'last_sync_at',
                'assigned_engineer',
                'support_tier',
            ])
            ->orderBy('customer_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $tenants->items(),
            'pagination' => [
                'total' => $tenants->total(),
                'per_page' => $tenants->perPage(),
                'current_page' => $tenants->currentPage(),
                'last_page' => $tenants->lastPage(),
            ],
        ]);
    }

    public function show(string $tenantId): JsonResponse
    {
        $tenant = DB::table('managed_tenants')->where('tenant_id', $tenantId)->first();

        if ($tenant === null) {
            return ApiResponse::error('tenant_not_found', 'Tenant not found.', 404);
        }

        $domains = DB::table('tenant_domains')
            ->where('managed_tenant_id', $tenant->id)
            ->orderBy('domain')
            ->pluck('domain');

        return ApiResponse::success([
            'tenant' => $tenant,
            'domains' => $domains,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'string', 'max:128', 'unique:managed_tenants,tenant_id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'primary_domain' => ['required', 'string', 'max:255'],
            'support_tier' => ['nullable', 'string', 'max:64'],
            'assigned_engineer' => ['nullable', 'string', 'max:255'],
        ]);

        $id = DB::table('managed_tenants')->insertGetId([
            'tenant_id' => $validated['tenant_id'],
            'customer_name' => $validated['customer_name'],
            'primary_domain' => $validated['primary_domain'],
            'support_tier' => $validated['support_tier'] ?? null,
            'assigned_engineer' => $validated['assigned_engineer'] ?? null,
            'gdap_status' => 'unknown',
            'integration_status' => 'not_configured',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ApiResponse::success(['id' => $id], 201);
    }

    public function sync(string $tenantId, TenantSyncPipelineService $tenantSyncPipelineService): JsonResponse
    {
        $tenantSyncPipelineService->dispatch($tenantId);

        return ApiResponse::success([
            'message' => 'Tenant sync pipeline queued.',
            'tenant_id' => $tenantId,
        ], 202);
    }

    public function findings(Request $request): JsonResponse
    {
        $query = DB::table('findings')->orderByDesc('last_detected_at');

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', (string) $request->string('tenant_id'));
        }

        $findings = $query->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $findings->items(),
            'pagination' => [
                'total' => $findings->total(),
                'per_page' => $findings->perPage(),
                'current_page' => $findings->currentPage(),
                'last_page' => $findings->lastPage(),
            ],
        ]);
    }
}
