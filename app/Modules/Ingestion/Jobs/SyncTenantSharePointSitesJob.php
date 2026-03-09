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

class SyncTenantSharePointSitesJob implements ShouldQueue
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
        $sites = $graphClient->fetchSharePointSites($this->tenantId);

        foreach ($sites as $site) {
            DB::table('sharepoint_sites')->updateOrInsert(
                [
                    'tenant_id' => $this->tenantId,
                    'site_id' => $site['siteId'] ?? $site['site_id'] ?? '',
                ],
                [
                    'site_url' => $site['siteUrl'] ?? $site['site_url'] ?? '',
                    'display_name' => $site['displayName'] ?? $site['display_name'] ?? null,
                    'storage_used_bytes' => $site['storageUsedBytes'] ?? $site['storage_used_bytes'] ?? 0,
                    'storage_allocated_bytes' => $site['storageAllocatedBytes'] ?? $site['storage_allocated_bytes'] ?? 0,
                    'file_count' => $site['fileCount'] ?? $site['file_count'] ?? 0,
                    'active_file_count' => $site['activeFileCount'] ?? $site['active_file_count'] ?? 0,
                    'last_activity_date' => $site['lastActivityDate'] ?? $site['last_activity_date'] ?? null,
                    'page_view_count' => $site['pageViewCount'] ?? $site['page_view_count'] ?? 0,
                    'external_sharing' => $site['externalSharing'] ?? $site['external_sharing'] ?? 'disabled',
                    'is_public' => $site['isPublic'] ?? $site['is_public'] ?? false,
                    'owner_name' => $site['ownerName'] ?? $site['owner_name'] ?? null,
                    'owner_email' => $site['ownerEmail'] ?? $site['owner_email'] ?? null,
                    'sensitivity_label' => $site['sensitivityLabel'] ?? $site['sensitivity_label'] ?? null,
                    'site_template' => $site['siteTemplate'] ?? $site['site_template'] ?? null,
                    'has_guest_access' => $site['hasGuestAccess'] ?? $site['has_guest_access'] ?? false,
                    'permissioned_user_count' => $site['permissionedUserCount'] ?? $site['permissioned_user_count'] ?? 0,
                    'restricted_content_discovery' => $site['restrictedContentDiscovery'] ?? $site['restricted_content_discovery'] ?? false,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'SyncTenantSharePointSitesJob',
            'status' => 'completed',
            'records_processed' => count($sites),
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
