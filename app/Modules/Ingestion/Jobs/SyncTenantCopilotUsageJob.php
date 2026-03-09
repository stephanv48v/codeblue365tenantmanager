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

class SyncTenantCopilotUsageJob implements ShouldQueue
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
        $usageRecords = $graphClient->fetchCopilotUsage($this->tenantId);

        foreach ($usageRecords as $record) {
            DB::table('copilot_usage')->updateOrInsert(
                [
                    'tenant_id' => $this->tenantId,
                    'user_principal_name' => $record['userPrincipalName'] ?? $record['user_principal_name'] ?? '',
                ],
                [
                    'display_name' => $record['displayName'] ?? $record['display_name'] ?? null,
                    'last_activity_date' => $record['lastActivityDate'] ?? $record['last_activity_date'] ?? null,
                    'last_activity_teams' => $record['lastActivityTeams'] ?? $record['last_activity_teams'] ?? null,
                    'last_activity_word' => $record['lastActivityWord'] ?? $record['last_activity_word'] ?? null,
                    'last_activity_excel' => $record['lastActivityExcel'] ?? $record['last_activity_excel'] ?? null,
                    'last_activity_powerpoint' => $record['lastActivityPowerPoint'] ?? $record['last_activity_powerpoint'] ?? null,
                    'last_activity_outlook' => $record['lastActivityOutlook'] ?? $record['last_activity_outlook'] ?? null,
                    'last_activity_onenote' => $record['lastActivityOneNote'] ?? $record['last_activity_onenote'] ?? null,
                    'last_activity_copilot_chat' => $record['lastActivityCopilotChat'] ?? $record['last_activity_copilot_chat'] ?? null,
                    'copilot_license_assigned' => $record['copilotLicenseAssigned'] ?? $record['copilot_license_assigned'] ?? false,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantCopilotUsageJob',
            'status' => 'completed',
            'records_processed' => count($usageRecords),
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
