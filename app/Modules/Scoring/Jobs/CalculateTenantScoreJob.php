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
        $weights = config('codeblue365.score_weights');

        $identity = 80;
        $device = 75;
        $app = 70;
        $security = 65;
        $governance = 85;
        $integration = 60;

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
}
