<?php

declare(strict_types=1);

namespace App\Modules\Settings\Http\Controllers;

use App\Modules\Ingestion\Application\Contracts\GraphClient;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TenantDiscoveryController
{
    public function discover(GraphClient $graphClient): JsonResponse
    {
        $status = json_decode(
            DB::table('settings')->where('key', 'partner_tenant.connection_status')->value('value') ?? '"not_connected"',
            true
        );

        if ($status !== 'connected') {
            return ApiResponse::error('not_connected', 'Partner tenant must be connected before discovery.', 422);
        }

        $now = now();

        try {
            $tenants = $graphClient->fetchDelegatedTenants();

            // Mark already-imported tenants
            $existingIds = DB::table('managed_tenants')->pluck('tenant_id')->toArray();
            $results = array_map(fn ($t) => array_merge($t, [
                'already_imported' => in_array($t['tenantId'], $existingIds, true),
            ]), $tenants);

            DB::table('settings')->where('key', 'discovery.last_results')
                ->update(['value' => json_encode($results), 'updated_at' => $now]);
            DB::table('settings')->where('key', 'discovery.last_run_at')
                ->update(['value' => json_encode($now->toIso8601String()), 'updated_at' => $now]);

            return ApiResponse::success([
                'tenants' => $results,
                'discovered_at' => $now->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            return ApiResponse::error('discovery_failed', 'Tenant discovery failed: ' . $e->getMessage(), 500);
        }
    }

    public function import(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tenant_ids' => 'required|array|min:1',
            'tenant_ids.*' => 'required|string',
        ]);

        $lastResults = json_decode(
            DB::table('settings')->where('key', 'discovery.last_results')->value('value') ?? '[]',
            true
        );

        $discoveredMap = [];
        foreach ($lastResults as $tenant) {
            $discoveredMap[$tenant['tenantId']] = $tenant;
        }

        $imported = 0;
        $now = now();

        foreach ($data['tenant_ids'] as $tenantId) {
            if (! isset($discoveredMap[$tenantId])) {
                continue;
            }

            $tenant = $discoveredMap[$tenantId];

            // Skip if already exists
            if (DB::table('managed_tenants')->where('tenant_id', $tenantId)->exists()) {
                continue;
            }

            $managedTenantId = DB::table('managed_tenants')->insertGetId([
                'tenant_id' => $tenantId,
                'customer_name' => $tenant['displayName'],
                'primary_domain' => $tenant['defaultDomainName'],
                'gdap_status' => $tenant['gdapStatus'] ?? 'unknown',
                'gdap_expiry_at' => isset($tenant['gdapExpiry']) ? $tenant['gdapExpiry'] : null,
                'integration_status' => 'not_configured',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('gdap_relationships')->insert([
                'managed_tenant_id' => $managedTenantId,
                'status' => $tenant['gdapStatus'] ?? 'unknown',
                'starts_at' => $now,
                'expires_at' => isset($tenant['gdapExpiry']) ? $tenant['gdapExpiry'] : null,
                'role_assignments' => json_encode([]),
                'metadata' => json_encode(['source' => 'auto_discovery']),
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $imported++;
        }

        DB::table('audit_logs')->insert([
            'event_type' => 'tenants.auto_imported',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode(['imported_count' => $imported, 'tenant_ids' => $data['tenant_ids']]),
            'created_at' => $now,
        ]);

        return ApiResponse::success([
            'imported' => $imported,
            'message' => "{$imported} tenant(s) imported successfully.",
        ]);
    }
}
