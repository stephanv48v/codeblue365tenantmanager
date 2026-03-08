<?php

declare(strict_types=1);

namespace App\Modules\Findings\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class GenerateFindingsJob implements ShouldQueue
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
        $latestScore = DB::table('scores')
            ->where('tenant_id', $this->tenantId)
            ->orderByDesc('calculated_at')
            ->first();

        if ($latestScore === null) {
            return;
        }

        $ruleKey = 'integration_readiness_below_70';

        if ($latestScore->integration_readiness >= 70) {
            DB::table('findings')
                ->where('tenant_id', $this->tenantId)
                ->where('rule_key', $ruleKey)
                ->where('status', 'open')
                ->update([
                    'status' => 'resolved',
                    'resolved_at' => now(),
                    'updated_at' => now(),
                ]);

            return;
        }

        $existing = DB::table('findings')
            ->where('tenant_id', $this->tenantId)
            ->where('rule_key', $ruleKey)
            ->where('status', 'open')
            ->first();

        if ($existing !== null) {
            DB::table('findings')
                ->where('id', $existing->id)
                ->update([
                    'last_detected_at' => now(),
                    'evidence' => json_encode(['integration_readiness' => $latestScore->integration_readiness], JSON_THROW_ON_ERROR),
                    'updated_at' => now(),
                ]);

            return;
        }

        DB::table('findings')->insert([
            'tenant_id' => $this->tenantId,
            'rule_key' => $ruleKey,
            'status' => 'open',
            'category' => 'integration_readiness',
            'severity' => 'medium',
            'description' => 'Integration readiness is below recommended threshold.',
            'evidence' => json_encode(['integration_readiness' => $latestScore->integration_readiness], JSON_THROW_ON_ERROR),
            'impact' => 'Limited integration telemetry and reduced operational visibility.',
            'recommended_remediation' => 'Complete Integration Playbook for Graph and Secure Score connectors.',
            'first_detected_at' => now(),
            'last_detected_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
