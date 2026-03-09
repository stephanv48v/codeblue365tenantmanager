<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Application\Services;

use App\Modules\Findings\Jobs\GenerateFindingsJob;
use App\Modules\Ingestion\Jobs\CalculateCopilotReadinessJob;
use App\Modules\Ingestion\Jobs\SyncTenantConditionalAccessJob;
use App\Modules\Ingestion\Jobs\SyncTenantCopilotUsageJob;
use App\Modules\Ingestion\Jobs\SyncTenantDevicesJob;
use App\Modules\Ingestion\Jobs\SyncTenantHealthJob;
use App\Modules\Ingestion\Jobs\SyncTenantLicensingJob;
use App\Modules\Ingestion\Jobs\SyncTenantRiskyUsersJob;
use App\Modules\Ingestion\Jobs\SyncTenantSecureScoreJob;
use App\Modules\Ingestion\Jobs\SyncTenantServiceHealthEventsJob;
use App\Modules\Ingestion\Jobs\SyncTenantSharePointSitesJob;
use App\Modules\Ingestion\Jobs\SyncTenantUsersJob;
use App\Modules\Scoring\Jobs\CalculateTenantScoreJob;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\DB;

class TenantSyncPipelineService
{
    public function dispatch(string $tenantId): void
    {
        DB::table('audit_logs')->insert([
            'event_type' => 'sync.pipeline_queued',
            'actor_identifier' => null,
            'payload' => json_encode(['tenant_id' => $tenantId], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        Bus::chain([
            new SyncTenantUsersJob($tenantId),
            new SyncTenantDevicesJob($tenantId),
            new SyncTenantLicensingJob($tenantId),
            new SyncTenantHealthJob($tenantId),
            new SyncTenantRiskyUsersJob($tenantId),
            new SyncTenantConditionalAccessJob($tenantId),
            new SyncTenantSecureScoreJob($tenantId),
            new SyncTenantServiceHealthEventsJob($tenantId),
            new SyncTenantCopilotUsageJob($tenantId),
            new SyncTenantSharePointSitesJob($tenantId),
            new CalculateCopilotReadinessJob($tenantId),
            new CalculateTenantScoreJob($tenantId),
            new GenerateFindingsJob($tenantId),
        ])->dispatch();
    }
}
