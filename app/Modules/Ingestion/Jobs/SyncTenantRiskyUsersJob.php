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

class SyncTenantRiskyUsersJob implements ShouldQueue
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
        $riskyUsers = $graphClient->fetchRiskyUsers($this->tenantId);

        foreach ($riskyUsers as $user) {
            DB::table('risky_users')->updateOrInsert(
                [
                    'tenant_id' => $this->tenantId,
                    'user_id' => $user['id'],
                ],
                [
                    'user_principal_name' => $user['userPrincipalName'] ?? null,
                    'display_name' => $user['displayName'] ?? null,
                    'risk_level' => $user['riskLevel'] ?? 'none',
                    'risk_state' => $user['riskState'] ?? 'none',
                    'risk_detail' => $user['riskDetail'] ?? null,
                    'risk_last_updated_at' => $user['riskLastUpdatedDateTime'] ?? null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantRiskyUsersJob',
            'status' => 'completed',
            'records_processed' => count($riskyUsers),
            'started_at' => now(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
