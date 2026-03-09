<?php

declare(strict_types=1);

namespace App\Modules\Scoring\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class CalculateTenantScoreJob implements ShouldQueue
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
        $setting = DB::table('settings')->where('key', 'scoring.weights')->value('value');
        $weights = $setting ? json_decode($setting, true) : config('codeblue365.score_weights');

        $identity = $this->calculateIdentityCurrency();
        $device = $this->calculateDeviceCurrency();
        $app = $this->calculateAppCurrency();
        $security = $this->calculateSecurityPosture();
        $governance = $this->calculateGovernanceReadiness();
        $integration = $this->calculateIntegrationReadiness();

        $total = ($identity * $weights['identity_currency'])
            + ($device * $weights['device_currency'])
            + ($app * $weights['app_currency'])
            + ($security * $weights['security_posture'])
            + ($governance * $weights['governance_readiness'])
            + ($integration * $weights['integration_readiness']);

        DB::table('scores')->insert([
            'tenant_id' => $this->tenantId,
            'identity_currency' => $identity,
            'device_currency' => $device,
            'app_currency' => $app,
            'security_posture' => $security,
            'governance_readiness' => $governance,
            'integration_readiness' => $integration,
            'composite_score' => round($total, 2),
            'calculated_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function calculateIdentityCurrency(): float
    {
        $syncRun = DB::table('sync_runs')
            ->where('tenant_id', $this->tenantId)
            ->where('sync_job', 'SyncTenantUsersJob')
            ->where('status', 'completed')
            ->orderByDesc('finished_at')
            ->first();

        if ($syncRun === null) {
            return 0.0;
        }

        $recency = min(100, max(0, 100 - (now()->diffInHours($syncRun->finished_at) * 2)));
        $volume = min(100, $syncRun->records_processed * 20);

        return round(($recency * 0.6) + ($volume * 0.4), 1);
    }

    private function calculateDeviceCurrency(): float
    {
        $syncRun = DB::table('sync_runs')
            ->where('tenant_id', $this->tenantId)
            ->where('sync_job', 'SyncTenantDevicesJob')
            ->where('status', 'completed')
            ->orderByDesc('finished_at')
            ->first();

        if ($syncRun === null) {
            return 0.0;
        }

        $recency = min(100, max(0, 100 - (now()->diffInHours($syncRun->finished_at) * 2)));
        $volume = min(100, $syncRun->records_processed * 25);

        return round(($recency * 0.5) + ($volume * 0.5), 1);
    }

    private function calculateAppCurrency(): float
    {
        $syncRun = DB::table('sync_runs')
            ->where('tenant_id', $this->tenantId)
            ->where('sync_job', 'SyncTenantLicensingJob')
            ->where('status', 'completed')
            ->orderByDesc('finished_at')
            ->first();

        return $syncRun !== null
            ? min(100.0, round($syncRun->records_processed * 30, 1))
            : 0.0;
    }

    private function calculateSecurityPosture(): float
    {
        $tenant = DB::table('managed_tenants')->where('tenant_id', $this->tenantId)->first();

        $gdapScore = 20;
        if ($tenant !== null) {
            $activeGdap = DB::table('gdap_relationships')
                ->where('managed_tenant_id', $tenant->id)
                ->where('status', 'active')
                ->count();
            $gdapScore = $activeGdap > 0 ? 80 : 20;
        }

        $healthRun = DB::table('sync_runs')
            ->where('tenant_id', $this->tenantId)
            ->where('sync_job', 'SyncTenantHealthJob')
            ->where('status', 'completed')
            ->exists();

        $healthScore = $healthRun ? 70 : 30;

        // Factor in Microsoft Secure Score when available (50% weight)
        $latestSecureScore = DB::table('secure_scores')
            ->where('tenant_id', $this->tenantId)
            ->orderByDesc('fetched_at')
            ->first();

        if ($latestSecureScore !== null && $latestSecureScore->max_score > 0) {
            $msSecureScoreNormalized = ($latestSecureScore->current_score / $latestSecureScore->max_score) * 100;

            return round(
                ($gdapScore * 0.3) + ($healthScore * 0.2) + ($msSecureScoreNormalized * 0.5),
                1
            );
        }

        return round(($gdapScore * 0.6) + ($healthScore * 0.4), 1);
    }

    private function calculateGovernanceReadiness(): float
    {
        $tenant = DB::table('managed_tenants')->where('tenant_id', $this->tenantId)->first();

        if ($tenant === null) {
            return 0.0;
        }

        $score = 0;

        if (!empty($tenant->assigned_engineer)) {
            $score += 30;
        }

        if (($tenant->gdap_status ?? '') === 'active') {
            $score += 40;
        } elseif (($tenant->gdap_status ?? '') === 'pending') {
            $score += 20;
        }

        $hasDomains = DB::table('tenant_domains')->where('managed_tenant_id', $tenant->id)->exists();
        if ($hasDomains) {
            $score += 30;
        }

        return min(100.0, (float) $score);
    }

    private function calculateIntegrationReadiness(): float
    {
        $tenant = DB::table('managed_tenants')->where('tenant_id', $this->tenantId)->first();

        if ($tenant === null) {
            return 0.0;
        }

        $totalIntegrations = DB::table('integrations')->count();

        if ($totalIntegrations === 0) {
            return 0.0;
        }

        $activeIntegrations = DB::table('tenant_integrations')
            ->where('managed_tenant_id', $tenant->id)
            ->where('status', 'healthy')
            ->count();

        return round(($activeIntegrations / $totalIntegrations) * 100, 1);
    }
}
