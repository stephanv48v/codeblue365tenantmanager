<?php

declare(strict_types=1);

namespace App\Modules\Integrations\Application\Services;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class PlaybookValidationService
{
    public function validateForTenant(string $playbookSlug, string $tenantId): JsonResponse
    {
        $playbook = DB::table('integration_playbooks')->where('slug', $playbookSlug)->where('is_active', true)->first();

        if ($playbook === null) {
            return ApiResponse::error('playbook_not_found', 'Integration playbook not found.', 404);
        }

        $tenant = DB::table('managed_tenants')->where('tenant_id', $tenantId)->first();

        if ($tenant === null) {
            return ApiResponse::error('tenant_not_found', 'Tenant not found.', 404);
        }

        $steps = json_decode((string) ($playbook->steps ?? '[]'), true, 512, JSON_THROW_ON_ERROR);
        $checks = array_map(
            static fn (array $step): array => [
                'step' => $step['instruction'] ?? 'unknown',
                'validation' => $step['validation'] ?? null,
                'result' => 'pending',
            ],
            is_array($steps) ? $steps : []
        );

        $payload = [
            'playbook_slug' => $playbookSlug,
            'integration_slug' => $playbook->integration_slug,
            'checks' => $checks,
            'validated_at' => now()->toIso8601String(),
        ];

        $integrationId = DB::table('integrations')->where('slug', $playbook->integration_slug)->value('id');

        if ($integrationId !== null) {
            DB::table('tenant_integrations')->updateOrInsert(
                [
                    'managed_tenant_id' => $tenant->id,
                    'integration_id' => $integrationId,
                ],
                [
                    'status' => 'pending',
                    'last_validated_at' => now(),
                    'validation_payload' => json_encode($payload, JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('audit_logs')->insert([
            'event_type' => 'playbook.validation_run',
            'actor_identifier' => null,
            'payload' => json_encode(['tenant_id' => $tenantId, 'playbook_slug' => $playbookSlug], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success([
            'tenant_id' => $tenantId,
            'playbook_slug' => $playbookSlug,
            'integration_slug' => $playbook->integration_slug,
            'status' => 'pending',
            'checks' => $checks,
        ]);
    }
}
