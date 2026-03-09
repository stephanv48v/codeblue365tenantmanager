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

        $tenant = DB::table('managed_tenants')
            ->where('tenant_id', $this->tenantId)
            ->first();

        $rules = $this->buildRules($latestScore, $tenant);

        foreach ($rules as $rule) {
            $this->evaluateRule($rule);
        }
    }

    /** @return array<int, array<string, mixed>> */
    private function buildRules(object $score, ?object $tenant): array
    {
        $rules = [];

        // Integration readiness
        $rules[] = [
            'rule_key' => 'integration_readiness_below_70',
            'triggered' => $score->integration_readiness < 70,
            'category' => 'integration_readiness',
            'severity' => 'medium',
            'description' => 'Integration readiness is below recommended threshold.',
            'evidence' => ['integration_readiness' => $score->integration_readiness],
            'impact' => 'Limited integration telemetry and reduced operational visibility.',
            'remediation' => 'Complete Integration Playbook for Graph and Secure Score connectors.',
        ];

        // Identity currency
        $rules[] = [
            'rule_key' => 'identity_currency_below_50',
            'triggered' => $score->identity_currency < 50,
            'category' => 'identity_currency',
            'severity' => 'high',
            'description' => 'Identity data currency is critically low — user data may be stale.',
            'evidence' => ['identity_currency' => $score->identity_currency],
            'impact' => 'Stale identity data reduces accuracy of security posture assessments.',
            'remediation' => 'Trigger a manual sync or verify Graph API connectivity for user sync.',
        ];

        // Device currency
        $rules[] = [
            'rule_key' => 'device_currency_below_50',
            'triggered' => $score->device_currency < 50,
            'category' => 'device_currency',
            'severity' => 'medium',
            'description' => 'Device data currency is below threshold.',
            'evidence' => ['device_currency' => $score->device_currency],
            'impact' => 'Compliance reporting may not reflect current device posture.',
            'remediation' => 'Ensure Intune sync is active and device inventory pipeline is running.',
        ];

        // Security posture
        $rules[] = [
            'rule_key' => 'security_posture_below_60',
            'triggered' => $score->security_posture < 60,
            'category' => 'security_posture',
            'severity' => 'critical',
            'description' => 'Security posture score is below acceptable threshold.',
            'evidence' => ['security_posture' => $score->security_posture],
            'impact' => 'Tenant may be at elevated risk due to insufficient security controls.',
            'remediation' => 'Review GDAP relationships, ensure active access, and verify Secure Score connectors.',
        ];

        // Governance readiness
        $rules[] = [
            'rule_key' => 'governance_readiness_below_50',
            'triggered' => $score->governance_readiness < 50,
            'category' => 'governance_readiness',
            'severity' => 'medium',
            'description' => 'Governance readiness is incomplete.',
            'evidence' => ['governance_readiness' => $score->governance_readiness],
            'impact' => 'Tenant governance gaps may delay onboarding and compliance.',
            'remediation' => 'Assign an engineer, configure domains, and activate GDAP relationship.',
        ];

        // Composite score
        $rules[] = [
            'rule_key' => 'composite_score_below_50',
            'triggered' => $score->composite_score < 50,
            'category' => 'overall_health',
            'severity' => 'critical',
            'description' => 'Overall tenant health score is critically low.',
            'evidence' => ['composite_score' => $score->composite_score],
            'impact' => 'Tenant requires immediate attention across multiple categories.',
            'remediation' => 'Review all category scores and prioritize the lowest-scoring areas.',
        ];

        // --- MSP-focused rules ---

        // MFA coverage
        $totalUsers = DB::table('users_normalized')
            ->where('tenant_id', $this->tenantId)
            ->where('account_enabled', true)
            ->count();
        $mfaUsers = DB::table('users_normalized')
            ->where('tenant_id', $this->tenantId)
            ->where('account_enabled', true)
            ->where('mfa_registered', true)
            ->count();
        $mfaCoverage = $totalUsers > 0 ? ($mfaUsers / $totalUsers) * 100 : 100;

        $rules[] = [
            'rule_key' => 'mfa_coverage_below_90',
            'triggered' => $mfaCoverage < 90,
            'category' => 'identity',
            'severity' => 'high',
            'description' => 'MFA coverage is below 90% for enabled users.',
            'evidence' => ['mfa_coverage_percent' => round($mfaCoverage, 1), 'mfa_users' => $mfaUsers, 'total_users' => $totalUsers],
            'impact' => 'Accounts without MFA are vulnerable to credential-based attacks.',
            'remediation' => 'Enable MFA for all user accounts via Conditional Access policies or per-user MFA enforcement.',
        ];

        // Stale users (no sign-in 90+ days)
        $staleUsers = DB::table('users_normalized')
            ->where('tenant_id', $this->tenantId)
            ->where('account_enabled', true)
            ->where(function ($q) {
                $q->where('last_sign_in_at', '<', now()->subDays(90))
                  ->orWhereNull('last_sign_in_at');
            })
            ->count();

        $rules[] = [
            'rule_key' => 'stale_users_detected',
            'triggered' => $staleUsers > 0,
            'category' => 'identity',
            'severity' => 'medium',
            'description' => 'Enabled user accounts with no sign-in activity for 90+ days detected.',
            'evidence' => ['stale_user_count' => $staleUsers],
            'impact' => 'Stale accounts increase the attack surface and licensing waste.',
            'remediation' => 'Review and disable inactive accounts. Consider converting to shared mailboxes.',
        ];

        // Risky users active
        $riskyUsersCount = DB::table('risky_users')
            ->where('tenant_id', $this->tenantId)
            ->whereIn('risk_level', ['high', 'medium'])
            ->where('risk_state', 'atRisk')
            ->count();

        $rules[] = [
            'rule_key' => 'risky_users_active',
            'triggered' => $riskyUsersCount > 0,
            'category' => 'identity',
            'severity' => 'critical',
            'description' => 'Active risky users detected by Identity Protection.',
            'evidence' => ['risky_user_count' => $riskyUsersCount],
            'impact' => 'Compromised accounts may be actively exploited for lateral movement or data exfiltration.',
            'remediation' => 'Investigate flagged users immediately. Force password reset, revoke sessions, and review sign-in logs.',
        ];

        // License waste above 10%
        $totalLicenses = DB::table('licenses')
            ->where('tenant_id', $this->tenantId)
            ->sum('total_units');
        $assignedLicenses = DB::table('licenses')
            ->where('tenant_id', $this->tenantId)
            ->sum('assigned_units');
        $wastePercent = $totalLicenses > 0 ? (($totalLicenses - $assignedLicenses) / $totalLicenses) * 100 : 0;

        $rules[] = [
            'rule_key' => 'license_waste_above_10_percent',
            'triggered' => $wastePercent > 10,
            'category' => 'licensing',
            'severity' => 'medium',
            'description' => 'License utilization waste exceeds 10%.',
            'evidence' => ['waste_percent' => round($wastePercent, 1), 'total' => $totalLicenses, 'assigned' => $assignedLicenses],
            'impact' => 'Unused licenses represent direct cost waste for the customer.',
            'remediation' => 'Review unassigned licenses and reduce subscription quantities at next renewal.',
        ];

        // Device compliance below 90%
        $totalDevices = DB::table('devices')
            ->where('tenant_id', $this->tenantId)
            ->count();
        $compliantDevices = DB::table('devices')
            ->where('tenant_id', $this->tenantId)
            ->where('compliance_state', 'compliant')
            ->count();
        $complianceRate = $totalDevices > 0 ? ($compliantDevices / $totalDevices) * 100 : 100;

        $rules[] = [
            'rule_key' => 'device_compliance_below_90',
            'triggered' => $complianceRate < 90,
            'category' => 'devices',
            'severity' => 'high',
            'description' => 'Device compliance rate is below 90%.',
            'evidence' => ['compliance_rate' => round($complianceRate, 1), 'compliant' => $compliantDevices, 'total' => $totalDevices],
            'impact' => 'Non-compliant devices may lack encryption, antivirus, or OS updates.',
            'remediation' => 'Review non-compliant devices in Intune. Update compliance policies and remediate failing devices.',
        ];

        // Conditional Access gaps — no MFA policy
        $hasMfaPolicy = DB::table('conditional_access_policies')
            ->where('tenant_id', $this->tenantId)
            ->where('state', 'enabled')
            ->where('grant_controls', 'like', '%mfa%')
            ->exists();

        $rules[] = [
            'rule_key' => 'conditional_access_gaps',
            'triggered' => !$hasMfaPolicy,
            'category' => 'identity',
            'severity' => 'high',
            'description' => 'No enabled Conditional Access policy enforcing MFA detected.',
            'evidence' => ['has_mfa_policy' => $hasMfaPolicy],
            'impact' => 'Without CA-enforced MFA, users may bypass MFA requirements.',
            'remediation' => 'Create a Conditional Access policy requiring MFA for all users or at minimum for admin roles.',
        ];

        // Too many global admins
        $globalAdmins = DB::table('users_normalized')
            ->where('tenant_id', $this->tenantId)
            ->where('account_enabled', true)
            ->where('assigned_roles', 'like', '%Global Administrator%')
            ->count();

        $rules[] = [
            'rule_key' => 'global_admins_above_4',
            'triggered' => $globalAdmins > 4,
            'category' => 'identity',
            'severity' => 'medium',
            'description' => 'More than 4 Global Administrator accounts detected.',
            'evidence' => ['global_admin_count' => $globalAdmins],
            'impact' => 'Excessive global admins increase the blast radius of a compromised account.',
            'remediation' => 'Reduce Global Administrator assignments. Use least-privilege roles like User Administrator or Exchange Administrator.',
        ];

        // Secure Score below 50%
        $latestSecureScore = DB::table('secure_scores')
            ->where('tenant_id', $this->tenantId)
            ->orderByDesc('fetched_at')
            ->first();
        $secureScorePercent = ($latestSecureScore && $latestSecureScore->max_score > 0)
            ? ($latestSecureScore->current_score / $latestSecureScore->max_score) * 100
            : 100;

        $rules[] = [
            'rule_key' => 'secure_score_below_50_percent',
            'triggered' => $secureScorePercent < 50,
            'category' => 'security',
            'severity' => 'high',
            'description' => 'Microsoft Secure Score is below 50%.',
            'evidence' => ['secure_score_percent' => round($secureScorePercent, 1), 'current' => $latestSecureScore->current_score ?? 0, 'max' => $latestSecureScore->max_score ?? 0],
            'impact' => 'Low Secure Score indicates significant security configuration gaps.',
            'remediation' => 'Review Microsoft Secure Score recommendations and implement high-impact improvement actions.',
        ];

        // GDAP expiring soon
        if ($tenant !== null) {
            $expiringGdap = DB::table('gdap_relationships')
                ->where('managed_tenant_id', $tenant->id)
                ->where('status', 'active')
                ->where('expires_at', '<=', now()->addDays(30))
                ->where('expires_at', '>', now())
                ->count();

            $rules[] = [
                'rule_key' => 'gdap_expiring_within_30_days',
                'triggered' => $expiringGdap > 0,
                'category' => 'governance_readiness',
                'severity' => 'high',
                'description' => 'GDAP relationship(s) expiring within 30 days.',
                'evidence' => ['expiring_count' => $expiringGdap],
                'impact' => 'Loss of delegated access will disrupt management capabilities.',
                'remediation' => 'Initiate GDAP renewal process before expiry.',
            ];

            // No sync in 7 days
            $lastSync = $tenant->last_sync_at ?? null;
            $staleSyncDays = $lastSync ? now()->diffInDays($lastSync) : 999;

            $rules[] = [
                'rule_key' => 'no_sync_in_7_days',
                'triggered' => $staleSyncDays >= 7,
                'category' => 'identity_currency',
                'severity' => 'high',
                'description' => 'No data sync has completed in over 7 days.',
                'evidence' => ['days_since_sync' => $staleSyncDays, 'last_sync_at' => $lastSync],
                'impact' => 'All tenant data is stale and scores are unreliable.',
                'remediation' => 'Investigate sync pipeline failures and trigger a manual sync.',
            ];
        }

        return $rules;
    }

    /** @param array<string, mixed> $rule */
    private function evaluateRule(array $rule): void
    {
        $ruleKey = $rule['rule_key'];

        if (!$rule['triggered']) {
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

        $evidence = json_encode($rule['evidence'], JSON_THROW_ON_ERROR);

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
                    'evidence' => $evidence,
                    'updated_at' => now(),
                ]);

            return;
        }

        $findingId = DB::table('findings')->insertGetId([
            'tenant_id' => $this->tenantId,
            'rule_key' => $ruleKey,
            'status' => 'open',
            'category' => $rule['category'],
            'severity' => $rule['severity'],
            'description' => $rule['description'],
            'evidence' => $evidence,
            'impact' => $rule['impact'],
            'recommended_remediation' => $rule['remediation'],
            'first_detected_at' => now(),
            'last_detected_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Auto-generate a recommendation for the new finding
        $priorityMap = ['critical' => 'critical', 'high' => 'high', 'medium' => 'medium', 'low' => 'low'];

        DB::table('recommendations')->insert([
            'tenant_id' => $this->tenantId,
            'finding_id' => $findingId,
            'priority' => $priorityMap[$rule['severity']] ?? 'medium',
            'title' => 'Remediate: ' . $rule['description'],
            'description' => $rule['remediation'],
            'status' => 'open',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
