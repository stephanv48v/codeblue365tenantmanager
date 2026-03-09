<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Jobs;

use App\Modules\Ingestion\Application\Contracts\GraphClient;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class SyncTenantConditionalAccessJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(private readonly string $tenantId)
    {
    }

    public function handle(GraphClient $graphClient): void
    {
        $policies = $graphClient->fetchConditionalAccessPolicies($this->tenantId);

        foreach ($policies as $policy) {
            DB::table('conditional_access_policies')->updateOrInsert(
                [
                    'tenant_id' => $this->tenantId,
                    'policy_id' => $policy['id'],
                ],
                [
                    'display_name' => $policy['displayName'] ?? '',
                    'state' => $policy['state'] ?? 'enabled',
                    'conditions' => json_encode($policy['conditions'] ?? [], JSON_THROW_ON_ERROR),
                    'grant_controls' => json_encode($policy['grantControls'] ?? [], JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantConditionalAccessJob',
            'status' => 'completed',
            'records_processed' => count($policies),
            'started_at' => now(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
