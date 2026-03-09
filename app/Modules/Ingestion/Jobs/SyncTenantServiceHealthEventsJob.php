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

class SyncTenantServiceHealthEventsJob implements ShouldQueue
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
        $events = $graphClient->fetchServiceHealthEvents($this->tenantId);

        foreach ($events as $event) {
            DB::table('service_health_events')->updateOrInsert(
                [
                    'tenant_id' => $this->tenantId,
                    'event_id' => $event['id'],
                ],
                [
                    'service' => $event['service'] ?? '',
                    'title' => $event['title'] ?? '',
                    'classification' => $event['classification'] ?? 'advisory',
                    'status' => $event['status'] ?? 'investigating',
                    'start_at' => $event['startDateTime'] ?? null,
                    'end_at' => $event['endDateTime'] ?? null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantServiceHealthEventsJob',
            'status' => 'completed',
            'records_processed' => count($events),
            'started_at' => now(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
