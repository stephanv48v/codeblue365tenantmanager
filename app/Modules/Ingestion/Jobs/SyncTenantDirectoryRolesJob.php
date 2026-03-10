<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncTenantDirectoryRolesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(private readonly string $tenantId)
    {
    }

    public function handle(): void
    {
        Log::info("SyncTenantDirectoryRolesJob: syncing directory roles for tenant {$this->tenantId}");
        // TODO: Call Graph API GET /directoryRoles with expand members
        // Upsert to directory_role_assignments table
    }
}
