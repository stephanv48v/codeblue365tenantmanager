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

class SyncTenantDevicesJob implements ShouldQueue
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
        $devices = $graphClient->fetchDevices($this->tenantId);

        foreach ($devices as $device) {
            DB::table('devices')->updateOrInsert(
                [
                    'tenant_id' => $this->tenantId,
                    'device_id' => $device['id'] ?? $device['device_id'] ?? '',
                ],
                [
                    'display_name' => $device['displayName'] ?? $device['display_name'] ?? null,
                    'os' => $device['operatingSystem'] ?? $device['os'] ?? null,
                    'os_version' => $device['operatingSystemVersion'] ?? $device['os_version'] ?? null,
                    'compliance_state' => $device['complianceState'] ?? $device['compliance_state'] ?? 'unknown',
                    'managed_by' => $device['managedBy'] ?? $device['managed_by'] ?? null,
                    'last_sync_at' => $device['lastSyncDateTime'] ?? $device['last_sync_at'] ?? null,
                    'enrolled_at' => $device['enrolledDateTime'] ?? $device['enrolled_at'] ?? null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantDevicesJob',
            'status' => 'completed',
            'records_processed' => count($devices),
            'started_at' => now(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
