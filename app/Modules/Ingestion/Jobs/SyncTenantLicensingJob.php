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

class SyncTenantLicensingJob implements ShouldQueue
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
        $licenses = $graphClient->fetchLicenses($this->tenantId);

        foreach ($licenses as $license) {
            $total = $license['prepaidUnits']['enabled'] ?? $license['total'] ?? 0;
            $assigned = $license['consumedUnits'] ?? $license['assigned'] ?? 0;

            DB::table('licenses')->updateOrInsert(
                [
                    'tenant_id' => $this->tenantId,
                    'sku_id' => $license['skuId'] ?? $license['sku_id'] ?? '',
                ],
                [
                    'sku_name' => $license['skuPartNumber'] ?? $license['sku_name'] ?? null,
                    'total' => $total,
                    'assigned' => $assigned,
                    'available' => max(0, $total - $assigned),
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantLicensingJob',
            'status' => 'completed',
            'records_processed' => count($licenses),
            'started_at' => now(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
