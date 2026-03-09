<?php

declare(strict_types=1);

namespace App\Modules\Settings\Http\Controllers;

use App\Modules\Ingestion\Application\Contracts\GraphClient;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PartnerTenantController
{
    public function show(): JsonResponse
    {
        $settings = DB::table('settings')
            ->where('group', 'partner_tenant')
            ->pluck('value', 'key');

        return ApiResponse::success([
            'tenant_id' => json_decode($settings['partner_tenant.tenant_id'] ?? 'null', true),
            'display_name' => json_decode($settings['partner_tenant.display_name'] ?? 'null', true),
            'primary_domain' => json_decode($settings['partner_tenant.primary_domain'] ?? 'null', true),
            'client_id' => json_decode($settings['partner_tenant.client_id'] ?? 'null', true),
            'connection_status' => json_decode($settings['partner_tenant.connection_status'] ?? '"not_connected"', true),
            'last_verified_at' => json_decode($settings['partner_tenant.last_verified_at'] ?? 'null', true),
            'has_client_secret' => json_decode($settings['partner_tenant.client_secret'] ?? 'null', true) !== null,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'tenant_id' => 'required|string|max:255',
            'display_name' => 'required|string|max:255',
            'primary_domain' => 'required|string|max:255',
            'client_id' => 'required|string|max:255',
            'client_secret' => 'nullable|string|max:1024',
        ]);

        $now = now();
        $fields = [
            'partner_tenant.tenant_id' => $data['tenant_id'],
            'partner_tenant.display_name' => $data['display_name'],
            'partner_tenant.primary_domain' => $data['primary_domain'],
            'partner_tenant.client_id' => $data['client_id'],
        ];

        if (! empty($data['client_secret'])) {
            $fields['partner_tenant.client_secret'] = $data['client_secret'];
        }

        foreach ($fields as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => $key],
                ['value' => json_encode($value), 'group' => 'partner_tenant', 'updated_at' => $now]
            );
        }

        DB::table('settings')->updateOrInsert(
            ['key' => 'partner_tenant.connection_status'],
            ['value' => json_encode('pending'), 'group' => 'partner_tenant', 'updated_at' => $now]
        );

        DB::table('audit_logs')->insert([
            'event_type' => 'settings.partner_tenant.updated',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode(['tenant_id' => $data['tenant_id']]),
            'created_at' => $now,
        ]);

        return ApiResponse::success(['message' => 'Partner tenant saved.']);
    }

    public function test(GraphClient $graphClient): JsonResponse
    {
        $tenantId = json_decode(
            DB::table('settings')->where('key', 'partner_tenant.tenant_id')->value('value') ?? 'null',
            true
        );

        if (! $tenantId) {
            return ApiResponse::error('not_configured', 'Partner tenant not configured.', 422);
        }

        $now = now();

        try {
            $graphClient->fetchUsers($tenantId);

            DB::table('settings')->where('key', 'partner_tenant.connection_status')
                ->update(['value' => json_encode('connected'), 'updated_at' => $now]);
            DB::table('settings')->where('key', 'partner_tenant.last_verified_at')
                ->update(['value' => json_encode($now->toIso8601String()), 'updated_at' => $now]);

            return ApiResponse::success([
                'status' => 'connected',
                'last_verified_at' => $now->toIso8601String(),
            ]);
        } catch (\Throwable $e) {
            DB::table('settings')->where('key', 'partner_tenant.connection_status')
                ->update(['value' => json_encode('error'), 'updated_at' => $now]);

            return ApiResponse::error('connection_failed', 'Connection test failed: ' . $e->getMessage(), 422);
        }
    }
}
