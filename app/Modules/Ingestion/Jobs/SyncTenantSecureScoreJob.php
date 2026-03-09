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

class SyncTenantSecureScoreJob implements ShouldQueue
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
        $history = $graphClient->fetchSecureScoreHistory($this->tenantId);

        $inserted = 0;
        foreach ($history as $entry) {
            $fetchedAt = $entry['createdDateTime'] ?? now()->toIso8601String();

            $exists = DB::table('secure_scores')
                ->where('tenant_id', $this->tenantId)
                ->where('fetched_at', $fetchedAt)
                ->exists();

            if (!$exists) {
                DB::table('secure_scores')->insert([
                    'tenant_id' => $this->tenantId,
                    'current_score' => $entry['currentScore'] ?? 0,
                    'max_score' => $entry['maxScore'] ?? 100,
                    'category_scores' => json_encode($entry['controlScores'] ?? [], JSON_THROW_ON_ERROR),
                    'fetched_at' => $fetchedAt,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $inserted++;
            }
        }

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantSecureScoreJob',
            'status' => 'completed',
            'records_processed' => $inserted,
            'started_at' => now(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
