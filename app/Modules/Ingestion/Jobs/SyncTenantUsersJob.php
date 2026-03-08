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

class SyncTenantUsersJob implements ShouldQueue
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
        $users = $graphClient->fetchUsers($this->tenantId);

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantUsersJob',
            'status' => 'completed',
            'records_processed' => count($users),
            'started_at' => now(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('managed_tenants')
            ->where('tenant_id', $this->tenantId)
            ->update([
                'last_sync_at' => now(),
                'updated_at' => now(),
            ]);
    }
}
