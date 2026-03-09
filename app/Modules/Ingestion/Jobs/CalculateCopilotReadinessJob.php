<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class CalculateCopilotReadinessJob implements ShouldQueue
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
        // Copilot usage metrics
        $totalLicensed = DB::table('copilot_usage')
            ->where('tenant_id', $this->tenantId)
            ->where('copilot_license_assigned', true)
            ->count();

        $totalActive = DB::table('copilot_usage')
            ->where('tenant_id', $this->tenantId)
            ->where('copilot_license_assigned', true)
            ->where('last_activity_date', '>=', now()->subDays(30)->toDateString())
            ->count();

        // SharePoint site metrics
        $totalSites = DB::table('sharepoint_sites')
            ->where('tenant_id', $this->tenantId)
            ->count();

        $publicSites = DB::table('sharepoint_sites')
            ->where('tenant_id', $this->tenantId)
            ->where('is_public', true)
            ->count();

        $sitesWithEveryone = DB::table('sharepoint_sites')
            ->where('tenant_id', $this->tenantId)
            ->where('external_sharing', 'anyone')
            ->count();

        $sitesWithExternalSharing = DB::table('sharepoint_sites')
            ->where('tenant_id', $this->tenantId)
            ->whereIn('external_sharing', ['anyone', 'org', 'existing'])
            ->count();

        $sitesWithGuestAccess = DB::table('sharepoint_sites')
            ->where('tenant_id', $this->tenantId)
            ->where('has_guest_access', true)
            ->count();

        $sitesWithOwners = DB::table('sharepoint_sites')
            ->where('tenant_id', $this->tenantId)
            ->whereNotNull('owner_email')
            ->count();

        $inactiveSites = DB::table('sharepoint_sites')
            ->where('tenant_id', $this->tenantId)
            ->where(function ($q): void {
                $q->where('last_activity_date', '<', now()->subDays(90)->toDateString())
                  ->orWhereNull('last_activity_date');
            })
            ->count();

        $sitesWithSensitivityLabels = DB::table('sharepoint_sites')
            ->where('tenant_id', $this->tenantId)
            ->whereNotNull('sensitivity_label')
            ->count();

        // Calculate percentage-based inputs
        $publicSitesPct = $totalSites > 0 ? ($publicSites / $totalSites) * 100 : 0;
        $everyoneAccessPct = $totalSites > 0 ? ($sitesWithEveryone / $totalSites) * 100 : 0;
        $externalSharingPct = $totalSites > 0 ? ($sitesWithExternalSharing / $totalSites) * 100 : 0;
        $sitesWithOwnersPct = $totalSites > 0 ? ($sitesWithOwners / $totalSites) * 100 : 100;
        $inactiveSitesPct = $totalSites > 0 ? ($inactiveSites / $totalSites) * 100 : 0;
        $guestAccessPct = $totalSites > 0 ? ($sitesWithGuestAccess / $totalSites) * 100 : 0;
        $sensitivityLabelsPct = $totalSites > 0 ? ($sitesWithSensitivityLabels / $totalSites) * 100 : 0;
        $copilotAssignmentPct = $totalLicensed > 0 ? min(100, ($totalActive / $totalLicensed) * 100) : 0;

        // Weighted score calculations
        $dataExposureScore = max(0, min(100,
            100 - ($publicSitesPct * 0.30 + $everyoneAccessPct * 0.40 + $externalSharingPct * 0.30)
        ));

        $accessGovernanceScore = max(0, min(100,
            $sitesWithOwnersPct * 0.40 + (100 - $inactiveSitesPct) * 0.30 + (100 - $guestAccessPct) * 0.30
        ));

        $dataProtectionScore = max(0, min(100,
            $sensitivityLabelsPct * 0.70 + 30 // 30 = DLP placeholder
        ));

        $aiGovernanceScore = max(0, min(100,
            $copilotAssignmentPct * 0.60 + 40 // 40 = agent policy placeholder
        ));

        $overallScore = round(
            $dataExposureScore * 0.40
            + $accessGovernanceScore * 0.25
            + $dataProtectionScore * 0.25
            + $aiGovernanceScore * 0.10,
            2
        );

        DB::table('copilot_readiness')->insert([
            'tenant_id' => $this->tenantId,
            'overall_score' => round($overallScore, 2),
            'data_exposure_score' => round($dataExposureScore, 2),
            'access_governance_score' => round($accessGovernanceScore, 2),
            'data_protection_score' => round($dataProtectionScore, 2),
            'ai_governance_score' => round($aiGovernanceScore, 2),
            'copilot_licensed_users' => $totalLicensed,
            'copilot_active_users' => $totalActive,
            'sites_with_everyone_access' => $sitesWithEveryone,
            'sites_with_external_sharing' => $sitesWithExternalSharing,
            'sites_with_guest_access' => $sitesWithGuestAccess,
            'public_sites_count' => $publicSites,
            'sensitivity_labels_count' => $sitesWithSensitivityLabels,
            'sensitivity_labels_applied_pct' => round($sensitivityLabelsPct, 2),
            'calculated_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('sync_runs')->insert([
            'tenant_id' => $this->tenantId,
            'sync_job' => 'CalculateCopilotReadinessJob',
            'status' => 'completed',
            'records_processed' => 1,
            'started_at' => now(),
            'finished_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
