<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SyncTenantGuestUsersJob implements ShouldQueue
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
        Log::info("SyncTenantGuestUsersJob: syncing guest users for tenant {$this->tenantId}");
        // TODO: Call Graph API GET /users?$filter=userType eq 'Guest'
        // Upsert to guest_users table
    }
}
