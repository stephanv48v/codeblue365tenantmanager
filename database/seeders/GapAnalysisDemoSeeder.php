<?php

declare(strict_types=1);

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class GapAnalysisDemoSeeder extends Seeder
{
    private array $tenantIds = [
        'a1b2c3d4-1111-4000-8000-000000000001',
        'a1b2c3d4-2222-4000-8000-000000000002',
        'a1b2c3d4-3333-4000-8000-000000000003',
        'a1b2c3d4-4444-4000-8000-000000000004',
        'a1b2c3d4-5555-4000-8000-000000000005',
        'a1b2c3d4-6666-4000-8000-000000000006',
        'a1b2c3d4-7777-4000-8000-000000000007',
        'a1b2c3d4-8888-4000-8000-000000000008',
    ];

    private array $tenantNames = [
        'Contoso Ltd', 'Northwind Traders', 'Adventure Works', 'Fabrikam Inc',
        'Woodgrove Bank', 'Litware Inc', 'Proseware Systems', 'Fourth Coffee',
    ];

    public function run(): void
    {
        $this->seedMailboxes();
        $this->seedMailFlowRules();
        $this->seedDistributionLists();
        $this->seedForwardingRules();
        $this->seedGroups();
        $this->seedAppRegistrations();
        $this->seedOAuthConsents();
        $this->seedTeamsActivity();
        $this->seedTeams();
        $this->seedDlpPolicies();
        $this->seedSensitivityLabels();
        $this->seedPowerApps();
        $this->seedPowerAutomateFlows();
        $this->seedConnectWise();
        $this->seedNotifications();
        $this->seedRemediationActions();
        $this->seedPasswordPolicies();
        $this->seedPimActivations();
        $this->seedSecureScoreActions();
        $this->seedDefenderAlerts();
        $this->seedSecurityDefaults();
        $this->seedCompliancePolicies();
        $this->seedAutopilotDevices();
        $this->seedLicenseCostAnalysis();
        $this->seedTenantBenchmarks();
    }

    private function seedMailboxes(): void
    {
        $now = now();
        $rows = [];
        $names = ['John Smith', 'Jane Doe', 'Alice Johnson', 'Bob Williams', 'Carol Davis',
                   'David Brown', 'Eva Martinez', 'Frank Wilson', 'Grace Lee', 'Henry Taylor'];
        $shared = ['info@', 'support@', 'sales@', 'reception@'];
        $rooms = ['Board Room', 'Meeting Room A', 'Training Room'];

        foreach ($this->tenantIds as $i => $tid) {
            $domain = strtolower(str_replace(' ', '', $this->tenantNames[$i])) . '.com';
            $count = rand(6, 10);
            for ($j = 0; $j < $count; $j++) {
                $name = $names[$j % count($names)];
                $rows[] = [
                    'tenant_id' => $tid,
                    'user_principal_name' => strtolower(str_replace(' ', '.', $name)) . '@' . $domain,
                    'display_name' => $name,
                    'mailbox_type' => 'user',
                    'storage_used_bytes' => rand(100_000_000, 50_000_000_000),
                    'storage_quota_bytes' => 53_687_091_200,
                    'items_count' => rand(500, 25000),
                    'has_archive' => rand(0, 1),
                    'litigation_hold_enabled' => $i === 4 ? 1 : 0,
                    'last_activity_date' => now()->subDays(rand(0, 30))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
            foreach (array_slice($shared, 0, rand(1, 3)) as $s) {
                $rows[] = [
                    'tenant_id' => $tid, 'user_principal_name' => $s . $domain,
                    'display_name' => ucfirst(str_replace('@', '', $s)) . ' Mailbox',
                    'mailbox_type' => 'shared', 'storage_used_bytes' => rand(10_000_000, 5_000_000_000),
                    'storage_quota_bytes' => 53_687_091_200, 'items_count' => rand(100, 5000),
                    'has_archive' => 0, 'litigation_hold_enabled' => 0,
                    'last_activity_date' => now()->subDays(rand(0, 14))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
            if ($i < 4) {
                $rows[] = [
                    'tenant_id' => $tid, 'user_principal_name' => 'boardroom@' . $domain,
                    'display_name' => $rooms[0], 'mailbox_type' => 'room',
                    'storage_used_bytes' => rand(1_000_000, 100_000_000),
                    'storage_quota_bytes' => 53_687_091_200, 'items_count' => rand(10, 500),
                    'has_archive' => 0, 'litigation_hold_enabled' => 0,
                    'last_activity_date' => now()->subDays(rand(0, 7))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('mailboxes')->insert($rows);
    }

    private function seedMailFlowRules(): void
    {
        $now = now();
        $rules = [
            ['rule_name' => 'Apply Disclaimer', 'state' => 'enabled', 'priority' => '1', 'description' => 'Add company disclaimer to external emails'],
            ['rule_name' => 'Encrypt External PII', 'state' => 'enabled', 'priority' => '2', 'description' => 'Apply OME to emails containing sensitive data sent externally'],
            ['rule_name' => 'Block Auto-Forward External', 'state' => 'enabled', 'priority' => '3', 'description' => 'Block automatic mail forwarding to external recipients'],
            ['rule_name' => 'Quarantine Phishing', 'state' => 'enabled', 'priority' => '4', 'description' => 'Quarantine messages flagged as phishing'],
            ['rule_name' => 'Legacy TLS Enforcement', 'state' => 'disabled', 'priority' => '5', 'description' => 'Enforce TLS for partner domains (deprecated)'],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(2, 4);
            for ($j = 0; $j < $count; $j++) {
                $r = $rules[$j];
                $rows[] = array_merge($r, ['tenant_id' => $tid, 'created_at' => $now, 'updated_at' => $now]);
            }
        }
        DB::table('mail_flow_rules')->insert($rows);
    }

    private function seedDistributionLists(): void
    {
        $now = now();
        $lists = [
            ['display_name' => 'All Company', 'group_type' => 'distribution', 'member_count' => 0, 'external_senders_allowed' => false],
            ['display_name' => 'Engineering Team', 'group_type' => 'distribution', 'member_count' => 0, 'external_senders_allowed' => false],
            ['display_name' => 'Marketing', 'group_type' => 'distribution', 'member_count' => 0, 'external_senders_allowed' => true],
            ['display_name' => 'IT Security', 'group_type' => 'mail-enabled-security', 'member_count' => 0, 'external_senders_allowed' => false],
            ['display_name' => 'Executive Team', 'group_type' => 'distribution', 'member_count' => 0, 'external_senders_allowed' => false],
        ];
        $rows = [];
        foreach ($this->tenantIds as $i => $tid) {
            $domain = strtolower(str_replace(' ', '', $this->tenantNames[$i])) . '.com';
            $count = rand(3, 5);
            for ($j = 0; $j < $count; $j++) {
                $l = $lists[$j];
                $rows[] = [
                    'tenant_id' => $tid,
                    'display_name' => $l['display_name'],
                    'email_address' => strtolower(str_replace(' ', '-', $l['display_name'])) . '@' . $domain,
                    'group_type' => $l['group_type'],
                    'member_count' => rand(5, 150),
                    'external_senders_allowed' => $l['external_senders_allowed'],
                    'hidden_from_gal' => false,
                    'managed_by' => 'IT Admin',
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('distribution_lists')->insert($rows);
    }

    private function seedForwardingRules(): void
    {
        $now = now();
        $rows = [];
        foreach ($this->tenantIds as $i => $tid) {
            $domain = strtolower(str_replace(' ', '', $this->tenantNames[$i])) . '.com';
            // Internal forwarding
            $rows[] = [
                'tenant_id' => $tid, 'user_principal_name' => 'reception@' . $domain,
                'display_name' => 'Reception', 'forwarding_type' => 'smtp',
                'forwarding_target' => 'admin@' . $domain, 'is_external' => false,
                'delivers_to_mailbox_and_forward' => true, 'status' => 'active',
                'created_at' => $now, 'updated_at' => $now,
            ];
            // External forwarding (security risk!) for some tenants
            if ($i < 4) {
                $rows[] = [
                    'tenant_id' => $tid, 'user_principal_name' => 'john.smith@' . $domain,
                    'display_name' => 'John Smith', 'forwarding_type' => 'inbox-rule',
                    'forwarding_target' => 'john.personal@gmail.com', 'is_external' => true,
                    'delivers_to_mailbox_and_forward' => true, 'status' => 'active',
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
            if ($i === 0 || $i === 3) {
                $rows[] = [
                    'tenant_id' => $tid, 'user_principal_name' => 'finance@' . $domain,
                    'display_name' => 'Finance Dept', 'forwarding_type' => 'transport-rule',
                    'forwarding_target' => 'external-auditor@auditfirm.com', 'is_external' => true,
                    'delivers_to_mailbox_and_forward' => false, 'status' => 'active',
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('forwarding_rules')->insert($rows);
    }

    private function seedGroups(): void
    {
        $now = now();
        $templates = [
            ['display_name' => 'All Employees', 'group_type' => 'microsoft365', 'mail_enabled' => true, 'security_enabled' => false, 'membership_type' => 'dynamic', 'visibility' => 'public'],
            ['display_name' => 'Engineering', 'group_type' => 'microsoft365', 'mail_enabled' => true, 'security_enabled' => false, 'membership_type' => 'assigned', 'visibility' => 'private'],
            ['display_name' => 'IT Admins', 'group_type' => 'security', 'mail_enabled' => false, 'security_enabled' => true, 'membership_type' => 'assigned', 'visibility' => 'private'],
            ['display_name' => 'VPN Users', 'group_type' => 'security', 'mail_enabled' => false, 'security_enabled' => true, 'membership_type' => 'dynamic', 'visibility' => 'hiddenmembership'],
            ['display_name' => 'Marketing Team', 'group_type' => 'microsoft365', 'mail_enabled' => true, 'security_enabled' => false, 'membership_type' => 'assigned', 'visibility' => 'public'],
            ['display_name' => 'Compliance Officers', 'group_type' => 'security', 'mail_enabled' => false, 'security_enabled' => true, 'membership_type' => 'assigned', 'visibility' => 'private'],
            ['display_name' => 'External Contractors', 'group_type' => 'microsoft365', 'mail_enabled' => true, 'security_enabled' => false, 'membership_type' => 'assigned', 'visibility' => 'private'],
            ['display_name' => 'Device Compliance', 'group_type' => 'dynamic-security', 'mail_enabled' => false, 'security_enabled' => true, 'membership_type' => 'dynamic', 'visibility' => 'private'],
            ['display_name' => 'Abandoned Project', 'group_type' => 'microsoft365', 'mail_enabled' => true, 'security_enabled' => false, 'membership_type' => 'assigned', 'visibility' => 'private'],
            ['display_name' => 'Finance', 'group_type' => 'microsoft365', 'mail_enabled' => true, 'security_enabled' => false, 'membership_type' => 'assigned', 'visibility' => 'private'],
        ];
        $rows = [];
        foreach ($this->tenantIds as $i => $tid) {
            $count = rand(6, 10);
            for ($j = 0; $j < $count; $j++) {
                $t = $templates[$j % count($templates)];
                $hasOwners = !($j === 8); // "Abandoned Project" has no owners
                $rows[] = [
                    'tenant_id' => $tid, 'group_id' => Str::uuid()->toString(),
                    'display_name' => $t['display_name'], 'group_type' => $t['group_type'],
                    'mail' => $t['mail_enabled'] ? strtolower(str_replace(' ', '-', $t['display_name'])) . '@tenant.com' : null,
                    'mail_enabled' => $t['mail_enabled'], 'security_enabled' => $t['security_enabled'],
                    'membership_type' => $t['membership_type'], 'membership_rule' => $t['membership_type'] === 'dynamic' ? '(user.department -eq "IT")' : null,
                    'member_count' => rand(3, 200), 'owner_count' => $hasOwners ? rand(1, 4) : 0,
                    'has_owners' => $hasOwners, 'visibility' => $t['visibility'],
                    'expiration_date' => rand(0, 1) ? now()->addDays(rand(30, 365))->toDateString() : null,
                    'last_activity_date' => $j === 8 ? now()->subDays(180)->toDateString() : now()->subDays(rand(0, 60))->toDateString(),
                    'created_date' => now()->subMonths(rand(1, 24))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('groups')->insert($rows);
    }

    private function seedAppRegistrations(): void
    {
        $now = now();
        $apps = [
            ['display_name' => 'ServiceNow ITSM', 'sign_in_audience' => 'AzureADMyOrg', 'credential_count' => 2, 'has_expired_credentials' => true, 'api_permissions_count' => 8, 'has_admin_consent' => true],
            ['display_name' => 'Salesforce SSO', 'sign_in_audience' => 'AzureADMyOrg', 'credential_count' => 1, 'has_expired_credentials' => false, 'api_permissions_count' => 3, 'has_admin_consent' => false],
            ['display_name' => 'Custom HR Portal', 'sign_in_audience' => 'AzureADMyOrg', 'credential_count' => 1, 'has_expired_credentials' => false, 'api_permissions_count' => 12, 'has_admin_consent' => true],
            ['display_name' => 'Backup Solution Agent', 'sign_in_audience' => 'AzureADMultipleOrgs', 'credential_count' => 3, 'has_expired_credentials' => true, 'api_permissions_count' => 15, 'has_admin_consent' => true],
            ['display_name' => 'Marketing Analytics', 'sign_in_audience' => 'AzureADMyOrg', 'credential_count' => 1, 'has_expired_credentials' => false, 'api_permissions_count' => 4, 'has_admin_consent' => false],
            ['display_name' => 'Legacy CRM Connector', 'sign_in_audience' => 'AzureADMyOrg', 'credential_count' => 2, 'has_expired_credentials' => true, 'api_permissions_count' => 20, 'has_admin_consent' => true],
            ['display_name' => 'DocuSign Integration', 'sign_in_audience' => 'AzureADMyOrg', 'credential_count' => 1, 'has_expired_credentials' => false, 'api_permissions_count' => 5, 'has_admin_consent' => false],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(4, 7);
            for ($j = 0; $j < $count; $j++) {
                $a = $apps[$j % count($apps)];
                $rows[] = [
                    'tenant_id' => $tid, 'app_id' => Str::uuid()->toString(),
                    'display_name' => $a['display_name'], 'app_type' => 'app-registration',
                    'sign_in_audience' => $a['sign_in_audience'], 'credential_count' => $a['credential_count'],
                    'nearest_credential_expiry' => $a['has_expired_credentials'] ? now()->subDays(rand(1, 90))->toDateString() : now()->addDays(rand(10, 365))->toDateString(),
                    'has_expired_credentials' => $a['has_expired_credentials'],
                    'api_permissions_count' => $a['api_permissions_count'],
                    'has_admin_consent' => $a['has_admin_consent'],
                    'publisher_domain' => 'tenant.com', 'is_first_party' => false,
                    'last_sign_in_date' => now()->subDays(rand(0, 90))->toDateString(),
                    'created_date' => now()->subMonths(rand(1, 36))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('app_registrations')->insert($rows);
    }

    private function seedOAuthConsents(): void
    {
        $now = now();
        $consents = [
            ['app_display_name' => 'Third-party Analytics', 'scopes' => 'User.Read Mail.Read Files.Read.All', 'risk_level' => 'high'],
            ['app_display_name' => 'Team Collaboration Tool', 'scopes' => 'User.Read.All Group.Read.All', 'risk_level' => 'medium'],
            ['app_display_name' => 'PDF Converter', 'scopes' => 'Files.ReadWrite.All Sites.ReadWrite.All', 'risk_level' => 'critical'],
            ['app_display_name' => 'Calendar Sync', 'scopes' => 'Calendars.Read', 'risk_level' => 'low'],
            ['app_display_name' => 'Project Tracker', 'scopes' => 'User.Read Tasks.ReadWrite', 'risk_level' => 'low'],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(3, 5);
            for ($j = 0; $j < $count; $j++) {
                $c = $consents[$j % count($consents)];
                $rows[] = [
                    'tenant_id' => $tid, 'app_id' => Str::uuid()->toString(),
                    'app_display_name' => $c['app_display_name'],
                    'principal_type' => 'allPrincipals', 'principal_name' => null,
                    'consent_type' => 'allPrincipals', 'scopes' => $c['scopes'],
                    'risk_level' => $c['risk_level'],
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('oauth_consent_grants')->insert($rows);
    }

    private function seedTeamsActivity(): void
    {
        $now = now();
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $rows[] = [
                'tenant_id' => $tid, 'report_period' => '30',
                'active_users' => rand(20, 500), 'active_channels' => rand(10, 200),
                'total_messages' => rand(2000, 50000), 'channel_messages' => rand(1000, 25000),
                'chat_messages' => rand(1000, 25000), 'meetings_organized' => rand(50, 2000),
                'meetings_attended' => rand(100, 5000), 'calls_count' => rand(30, 1000),
                'audio_duration_minutes' => rand(1000, 50000), 'video_duration_minutes' => rand(500, 20000),
                'screen_share_duration_minutes' => rand(200, 10000),
                'report_date' => now()->subDays(1)->toDateString(),
                'created_at' => $now, 'updated_at' => $now,
            ];
        }
        DB::table('teams_activity')->insert($rows);
    }

    private function seedTeams(): void
    {
        $now = now();
        $teamNames = ['General', 'Engineering', 'Marketing', 'Sales', 'HR', 'Finance',
                       'Product', 'Design', 'Support', 'Leadership'];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(5, 8);
            for ($j = 0; $j < $count; $j++) {
                $rows[] = [
                    'tenant_id' => $tid, 'team_id' => Str::uuid()->toString(),
                    'display_name' => $teamNames[$j % count($teamNames)],
                    'description' => $teamNames[$j % count($teamNames)] . ' team workspace',
                    'visibility' => rand(0, 1) ? 'private' : 'public',
                    'member_count' => rand(3, 100), 'channel_count' => rand(1, 15),
                    'guest_count' => rand(0, 5), 'is_archived' => ($j === $count - 1) ? true : false,
                    'last_activity_date' => now()->subDays(rand(0, 60))->toDateString(),
                    'created_date' => now()->subMonths(rand(1, 24))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('teams')->insert($rows);
    }

    private function seedDlpPolicies(): void
    {
        $now = now();
        $policies = [
            ['policy_name' => 'PII Protection - US', 'status' => 'enabled', 'mode' => 'enforce', 'rule_count' => 5, 'matches_last_30d' => 0],
            ['policy_name' => 'Financial Data Protection', 'status' => 'enabled', 'mode' => 'enforce', 'rule_count' => 3, 'matches_last_30d' => 0],
            ['policy_name' => 'GDPR Compliance', 'status' => 'enabled', 'mode' => 'test', 'rule_count' => 8, 'matches_last_30d' => 0],
            ['policy_name' => 'Credit Card Detection', 'status' => 'disabled', 'mode' => 'enforce', 'rule_count' => 2, 'matches_last_30d' => 0],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(2, 4);
            for ($j = 0; $j < $count; $j++) {
                $p = $policies[$j];
                $rows[] = [
                    'tenant_id' => $tid, 'policy_name' => $p['policy_name'],
                    'status' => $p['status'], 'mode' => $p['mode'],
                    'locations_json' => json_encode(['exchange', 'sharepoint', 'onedrive', 'teams']),
                    'rule_count' => $p['rule_count'],
                    'matches_last_30d' => rand(0, 150), 'overrides_last_30d' => rand(0, 20),
                    'false_positives_last_30d' => rand(0, 10), 'priority' => 'medium',
                    'created_date' => now()->subMonths(rand(1, 12))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('dlp_policies')->insert($rows);
    }

    private function seedSensitivityLabels(): void
    {
        $now = now();
        $labels = [
            ['label_name' => 'Public', 'auto_labeling_enabled' => false, 'encryption_enabled' => false, 'content_marking_enabled' => false],
            ['label_name' => 'Internal', 'auto_labeling_enabled' => false, 'encryption_enabled' => false, 'content_marking_enabled' => true],
            ['label_name' => 'Confidential', 'auto_labeling_enabled' => true, 'encryption_enabled' => true, 'content_marking_enabled' => true],
            ['label_name' => 'Highly Confidential', 'auto_labeling_enabled' => true, 'encryption_enabled' => true, 'content_marking_enabled' => true],
            ['label_name' => 'Restricted - External', 'auto_labeling_enabled' => false, 'encryption_enabled' => true, 'content_marking_enabled' => true],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            foreach ($labels as $k => $l) {
                $rows[] = [
                    'tenant_id' => $tid, 'label_id' => Str::uuid()->toString(),
                    'label_name' => $l['label_name'], 'parent_label' => null,
                    'priority' => (string) $k, 'is_active' => true,
                    'auto_labeling_enabled' => $l['auto_labeling_enabled'],
                    'encryption_enabled' => $l['encryption_enabled'],
                    'content_marking_enabled' => $l['content_marking_enabled'],
                    'files_labeled_count' => rand(50, 5000),
                    'emails_labeled_count' => rand(20, 3000),
                    'sites_labeled_count' => rand(0, 50), 'scope' => 'all',
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('sensitivity_labels')->insert($rows);
    }

    private function seedPowerApps(): void
    {
        $now = now();
        $apps = [
            ['display_name' => 'Employee Onboarding', 'app_type' => 'canvas', 'status' => 'active'],
            ['display_name' => 'Expense Tracker', 'app_type' => 'canvas', 'status' => 'active'],
            ['display_name' => 'Asset Management', 'app_type' => 'model-driven', 'status' => 'active'],
            ['display_name' => 'IT Help Desk', 'app_type' => 'canvas', 'status' => 'active'],
            ['display_name' => 'Old Survey App', 'app_type' => 'canvas', 'status' => 'suspended'],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(2, 4);
            for ($j = 0; $j < $count; $j++) {
                $a = $apps[$j];
                $rows[] = [
                    'tenant_id' => $tid, 'app_id' => Str::uuid()->toString(),
                    'display_name' => $a['display_name'], 'owner' => 'IT Admin',
                    'environment_name' => 'Default', 'app_type' => $a['app_type'],
                    'shared_users_count' => rand(5, 100), 'shared_groups_count' => rand(0, 5),
                    'sessions_last_30d' => rand(10, 500), 'status' => $a['status'],
                    'connectors_json' => json_encode(['SharePoint', 'Office 365 Users']),
                    'last_modified_date' => now()->subDays(rand(1, 90))->toDateString(),
                    'created_date' => now()->subMonths(rand(1, 18))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('power_apps')->insert($rows);
    }

    private function seedPowerAutomateFlows(): void
    {
        $now = now();
        $flows = [
            ['display_name' => 'New Employee Provisioning', 'flow_type' => 'automated', 'uses_premium_connector' => true, 'has_external_connection' => false],
            ['display_name' => 'Daily Report Email', 'flow_type' => 'scheduled', 'uses_premium_connector' => false, 'has_external_connection' => false],
            ['display_name' => 'Approval Workflow', 'flow_type' => 'automated', 'uses_premium_connector' => false, 'has_external_connection' => false],
            ['display_name' => 'Slack Notification Bridge', 'flow_type' => 'automated', 'uses_premium_connector' => true, 'has_external_connection' => true],
            ['display_name' => 'SharePoint Backup', 'flow_type' => 'scheduled', 'uses_premium_connector' => false, 'has_external_connection' => true],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(3, 5);
            for ($j = 0; $j < $count; $j++) {
                $f = $flows[$j];
                $runs = rand(10, 300);
                $rows[] = [
                    'tenant_id' => $tid, 'flow_id' => Str::uuid()->toString(),
                    'display_name' => $f['display_name'], 'owner' => 'IT Admin',
                    'environment_name' => 'Default', 'flow_type' => $f['flow_type'],
                    'status' => 'active', 'runs_last_30d' => $runs,
                    'failures_last_30d' => $j === 3 ? rand(5, 30) : rand(0, 3),
                    'connectors_json' => json_encode(['SharePoint', 'Office 365 Outlook']),
                    'uses_premium_connector' => $f['uses_premium_connector'],
                    'has_external_connection' => $f['has_external_connection'],
                    'last_run_date' => now()->subHours(rand(1, 48))->toDateTimeString(),
                    'created_date' => now()->subMonths(rand(1, 12))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('power_automate_flows')->insert($rows);
    }

    private function seedConnectWise(): void
    {
        $now = now();
        DB::table('connectwise_config')->insert([
            'site_url' => 'https://na.myconnectwise.net',
            'company_id' => 'codeblue365',
            'default_board' => 'Service Board',
            'default_status' => 'New',
            'default_priority' => 'Medium',
            'auto_create_from_findings' => true,
            'auto_create_from_alerts' => false,
            'severity_threshold' => 'high',
            'sync_enabled' => true,
            'last_sync_at' => now()->subMinutes(30)->toDateTimeString(),
            'created_at' => $now, 'updated_at' => $now,
        ]);

        $tickets = [
            ['summary' => 'Critical: Expired app credentials - Contoso', 'status' => 'open', 'priority' => 'critical', 'source' => 'finding', 'tenant_id' => $this->tenantIds[0]],
            ['summary' => 'External mail forwarding detected - Fabrikam', 'status' => 'in-progress', 'priority' => 'high', 'source' => 'alert', 'tenant_id' => $this->tenantIds[3]],
            ['summary' => 'MFA not enforced for admin accounts', 'status' => 'open', 'priority' => 'high', 'source' => 'finding', 'tenant_id' => $this->tenantIds[1]],
            ['summary' => 'GDAP relationship expiring - Woodgrove', 'status' => 'in-progress', 'priority' => 'medium', 'source' => 'automated', 'tenant_id' => $this->tenantIds[4]],
            ['summary' => 'Device compliance below threshold', 'status' => 'closed', 'priority' => 'medium', 'source' => 'finding', 'tenant_id' => $this->tenantIds[2]],
            ['summary' => 'Secure Score dropped below 60', 'status' => 'closed', 'priority' => 'low', 'source' => 'automated', 'tenant_id' => $this->tenantIds[5]],
            ['summary' => 'Legacy auth sign-ins detected', 'status' => 'open', 'priority' => 'high', 'source' => 'alert', 'tenant_id' => $this->tenantIds[0]],
            ['summary' => 'Over-consented OAuth app found', 'status' => 'new', 'priority' => 'critical', 'source' => 'finding', 'tenant_id' => $this->tenantIds[6]],
        ];
        foreach ($tickets as $k => $t) {
            DB::table('connectwise_tickets')->insert([
                'tenant_id' => $t['tenant_id'], 'ticket_id' => 'CW-' . str_pad((string) ($k + 1001), 6, '0', STR_PAD_LEFT),
                'summary' => $t['summary'], 'status' => $t['status'], 'priority' => $t['priority'],
                'source' => $t['source'], 'board_name' => 'Service Board',
                'assigned_to' => ['Sarah Chen', 'James Wilson', 'Tom Barrett'][rand(0, 2)],
                'company_name' => $this->tenantNames[array_search($t['tenant_id'], $this->tenantIds)],
                'cw_ticket_url' => 'https://na.myconnectwise.net/v4_6_release/services/system_io/Service/fv_sr100_request.rails?service_recid=' . ($k + 1001),
                'created_date' => now()->subDays(rand(1, 30))->toDateString(),
                'closed_date' => $t['status'] === 'closed' ? now()->subDays(rand(0, 5))->toDateString() : null,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    private function seedNotifications(): void
    {
        $now = now();
        DB::table('notification_channels')->insert([
            ['name' => 'IT Alerts Email', 'type' => 'email', 'config_json' => json_encode(['recipients' => ['alerts@codeblue365.com', 'noc@codeblue365.com']]), 'enabled' => true, 'last_sent_at' => now()->subHours(2)->toDateTimeString(), 'created_at' => $now, 'updated_at' => $now],
            ['name' => 'Teams Security Channel', 'type' => 'teams-webhook', 'config_json' => json_encode(['webhook_url' => 'https://outlook.office.com/webhook/xxx']), 'enabled' => true, 'last_sent_at' => now()->subHours(6)->toDateTimeString(), 'created_at' => $now, 'updated_at' => $now],
        ]);
        DB::table('notification_rules')->insert([
            ['channel_id' => 1, 'event_type' => 'finding.critical', 'severity_threshold' => 'critical', 'enabled' => true, 'created_at' => $now, 'updated_at' => $now],
            ['channel_id' => 1, 'event_type' => 'alert.new', 'severity_threshold' => 'high', 'enabled' => true, 'created_at' => $now, 'updated_at' => $now],
            ['channel_id' => 2, 'event_type' => 'score.drop', 'severity_threshold' => 'medium', 'enabled' => true, 'created_at' => $now, 'updated_at' => $now],
            ['channel_id' => 2, 'event_type' => 'gdap.expiring', 'severity_threshold' => 'high', 'enabled' => true, 'created_at' => $now, 'updated_at' => $now],
            ['channel_id' => 1, 'event_type' => 'credential.expiring', 'severity_threshold' => 'high', 'enabled' => true, 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    private function seedRemediationActions(): void
    {
        $now = now();
        $actions = [
            ['tenant_id' => $this->tenantIds[0], 'action_type' => 'enable-mfa', 'title' => 'Enable MFA for admin accounts', 'status' => 'completed'],
            ['tenant_id' => $this->tenantIds[0], 'action_type' => 'revoke-consent', 'title' => 'Revoke over-consented OAuth app', 'status' => 'in-progress'],
            ['tenant_id' => $this->tenantIds[1], 'action_type' => 'block-forwarding', 'title' => 'Block external mail forwarding', 'status' => 'pending'],
            ['tenant_id' => $this->tenantIds[2], 'action_type' => 'enable-ca-policy', 'title' => 'Enable Conditional Access policy for legacy auth', 'status' => 'pending'],
            ['tenant_id' => $this->tenantIds[3], 'action_type' => 'disable-legacy-auth', 'title' => 'Disable legacy authentication protocols', 'status' => 'failed'],
            ['tenant_id' => $this->tenantIds[4], 'action_type' => 'rotate-credentials', 'title' => 'Rotate expired app registration credentials', 'status' => 'pending'],
            ['tenant_id' => $this->tenantIds[5], 'action_type' => 'enable-mfa', 'title' => 'Enforce MFA registration for all users', 'status' => 'completed'],
        ];
        foreach ($actions as $a) {
            DB::table('remediation_actions')->insert([
                'tenant_id' => $a['tenant_id'], 'finding_id' => rand(1, 20),
                'action_type' => $a['action_type'], 'title' => $a['title'],
                'description' => 'Automated remediation action generated from findings.',
                'status' => $a['status'], 'initiated_by' => 'System',
                'completed_at' => $a['status'] === 'completed' ? now()->subDays(rand(1, 10))->toDateTimeString() : null,
                'result_json' => $a['status'] === 'completed' ? json_encode(['success' => true]) : null,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    private function seedPasswordPolicies(): void
    {
        $now = now();
        $rows = [];
        $names = ['John Smith', 'Jane Doe', 'Alice Johnson', 'Bob Williams', 'Carol Davis',
                   'David Brown', 'Eva Martinez', 'Frank Wilson', 'Grace Lee', 'Admin BreakGlass'];
        foreach ($this->tenantIds as $i => $tid) {
            $domain = strtolower(str_replace(' ', '', $this->tenantNames[$i])) . '.com';
            $count = rand(5, 8);
            for ($j = 0; $j < $count; $j++) {
                $name = $names[$j % count($names)];
                $isBreakGlass = ($j === 9 || ($j === $count - 1 && rand(0, 1)));
                $rows[] = [
                    'tenant_id' => $tid,
                    'user_principal_name' => strtolower(str_replace(' ', '.', $name)) . '@' . $domain,
                    'display_name' => $name,
                    'password_last_set' => now()->subDays(rand(5, 180))->toDateString(),
                    'password_expiry_date' => rand(0, 1) ? now()->addDays(rand(-10, 90))->toDateString() : null,
                    'password_never_expires' => $isBreakGlass || rand(0, 4) === 0,
                    'uses_legacy_auth' => rand(0, 5) === 0,
                    'legacy_protocols_json' => rand(0, 5) === 0 ? json_encode(['POP3', 'IMAP']) : null,
                    'is_break_glass_account' => $isBreakGlass,
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('password_policies')->insert($rows);
    }

    private function seedPimActivations(): void
    {
        $now = now();
        $roles = ['Global Administrator', 'Security Administrator', 'Exchange Administrator',
                   'User Administrator', 'SharePoint Administrator', 'Compliance Administrator'];
        $rows = [];
        foreach ($this->tenantIds as $i => $tid) {
            $domain = strtolower(str_replace(' ', '', $this->tenantNames[$i])) . '.com';
            $count = rand(2, 4);
            for ($j = 0; $j < $count; $j++) {
                $rows[] = [
                    'tenant_id' => $tid,
                    'user_principal_name' => 'admin' . $j . '@' . $domain,
                    'display_name' => 'Admin User ' . ($j + 1),
                    'role_name' => $roles[$j % count($roles)],
                    'activation_type' => $j === 0 ? 'active' : 'eligible',
                    'status' => 'active',
                    'start_date' => now()->subDays(rand(1, 90))->toDateString(),
                    'end_date' => now()->addDays(rand(30, 365))->toDateString(),
                    'justification' => $j === 0 ? 'Permanent admin assignment' : 'IT operations role',
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('pim_role_activations')->insert($rows);
    }

    private function seedSecureScoreActions(): void
    {
        $now = now();
        $actions = [
            ['title' => 'Enable MFA for all users', 'category' => 'Identity', 'max_score' => 10, 'status' => 'inprogress'],
            ['title' => 'Do not allow users to grant consent to unmanaged apps', 'category' => 'Apps', 'max_score' => 5, 'status' => 'todo'],
            ['title' => 'Enable self-service password reset', 'category' => 'Identity', 'max_score' => 4, 'status' => 'completed'],
            ['title' => 'Turn on sign-in risk policy', 'category' => 'Identity', 'max_score' => 8, 'status' => 'todo'],
            ['title' => 'Block legacy authentication', 'category' => 'Identity', 'max_score' => 7, 'status' => 'inprogress'],
            ['title' => 'Enable Conditional Access policies', 'category' => 'Identity', 'max_score' => 6, 'status' => 'todo'],
            ['title' => 'Require MFA for admins', 'category' => 'Identity', 'max_score' => 10, 'status' => 'completed'],
            ['title' => 'Enable Microsoft Defender for Office 365', 'category' => 'Data', 'max_score' => 5, 'status' => 'todo'],
            ['title' => 'Enable DLP policies', 'category' => 'Data', 'max_score' => 4, 'status' => 'riskaccepted'],
            ['title' => 'Use limited admin roles', 'category' => 'Identity', 'max_score' => 3, 'status' => 'completed'],
            ['title' => 'Designate more than one global admin', 'category' => 'Identity', 'max_score' => 2, 'status' => 'completed'],
            ['title' => 'Ensure all users can complete MFA', 'category' => 'Identity', 'max_score' => 5, 'status' => 'inprogress'],
            ['title' => 'Enable audit data recording', 'category' => 'Data', 'max_score' => 3, 'status' => 'completed'],
            ['title' => 'Do not expire passwords', 'category' => 'Identity', 'max_score' => 2, 'status' => 'todo'],
            ['title' => 'Enable Microsoft Cloud App Security', 'category' => 'Apps', 'max_score' => 4, 'status' => 'todo'],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            foreach ($actions as $k => $a) {
                $currentScore = $a['status'] === 'completed' ? $a['max_score'] : ($a['status'] === 'inprogress' ? round($a['max_score'] * 0.5, 1) : 0);
                $rows[] = [
                    'tenant_id' => $tid, 'action_id' => 'action-' . ($k + 1),
                    'title' => $a['title'], 'category' => $a['category'],
                    'max_score' => $a['max_score'], 'current_score' => $currentScore,
                    'status' => $a['status'], 'implementation_status' => null,
                    'remediation_description' => 'Follow Microsoft security best practices.',
                    'user_impact' => ['low', 'moderate', 'high'][rand(0, 2)],
                    'threats_json' => json_encode(['credential theft', 'account compromise']),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('secure_score_actions')->insert($rows);
    }

    private function seedDefenderAlerts(): void
    {
        $now = now();
        $alerts = [
            ['title' => 'Suspicious inbox forwarding rule', 'severity' => 'high', 'category' => 'Credential Access', 'service_source' => 'MDO'],
            ['title' => 'Impossible travel activity', 'severity' => 'medium', 'category' => 'Initial Access', 'service_source' => 'AAD-IP'],
            ['title' => 'Malware detected on device', 'severity' => 'high', 'category' => 'Execution', 'service_source' => 'MDE'],
            ['title' => 'Password spray attack', 'severity' => 'high', 'category' => 'Credential Access', 'service_source' => 'AAD-IP'],
            ['title' => 'Unusual file deletion activity', 'severity' => 'medium', 'category' => 'Impact', 'service_source' => 'MDA'],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(2, 4);
            for ($j = 0; $j < $count; $j++) {
                $a = $alerts[$j % count($alerts)];
                $rows[] = [
                    'tenant_id' => $tid, 'alert_id' => 'da-' . Str::uuid()->toString(),
                    'title' => $a['title'], 'severity' => $a['severity'],
                    'category' => $a['category'], 'status' => ['new', 'inProgress', 'resolved'][rand(0, 2)],
                    'service_source' => $a['service_source'], 'detection_source' => 'Automated',
                    'description' => $a['title'] . ' detected by ' . $a['service_source'],
                    'assigned_to' => rand(0, 1) ? 'Security Team' : null,
                    'first_activity_date' => now()->subDays(rand(1, 14))->toDateString(),
                    'last_activity_date' => now()->subDays(rand(0, 3))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('defender_alerts')->insert($rows);
    }

    private function seedSecurityDefaults(): void
    {
        $now = now();
        foreach ($this->tenantIds as $i => $tid) {
            $totalUsers = rand(20, 500);
            DB::table('security_defaults')->insert([
                'tenant_id' => $tid,
                'security_defaults_enabled' => $i > 4, // smaller orgs use security defaults
                'per_user_mfa_enforced' => $i <= 4,
                'users_mfa_enforced' => (int) ($totalUsers * (rand(60, 95) / 100)),
                'users_mfa_registered' => (int) ($totalUsers * (rand(70, 98) / 100)),
                'users_passwordless' => rand(0, (int) ($totalUsers * 0.3)),
                'legacy_auth_blocked' => $i !== 3 && $i !== 7, // Fabrikam and Fourth Coffee haven't blocked yet
                'legacy_auth_sign_ins_30d' => ($i === 3 || $i === 7) ? rand(50, 500) : rand(0, 10),
                'assessed_at' => now()->subHours(rand(1, 24))->toDateTimeString(),
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    private function seedCompliancePolicies(): void
    {
        $now = now();
        $policies = [
            ['policy_name' => 'Windows 10+ Compliance', 'platform' => 'windows'],
            ['policy_name' => 'iOS MDM Compliance', 'platform' => 'ios'],
            ['policy_name' => 'Android Enterprise', 'platform' => 'android'],
            ['policy_name' => 'macOS Compliance', 'platform' => 'macos'],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(2, 4);
            for ($j = 0; $j < $count; $j++) {
                $p = $policies[$j];
                $assigned = rand(10, 200);
                $compliant = (int) ($assigned * (rand(60, 95) / 100));
                $rows[] = [
                    'tenant_id' => $tid, 'policy_id' => Str::uuid()->toString(),
                    'policy_name' => $p['policy_name'], 'platform' => $p['platform'],
                    'assigned_count' => $assigned, 'compliant_count' => $compliant,
                    'non_compliant_count' => $assigned - $compliant - rand(0, 5),
                    'error_count' => rand(0, 3),
                    'last_evaluated_at' => now()->subHours(rand(1, 48))->toDateTimeString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('compliance_policies')->insert($rows);
    }

    private function seedAutopilotDevices(): void
    {
        $now = now();
        $models = ['Surface Pro 9', 'Surface Laptop 5', 'ThinkPad X1 Carbon', 'HP EliteBook 840', 'Dell Latitude 5540'];
        $manufacturers = ['Microsoft', 'Microsoft', 'Lenovo', 'HP', 'Dell'];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(3, 6);
            for ($j = 0; $j < $count; $j++) {
                $idx = $j % count($models);
                $rows[] = [
                    'tenant_id' => $tid, 'serial_number' => 'SN-' . strtoupper(Str::random(10)),
                    'model' => $models[$idx], 'manufacturer' => $manufacturers[$idx],
                    'enrollment_status' => ['enrolled', 'enrolled', 'enrolled', 'pending', 'failed'][rand(0, 4)],
                    'deployment_profile' => 'Standard Deployment',
                    'group_tag' => ['Corporate', 'BYOD', 'Kiosk'][rand(0, 2)],
                    'last_contacted_date' => now()->subDays(rand(0, 30))->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('autopilot_devices')->insert($rows);
    }

    private function seedLicenseCostAnalysis(): void
    {
        $now = now();
        $skus = [
            ['sku_name' => 'M365_BUSINESS_PREMIUM', 'sku_friendly_name' => 'Microsoft 365 Business Premium', 'cost_per_unit_monthly' => 22.00],
            ['sku_name' => 'SPE_E3', 'sku_friendly_name' => 'Microsoft 365 E3', 'cost_per_unit_monthly' => 36.00],
            ['sku_name' => 'SPE_E5', 'sku_friendly_name' => 'Microsoft 365 E5', 'cost_per_unit_monthly' => 57.00],
            ['sku_name' => 'MCOPSTN1', 'sku_friendly_name' => 'Microsoft Copilot for Microsoft 365', 'cost_per_unit_monthly' => 30.00],
            ['sku_name' => 'MDATP_XPLAT', 'sku_friendly_name' => 'Microsoft Defender for Endpoint P2', 'cost_per_unit_monthly' => 5.20],
            ['sku_name' => 'EXCHANGESTANDARD', 'sku_friendly_name' => 'Exchange Online (Plan 1)', 'cost_per_unit_monthly' => 4.00],
        ];
        $rows = [];
        foreach ($this->tenantIds as $tid) {
            $count = rand(3, 5);
            for ($j = 0; $j < $count; $j++) {
                $s = $skus[$j % count($skus)];
                $purchased = rand(10, 200);
                $assigned = (int) ($purchased * (rand(60, 100) / 100));
                $active = (int) ($assigned * (rand(70, 100) / 100));
                $wasted = ($purchased - $active) * $s['cost_per_unit_monthly'];
                $rows[] = [
                    'tenant_id' => $tid, 'sku_name' => $s['sku_name'],
                    'sku_friendly_name' => $s['sku_friendly_name'],
                    'purchased_units' => $purchased, 'assigned_units' => $assigned,
                    'active_units' => $active, 'cost_per_unit_monthly' => $s['cost_per_unit_monthly'],
                    'total_monthly_cost' => $purchased * $s['cost_per_unit_monthly'],
                    'wasted_monthly_cost' => round($wasted, 2),
                    'optimization_recommendation' => $wasted > 100 ? 'Reduce purchased licenses by ' . ($purchased - $active) . ' units' : null,
                    'report_date' => now()->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('license_cost_analysis')->insert($rows);
    }

    private function seedTenantBenchmarks(): void
    {
        $now = now();
        $metrics = ['secure_score', 'mfa_coverage', 'device_compliance', 'copilot_adoption',
                     'identity_score', 'data_protection', 'license_utilization'];
        $rows = [];
        // Calculate fleet averages first
        $fleetAvg = [];
        foreach ($metrics as $m) {
            $fleetAvg[$m] = round(rand(5000, 8500) / 100, 1);
        }
        foreach ($this->tenantIds as $tid) {
            foreach ($metrics as $m) {
                $value = round($fleetAvg[$m] + rand(-2000, 2000) / 100, 1);
                $value = max(0, min(100, $value));
                $rows[] = [
                    'tenant_id' => $tid, 'metric_name' => $m,
                    'metric_value' => $value, 'fleet_average' => $fleetAvg[$m],
                    'fleet_best' => round($fleetAvg[$m] + rand(500, 1500) / 100, 1),
                    'percentile_rank' => $value >= $fleetAvg[$m] ? 'above' : 'below',
                    'report_date' => now()->toDateString(),
                    'created_at' => $now, 'updated_at' => $now,
                ];
            }
        }
        DB::table('tenant_benchmarks')->insert($rows);
    }
}
