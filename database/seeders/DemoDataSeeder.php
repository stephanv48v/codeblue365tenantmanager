<?php

declare(strict_types=1);

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    /**
     * Realistic MSP demo data for CodeBlue 365 Tenant Manager.
     * Seeds 8 managed tenants with full M365 telemetry.
     */
    public function run(): void
    {
        $this->seedTenants();
        $this->seedGdapRelationships();
        $this->seedTenantIntegrations();
        $this->seedUsersNormalized();
        $this->seedRiskyUsers();
        $this->seedConditionalAccessPolicies();
        $this->seedDevices();
        $this->seedLicenses();
        $this->seedSecureScores();
        $this->seedServiceHealthEvents();
        $this->seedScores();
        $this->seedFindings();
        $this->seedAlerts();
        $this->seedSyncRuns();
        $this->seedRecommendations();
        $this->seedCompliance();
        $this->seedCopilotUsage();
        $this->seedCopilotAgents();
        $this->seedSharePointSites();
        $this->seedCopilotReadiness();
        $this->seedAuthMethodStats();
        $this->seedDirectoryRoleAssignments();
        $this->seedGuestUsers();
        $this->seedSignInSummaries();
    }

    // ─── Tenants ──────────────────────────────────────────────

    private function seedTenants(): void
    {
        $tenants = [
            [
                'tenant_id' => 'a1b2c3d4-1111-4000-8000-000000000001',
                'customer_name' => 'Contoso Ltd',
                'primary_domain' => 'contoso.com',
                'gdap_status' => 'active',
                'gdap_expiry_at' => now()->addDays(180),
                'integration_status' => 'healthy',
                'last_sync_at' => now()->subMinutes(12),
                'assigned_engineer' => 'Sarah Chen',
                'support_tier' => 'Premium',
            ],
            [
                'tenant_id' => 'a1b2c3d4-2222-4000-8000-000000000002',
                'customer_name' => 'Northwind Traders',
                'primary_domain' => 'northwindtraders.com',
                'gdap_status' => 'active',
                'gdap_expiry_at' => now()->addDays(95),
                'integration_status' => 'healthy',
                'last_sync_at' => now()->subMinutes(28),
                'assigned_engineer' => 'James Wilson',
                'support_tier' => 'Standard',
            ],
            [
                'tenant_id' => 'a1b2c3d4-3333-4000-8000-000000000003',
                'customer_name' => 'Adventure Works',
                'primary_domain' => 'adventureworks.co.nz',
                'gdap_status' => 'active',
                'gdap_expiry_at' => now()->addDays(42),
                'integration_status' => 'healthy',
                'last_sync_at' => now()->subHours(2),
                'assigned_engineer' => 'Sarah Chen',
                'support_tier' => 'Premium',
            ],
            [
                'tenant_id' => 'a1b2c3d4-4444-4000-8000-000000000004',
                'customer_name' => 'Fabrikam Inc',
                'primary_domain' => 'fabrikam.com',
                'gdap_status' => 'active',
                'gdap_expiry_at' => now()->addDays(220),
                'integration_status' => 'degraded',
                'last_sync_at' => now()->subHours(6),
                'assigned_engineer' => 'Tom Barrett',
                'support_tier' => 'Standard',
            ],
            [
                'tenant_id' => 'a1b2c3d4-5555-4000-8000-000000000005',
                'customer_name' => 'Woodgrove Bank',
                'primary_domain' => 'woodgrovebank.com',
                'gdap_status' => 'active',
                'gdap_expiry_at' => now()->addDays(15),
                'integration_status' => 'healthy',
                'last_sync_at' => now()->subMinutes(45),
                'assigned_engineer' => 'James Wilson',
                'support_tier' => 'Enterprise',
            ],
            [
                'tenant_id' => 'a1b2c3d4-6666-4000-8000-000000000006',
                'customer_name' => 'Litware Solutions',
                'primary_domain' => 'litware.io',
                'gdap_status' => 'expired',
                'gdap_expiry_at' => now()->subDays(3),
                'integration_status' => 'error',
                'last_sync_at' => now()->subDays(4),
                'assigned_engineer' => 'Tom Barrett',
                'support_tier' => 'Basic',
            ],
            [
                'tenant_id' => 'a1b2c3d4-7777-4000-8000-000000000007',
                'customer_name' => 'Tailspin Toys',
                'primary_domain' => 'tailspintoys.com',
                'gdap_status' => 'pending',
                'gdap_expiry_at' => null,
                'integration_status' => 'not_configured',
                'last_sync_at' => null,
                'assigned_engineer' => null,
                'support_tier' => 'Basic',
            ],
            [
                'tenant_id' => 'a1b2c3d4-8888-4000-8000-000000000008',
                'customer_name' => 'Proseware Corp',
                'primary_domain' => 'proseware.com',
                'gdap_status' => 'active',
                'gdap_expiry_at' => now()->addDays(310),
                'integration_status' => 'healthy',
                'last_sync_at' => now()->subMinutes(5),
                'assigned_engineer' => 'Sarah Chen',
                'support_tier' => 'Enterprise',
            ],
        ];

        foreach ($tenants as $t) {
            DB::table('managed_tenants')->insert(array_merge($t, [
                'created_at' => now()->subDays(rand(30, 180)),
                'updated_at' => now(),
            ]));
        }
    }

    // ─── GDAP Relationships ───────────────────────────────────

    private function seedGdapRelationships(): void
    {
        $managedTenants = DB::table('managed_tenants')->get();
        $roles = [
            'Directory Readers', 'Security Reader', 'Global Reader',
            'Exchange Administrator', 'Intune Administrator',
            'Helpdesk Administrator', 'Security Administrator',
            'User Administrator', 'Cloud Application Administrator',
        ];

        foreach ($managedTenants as $tenant) {
            if ($tenant->gdap_status === 'pending') continue;

            $numRelationships = rand(1, 3);
            for ($i = 0; $i < $numRelationships; $i++) {
                $subset = array_rand(array_flip($roles), rand(3, 6));
                DB::table('gdap_relationships')->insert([
                    'managed_tenant_id' => $tenant->id,
                    'status' => $i === 0 ? $tenant->gdap_status : 'active',
                    'starts_at' => now()->subDays(rand(60, 365)),
                    'expires_at' => $tenant->gdap_expiry_at ?? now()->subDays(3),
                    'role_assignments' => json_encode(array_values((array) $subset)),
                    'metadata' => json_encode(['source' => 'Partner Center', 'version' => '2.0']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Tenant Integrations ──────────────────────────────────

    private function seedTenantIntegrations(): void
    {
        $integrations = DB::table('integrations')->get();
        $managedTenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        foreach ($managedTenants as $tenant) {
            foreach ($integrations as $integration) {
                $isActive = $tenant->integration_status === 'healthy'
                    ? (rand(1, 100) <= 85 ? 'active' : 'not_configured')
                    : (rand(1, 100) <= 50 ? 'active' : 'error');

                if ($tenant->gdap_status === 'expired') $isActive = 'error';

                DB::table('tenant_integrations')->insert([
                    'managed_tenant_id' => $tenant->id,
                    'integration_id' => $integration->id,
                    'status' => $isActive,
                    'last_validated_at' => $isActive === 'active' ? now()->subHours(rand(1, 48)) : null,
                    'validation_payload' => $isActive === 'active' ? json_encode(['valid' => true]) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Users Normalized ─────────────────────────────────────

    private function seedUsersNormalized(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Logan', 'Mia', 'Lucas', 'Charlotte', 'Alexander', 'Amelia', 'Henry', 'Harper', 'Daniel', 'Ella', 'Michael', 'Grace', 'James', 'Lily', 'Benjamin', 'Chloe', 'William', 'Zoey', 'David', 'Aria', 'Jack', 'Riley', 'Owen', 'Nora', 'Samuel', 'Layla', 'Ryan', 'Ellie', 'Nathan', 'Hannah', 'Andrew'];
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson'];

        $userCounts = [
            'contoso.com' => 85,
            'northwindtraders.com' => 42,
            'adventureworks.co.nz' => 120,
            'fabrikam.com' => 55,
            'woodgrovebank.com' => 200,
            'litware.io' => 28,
            'proseware.com' => 150,
        ];

        foreach ($tenants as $tenant) {
            $count = $userCounts[$tenant->primary_domain] ?? 30;
            $mfaRate = match ($tenant->primary_domain) {
                'woodgrovebank.com' => 0.98,
                'proseware.com' => 0.94,
                'contoso.com' => 0.88,
                'adventureworks.co.nz' => 0.82,
                'northwindtraders.com' => 0.76,
                'fabrikam.com' => 0.65,
                'litware.io' => 0.50,
                default => 0.75,
            };

            $rows = [];
            for ($i = 0; $i < $count; $i++) {
                $first = $firstNames[array_rand($firstNames)];
                $last = $lastNames[array_rand($lastNames)];
                $domain = $tenant->primary_domain;
                $enabled = $i < ($count * 0.9); // 10% disabled accounts
                $stale = !$enabled || (rand(1, 100) <= 8); // ~8% stale among enabled

                $rows[] = [
                    'entra_user_id' => Str::uuid()->toString(),
                    'tenant_id' => $tenant->tenant_id,
                    'display_name' => "$first $last",
                    'user_principal_name' => strtolower("$first.$last") . rand(1, 99) . "@$domain",
                    'mail' => strtolower("$first.$last") . rand(1, 99) . "@$domain",
                    'account_enabled' => $enabled,
                    'mfa_registered' => $enabled && (rand(1, 100) / 100 <= $mfaRate),
                    'last_sign_in_at' => $stale
                        ? now()->subDays(rand(91, 300))
                        : now()->subDays(rand(0, 14)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Batch insert
            foreach (array_chunk($rows, 50) as $chunk) {
                DB::table('users_normalized')->insert($chunk);
            }
        }
    }

    // ─── Risky Users ──────────────────────────────────────────

    private function seedRiskyUsers(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $riskLevels = ['high', 'high', 'medium', 'medium', 'medium', 'low', 'low', 'low', 'low'];

        foreach ($tenants as $tenant) {
            $count = match ($tenant->primary_domain) {
                'woodgrovebank.com' => 8,
                'adventureworks.co.nz' => 5,
                'contoso.com' => 3,
                'fabrikam.com' => 6,
                'proseware.com' => 4,
                'northwindtraders.com' => 2,
                'litware.io' => 3,
                default => 1,
            };

            for ($i = 0; $i < $count; $i++) {
                DB::table('risky_users')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'user_id' => Str::uuid()->toString(),
                    'user_principal_name' => 'user' . rand(100, 999) . '@' . $tenant->primary_domain,
                    'display_name' => 'User ' . rand(100, 999),
                    'risk_level' => $riskLevels[array_rand($riskLevels)],
                    'risk_state' => rand(1, 100) <= 70 ? 'atRisk' : 'confirmedCompromised',
                    'risk_detail' => collect([
                        'Unfamiliar sign-in properties',
                        'Atypical travel',
                        'Anonymous IP address',
                        'Malware linked IP address',
                        'Password spray',
                        'Leaked credentials',
                    ])->random(),
                    'risk_last_updated_at' => now()->subHours(rand(1, 72)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Conditional Access Policies ──────────────────────────

    private function seedConditionalAccessPolicies(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $policyTemplates = [
            ['name' => 'Require MFA for all users', 'grant' => ['mfa']],
            ['name' => 'Block legacy authentication', 'grant' => ['block']],
            ['name' => 'Require compliant device', 'grant' => ['compliantDevice']],
            ['name' => 'Require MFA for admins', 'grant' => ['mfa']],
            ['name' => 'Block sign-in from risky locations', 'grant' => ['block']],
            ['name' => 'Require approved client apps', 'grant' => ['approvedApplication']],
            ['name' => 'Session timeout for sensitive apps', 'grant' => ['mfa', 'compliantDevice']],
            ['name' => 'Require MFA for Azure management', 'grant' => ['mfa']],
            ['name' => 'Block external access to admin portal', 'grant' => ['block']],
        ];

        foreach ($tenants as $tenant) {
            $numPolicies = rand(4, count($policyTemplates));
            $selected = array_rand($policyTemplates, $numPolicies);
            if (!is_array($selected)) $selected = [$selected];

            foreach ($selected as $idx) {
                $tmpl = $policyTemplates[$idx];
                $state = rand(1, 100) <= 75 ? 'enabled' : (rand(1, 2) === 1 ? 'disabled' : 'enabledForReportingButNotEnforced');

                DB::table('conditional_access_policies')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'policy_id' => Str::uuid()->toString(),
                    'display_name' => $tmpl['name'],
                    'state' => $state,
                    'conditions' => json_encode([
                        'users' => ['includeUsers' => ['All']],
                        'applications' => ['includeApplications' => ['All']],
                    ]),
                    'grant_controls' => json_encode(['builtInControls' => $tmpl['grant']]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Devices ──────────────────────────────────────────────

    private function seedDevices(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $osList = [
            ['os' => 'Windows', 'versions' => ['11 23H2', '11 22H2', '10 22H2', '10 21H2']],
            ['os' => 'macOS', 'versions' => ['14.3', '14.2', '13.6', '13.5']],
            ['os' => 'iOS', 'versions' => ['17.3', '17.2', '16.7', '16.6']],
            ['os' => 'Android', 'versions' => ['14', '13', '12']],
        ];

        $deviceCounts = [
            'contoso.com' => 95,
            'northwindtraders.com' => 50,
            'adventureworks.co.nz' => 140,
            'fabrikam.com' => 60,
            'woodgrovebank.com' => 230,
            'litware.io' => 32,
            'proseware.com' => 170,
        ];

        foreach ($tenants as $tenant) {
            $count = $deviceCounts[$tenant->primary_domain] ?? 30;
            $complianceRate = match ($tenant->primary_domain) {
                'woodgrovebank.com' => 0.95,
                'proseware.com' => 0.91,
                'contoso.com' => 0.87,
                'adventureworks.co.nz' => 0.80,
                'northwindtraders.com' => 0.78,
                'fabrikam.com' => 0.62,
                'litware.io' => 0.45,
                default => 0.75,
            };

            $rows = [];
            for ($i = 0; $i < $count; $i++) {
                $osEntry = $osList[array_rand($osList)];
                // Weight toward Windows (60%) for corp environments
                if (rand(1, 100) <= 60) $osEntry = $osList[0];

                $isCompliant = rand(1, 100) / 100 <= $complianceRate;

                $rows[] = [
                    'device_id' => Str::uuid()->toString(),
                    'tenant_id' => $tenant->tenant_id,
                    'display_name' => strtoupper(substr($tenant->primary_domain, 0, 3)) . '-' . strtoupper(Str::random(3)) . '-' . rand(100, 999),
                    'os' => $osEntry['os'],
                    'os_version' => $osEntry['versions'][array_rand($osEntry['versions'])],
                    'compliance_state' => $isCompliant ? 'compliant' : (rand(1, 3) === 1 ? 'noncompliant' : 'unknown'),
                    'managed_by' => rand(1, 100) <= 85 ? 'Intune' : 'unmanaged',
                    'last_sync_at' => now()->subHours(rand(1, 168)),
                    'enrolled_at' => now()->subDays(rand(30, 400)),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            foreach (array_chunk($rows, 50) as $chunk) {
                DB::table('devices')->insert($chunk);
            }
        }
    }

    // ─── Licenses ─────────────────────────────────────────────

    private function seedLicenses(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $skuTemplates = [
            ['sku_id' => 'O365_BUSINESS_PREMIUM', 'sku_name' => 'Microsoft 365 Business Premium'],
            ['sku_id' => 'SPE_E3', 'sku_name' => 'Microsoft 365 E3'],
            ['sku_id' => 'SPE_E5', 'sku_name' => 'Microsoft 365 E5'],
            ['sku_id' => 'EXCHANGESTANDARD', 'sku_name' => 'Exchange Online (Plan 1)'],
            ['sku_id' => 'EMS_E3', 'sku_name' => 'Enterprise Mobility + Security E3'],
            ['sku_id' => 'EMS_E5', 'sku_name' => 'Enterprise Mobility + Security E5'],
            ['sku_id' => 'AAD_PREMIUM_P2', 'sku_name' => 'Microsoft Entra ID P2'],
            ['sku_id' => 'POWER_BI_PRO', 'sku_name' => 'Power BI Pro'],
            ['sku_id' => 'PROJECTPREMIUM', 'sku_name' => 'Project Plan 5'],
            ['sku_id' => 'VISIOONLINE_PLAN1', 'sku_name' => 'Visio Plan 1'],
            ['sku_id' => 'WIN_DEF_ATP', 'sku_name' => 'Microsoft Defender for Endpoint P2'],
        ];

        foreach ($tenants as $tenant) {
            $numSkus = rand(3, 7);
            $selectedSkus = array_rand($skuTemplates, $numSkus);
            if (!is_array($selectedSkus)) $selectedSkus = [$selectedSkus];

            foreach ($selectedSkus as $idx) {
                $sku = $skuTemplates[$idx];
                $total = rand(10, 250);
                $wasteRate = match ($tenant->primary_domain) {
                    'fabrikam.com' => rand(15, 30) / 100,
                    'litware.io' => rand(20, 40) / 100,
                    'northwindtraders.com' => rand(10, 20) / 100,
                    default => rand(2, 12) / 100,
                };
                $assigned = (int) round($total * (1 - $wasteRate));
                $available = $total - $assigned;

                DB::table('licenses')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'sku_id' => $sku['sku_id'],
                    'sku_name' => $sku['sku_name'],
                    'total' => $total,
                    'assigned' => $assigned,
                    'available' => max(0, $available),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Secure Scores ────────────────────────────────────────

    private function seedSecureScores(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        foreach ($tenants as $tenant) {
            $baseScore = match ($tenant->primary_domain) {
                'woodgrovebank.com' => 72.0,
                'proseware.com' => 68.0,
                'contoso.com' => 58.0,
                'adventureworks.co.nz' => 52.0,
                'northwindtraders.com' => 47.0,
                'fabrikam.com' => 35.0,
                'litware.io' => 22.0,
                default => 50.0,
            };

            // Historical scores (30 days)
            for ($d = 30; $d >= 0; $d -= 3) {
                $drift = rand(-3, 4) / 10; // slight improvement trend
                $current = round($baseScore + ($drift * (30 - $d) / 10), 2);
                $maxScore = 100.0;

                DB::table('secure_scores')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'current_score' => min(100, max(0, $current)),
                    'max_score' => $maxScore,
                    'category_scores' => json_encode([
                        'Identity' => round($current * rand(80, 120) / 100, 1),
                        'Device' => round($current * rand(70, 110) / 100, 1),
                        'App' => round($current * rand(60, 100) / 100, 1),
                        'Data' => round($current * rand(50, 90) / 100, 1),
                    ]),
                    'fetched_at' => now()->subDays($d),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Service Health Events ────────────────────────────────

    private function seedServiceHealthEvents(): void
    {
        $services = [
            'Exchange Online', 'Microsoft Teams', 'SharePoint Online',
            'Microsoft Entra', 'Microsoft Intune', 'OneDrive for Business',
            'Power Platform', 'Microsoft 365 Suite',
        ];
        $classifications = ['advisory', 'advisory', 'advisory', 'incident', 'incident'];
        $statuses = ['serviceOperational', 'investigating', 'serviceRestored', 'restoringService', 'serviceOperational'];

        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $eventTitles = [
            'Users unable to access mailbox from mobile devices',
            'Intermittent delays when sending emails',
            'Teams meeting recording not saving',
            'SharePoint site collection creation failures',
            'Conditional access policies not evaluating correctly',
            'Intune device enrollment errors for iOS devices',
            'OneDrive sync client showing errors',
            'Power Automate flows failing intermittently',
            'MFA prompt appearing repeatedly for authenticated users',
            'Teams presence showing incorrect status',
            'SharePoint search returning incomplete results',
            'Exchange Online calendar sync delays',
        ];

        foreach ($tenants as $tenant) {
            $numEvents = rand(2, 6);
            for ($i = 0; $i < $numEvents; $i++) {
                $classification = $classifications[array_rand($classifications)];
                $status = $statuses[array_rand($statuses)];
                $startDays = rand(0, 14);

                DB::table('service_health_events')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'event_id' => 'EX' . rand(100000, 999999),
                    'service' => $services[array_rand($services)],
                    'title' => $eventTitles[array_rand($eventTitles)],
                    'classification' => $classification,
                    'status' => $status,
                    'start_at' => now()->subDays($startDays),
                    'end_at' => $status === 'serviceRestored' ? now()->subDays($startDays)->addHours(rand(2, 48)) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Scores (composite + sub-scores) ─────────────────────

    private function seedScores(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        foreach ($tenants as $tenant) {
            $profile = match ($tenant->primary_domain) {
                'woodgrovebank.com' => ['identity' => 88, 'device' => 90, 'app' => 82, 'security' => 85, 'governance' => 78, 'integration' => 92],
                'proseware.com' => ['identity' => 82, 'device' => 85, 'app' => 78, 'security' => 80, 'governance' => 72, 'integration' => 88],
                'contoso.com' => ['identity' => 75, 'device' => 72, 'app' => 68, 'security' => 70, 'governance' => 65, 'integration' => 80],
                'adventureworks.co.nz' => ['identity' => 70, 'device' => 65, 'app' => 62, 'security' => 68, 'governance' => 55, 'integration' => 75],
                'northwindtraders.com' => ['identity' => 62, 'device' => 58, 'app' => 55, 'security' => 60, 'governance' => 48, 'integration' => 70],
                'fabrikam.com' => ['identity' => 50, 'device' => 45, 'app' => 42, 'security' => 48, 'governance' => 35, 'integration' => 55],
                'litware.io' => ['identity' => 35, 'device' => 30, 'app' => 28, 'security' => 32, 'governance' => 22, 'integration' => 25],
                default => ['identity' => 60, 'device' => 55, 'app' => 50, 'security' => 55, 'governance' => 45, 'integration' => 60],
            };

            // Historical scores (8 snapshots over 24 days)
            for ($d = 24; $d >= 0; $d -= 3) {
                $jitter = fn ($base) => max(0, min(100, $base + rand(-4, 3)));
                $i = $jitter($profile['identity']);
                $dv = $jitter($profile['device']);
                $a = $jitter($profile['app']);
                $s = $jitter($profile['security']);
                $g = $jitter($profile['governance']);
                $int = $jitter($profile['integration']);
                $composite = round(($i * 0.20 + $dv * 0.15 + $a * 0.10 + $s * 0.25 + $g * 0.15 + $int * 0.15), 2);

                DB::table('scores')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'identity_currency' => $i,
                    'device_currency' => $dv,
                    'app_currency' => $a,
                    'security_posture' => $s,
                    'governance_readiness' => $g,
                    'integration_readiness' => $int,
                    'composite_score' => $composite,
                    'calculated_at' => now()->subDays($d),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Findings ─────────────────────────────────────────────

    private function seedFindings(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $findingTemplates = [
            ['rule_key' => 'mfa_coverage_below_90', 'category' => 'identity', 'severity' => 'high', 'desc' => 'MFA coverage is below 90%% threshold', 'remediation' => 'Enable MFA for all users via Conditional Access policy'],
            ['rule_key' => 'stale_users_detected', 'category' => 'identity', 'severity' => 'medium', 'desc' => 'Stale user accounts detected (no sign-in >90 days)', 'remediation' => 'Review and disable or delete stale accounts'],
            ['rule_key' => 'risky_users_active', 'category' => 'identity', 'severity' => 'critical', 'desc' => 'Users with active risk detections found', 'remediation' => 'Investigate risky users and require password reset'],
            ['rule_key' => 'license_waste_above_10_percent', 'category' => 'licensing', 'severity' => 'medium', 'desc' => 'License waste exceeds 10%% - unassigned licenses consuming budget', 'remediation' => 'Reclaim unused licenses or reduce subscription count'],
            ['rule_key' => 'device_compliance_below_90', 'category' => 'devices', 'severity' => 'high', 'desc' => 'Device compliance rate is below 90%%', 'remediation' => 'Review non-compliant devices and enforce compliance policies'],
            ['rule_key' => 'conditional_access_gaps', 'category' => 'identity', 'severity' => 'high', 'desc' => 'Conditional Access policy gaps detected', 'remediation' => 'Enable MFA and device compliance policies for all users'],
            ['rule_key' => 'global_admins_above_4', 'category' => 'identity', 'severity' => 'medium', 'desc' => 'More than 4 Global Administrator accounts detected', 'remediation' => 'Reduce Global Admin count and use least-privilege roles'],
            ['rule_key' => 'secure_score_below_50_percent', 'category' => 'security', 'severity' => 'high', 'desc' => 'Microsoft Secure Score is below 50%%', 'remediation' => 'Review Secure Score recommendations and implement top actions'],
            ['rule_key' => 'gdap_expiry_approaching', 'category' => 'governance', 'severity' => 'medium', 'desc' => 'GDAP relationship expires within 30 days', 'remediation' => 'Initiate GDAP renewal process with the customer'],
            ['rule_key' => 'legacy_auth_not_blocked', 'category' => 'security', 'severity' => 'high', 'desc' => 'Legacy authentication protocols are not blocked', 'remediation' => 'Create a CA policy to block legacy authentication'],
        ];

        foreach ($tenants as $tenant) {
            // Each tenant gets a subset of findings
            $numFindings = match ($tenant->primary_domain) {
                'litware.io' => 8,
                'fabrikam.com' => 6,
                'northwindtraders.com' => 4,
                'adventureworks.co.nz' => 4,
                'contoso.com' => 3,
                'proseware.com' => 2,
                'woodgrovebank.com' => 2,
                default => 3,
            };

            $selected = array_rand($findingTemplates, min($numFindings, count($findingTemplates)));
            if (!is_array($selected)) $selected = [$selected];

            foreach ($selected as $idx) {
                $tmpl = $findingTemplates[$idx];
                $isResolved = rand(1, 100) <= 25;

                DB::table('findings')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'rule_key' => $tmpl['rule_key'],
                    'category' => $tmpl['category'],
                    'severity' => $tmpl['severity'],
                    'status' => $isResolved ? 'resolved' : 'open',
                    'description' => $tmpl['desc'],
                    'evidence' => json_encode(['detected_at' => now()->subDays(rand(1, 30))->toISOString()]),
                    'impact' => 'May expose the tenant to security risks or compliance violations.',
                    'recommended_remediation' => $tmpl['remediation'],
                    'first_detected_at' => now()->subDays(rand(5, 60)),
                    'last_detected_at' => $isResolved ? now()->subDays(rand(2, 10)) : now()->subHours(rand(1, 48)),
                    'resolved_at' => $isResolved ? now()->subDays(rand(1, 5)) : null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Alerts ───────────────────────────────────────────────

    private function seedAlerts(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $alertTemplates = [
            ['type' => 'sync_failure', 'severity' => 'high', 'title' => 'Sync pipeline failed', 'msg' => 'The sync pipeline encountered errors during the last run.'],
            ['type' => 'gdap_expiry', 'severity' => 'critical', 'title' => 'GDAP relationship expiring soon', 'msg' => 'GDAP relationship expires in less than 30 days.'],
            ['type' => 'score_drop', 'severity' => 'medium', 'title' => 'Composite score dropped significantly', 'msg' => 'Composite score decreased by more than 5 points.'],
            ['type' => 'new_finding', 'severity' => 'high', 'title' => 'New critical finding detected', 'msg' => 'A new critical-severity finding has been detected.'],
            ['type' => 'integration_error', 'severity' => 'high', 'title' => 'Integration health check failed', 'msg' => 'One or more integrations reported errors during validation.'],
            ['type' => 'risky_user', 'severity' => 'critical', 'title' => 'Confirmed compromised user detected', 'msg' => 'A user has been flagged as confirmed compromised by Entra.'],
            ['type' => 'compliance_drop', 'severity' => 'medium', 'title' => 'Device compliance rate dropped', 'msg' => 'Device compliance rate has fallen below the threshold.'],
            ['type' => 'license_waste', 'severity' => 'info', 'title' => 'License utilization report ready', 'msg' => 'Monthly license utilization report is available for review.'],
        ];

        foreach ($tenants as $tenant) {
            $numAlerts = rand(2, 5);
            $selectedAlerts = array_rand($alertTemplates, $numAlerts);
            if (!is_array($selectedAlerts)) $selectedAlerts = [$selectedAlerts];

            foreach ($selectedAlerts as $idx) {
                $tmpl = $alertTemplates[$idx];
                $status = collect(['open', 'open', 'open', 'acknowledged', 'dismissed'])->random();

                DB::table('alerts')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'type' => $tmpl['type'],
                    'severity' => $tmpl['severity'],
                    'title' => $tmpl['title'],
                    'message' => $tmpl['msg'],
                    'status' => $status,
                    'acknowledged_by' => $status === 'acknowledged' ? 'Sarah Chen' : null,
                    'acknowledged_at' => $status === 'acknowledged' ? now()->subHours(rand(1, 48)) : null,
                    'created_at' => now()->subDays(rand(0, 14)),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Sync Runs ────────────────────────────────────────────

    private function seedSyncRuns(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('last_sync_at', '!=', null)
            ->get();

        $jobs = [
            'SyncTenantUsersJob', 'SyncTenantDevicesJob', 'SyncTenantLicensingJob',
            'SyncTenantHealthJob', 'SyncTenantRiskyUsersJob', 'SyncTenantConditionalAccessJob',
            'SyncTenantSecureScoreJob', 'SyncTenantServiceHealthEventsJob',
            'CalculateTenantScoreJob', 'GenerateFindingsJob',
        ];

        foreach ($tenants as $tenant) {
            // 3 sync batches per tenant
            for ($batch = 0; $batch < 3; $batch++) {
                $batchStart = now()->subHours(rand(1, 72));

                foreach ($jobs as $jobIdx => $job) {
                    $started = (clone $batchStart)->addSeconds($jobIdx * rand(5, 15));
                    $duration = rand(2, 30);
                    $failed = rand(1, 100) <= 5; // 5% failure rate

                    DB::table('sync_runs')->insert([
                        'tenant_id' => $tenant->tenant_id,
                        'sync_job' => $job,
                        'status' => $failed ? 'failed' : 'completed',
                        'records_processed' => $failed ? 0 : rand(5, 250),
                        'started_at' => $started,
                        'finished_at' => (clone $started)->addSeconds($duration),
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    // ─── Recommendations ──────────────────────────────────────

    private function seedRecommendations(): void
    {
        $findings = DB::table('findings')->where('status', 'open')->get();

        // Finding-linked recommendations
        foreach ($findings as $finding) {
            $priority = match ($finding->severity) {
                'critical' => 'critical',
                'high' => 'high',
                'medium' => 'medium',
                default => 'low',
            };

            $statusRoll = rand(1, 100);
            $status = $statusRoll <= 50 ? 'open' : ($statusRoll <= 75 ? 'in_progress' : 'resolved');

            DB::table('recommendations')->insert([
                'tenant_id' => $finding->tenant_id,
                'finding_id' => $finding->id,
                'priority' => $priority,
                'title' => 'Remediate: ' . str_replace('_', ' ', $finding->rule_key),
                'description' => $finding->recommended_remediation,
                'action_url' => 'https://admin.microsoft.com',
                'status' => $status,
                'created_at' => now()->subDays(rand(0, 14)),
                'updated_at' => now(),
            ]);
        }

        // Standalone recommendations (not linked to specific findings)
        $standaloneRecs = [
            ['priority' => 'high', 'title' => 'Enable Security Defaults for tenants without Conditional Access', 'description' => 'Tenants without P1 licensing should enable Security Defaults as a baseline MFA policy. This provides basic protection at no additional cost.', 'url' => 'https://entra.microsoft.com/#view/Microsoft_AAD_IAM/SecurityDefaultsBlade'],
            ['priority' => 'medium', 'title' => 'Review and update GDAP role assignments', 'description' => 'Audit current GDAP role assignments to ensure least-privilege access. Remove unnecessary Global Admin roles and replace with specific admin roles.', 'url' => 'https://partner.microsoft.com/dashboard/commerce2/granularadminaccess/list'],
            ['priority' => 'critical', 'title' => 'Deploy Conditional Access policy for risky sign-ins', 'description' => 'Create a CA policy requiring MFA or blocking access for high-risk sign-ins detected by Entra Identity Protection.', 'url' => 'https://entra.microsoft.com/#view/Microsoft_AAD_ConditionalAccess/ConditionalAccessBlade/~/Policies'],
            ['priority' => 'low', 'title' => 'Configure automated license reclamation', 'description' => 'Set up automated workflows to reclaim licenses from users inactive for 90+ days, reducing license waste and associated costs.', 'url' => 'https://admin.microsoft.com/Adminportal/Home#/licenses'],
            ['priority' => 'medium', 'title' => 'Enable unified audit logging across all tenants', 'description' => 'Ensure unified audit logging is enabled in all customer tenants for compliance and incident investigation readiness.', 'url' => 'https://compliance.microsoft.com/auditlogsearch'],
            ['priority' => 'high', 'title' => 'Implement data loss prevention policies', 'description' => 'Deploy DLP policies to detect and prevent sharing of sensitive information such as credit card numbers, SSNs, and health records.', 'url' => 'https://compliance.microsoft.com/datalossprevention'],
            ['priority' => 'medium', 'title' => 'Configure sensitivity labels for Microsoft 365', 'description' => 'Publish sensitivity labels and auto-labeling policies to classify and protect documents containing sensitive data.', 'url' => 'https://compliance.microsoft.com/informationprotection'],
            ['priority' => 'low', 'title' => 'Schedule quarterly access reviews', 'description' => 'Implement recurring access reviews for privileged roles and guest accounts to maintain least-privilege access and compliance.', 'url' => 'https://entra.microsoft.com/#view/Microsoft_AAD_ERM/DashboardBlade/~/Controls/fromNav/Identity'],
        ];

        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->pluck('tenant_id')
            ->toArray();

        foreach ($standaloneRecs as $rec) {
            // Assign to 2-4 random tenants
            $assignCount = rand(2, min(4, count($tenants)));
            $selectedTenants = array_rand(array_flip($tenants), $assignCount);
            if (!is_array($selectedTenants)) {
                $selectedTenants = [$selectedTenants];
            }

            foreach ($selectedTenants as $tenantId) {
                $statusRoll = rand(1, 100);
                $status = $statusRoll <= 50 ? 'open' : ($statusRoll <= 75 ? 'in_progress' : 'resolved');

                DB::table('recommendations')->insert([
                    'tenant_id' => $tenantId,
                    'finding_id' => null,
                    'priority' => $rec['priority'],
                    'title' => $rec['title'],
                    'description' => $rec['description'],
                    'action_url' => $rec['url'],
                    'status' => $status,
                    'created_at' => now()->subDays(rand(0, 30)),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Compliance ──────────────────────────────────────────

    private function seedCompliance(): void
    {
        // Insert 3 compliance frameworks
        $frameworkCis = DB::table('compliance_frameworks')->insertGetId([
            'name' => 'CIS Microsoft 365 Benchmarks',
            'slug' => 'cis-microsoft-365',
            'version' => 'v3.1',
            'description' => 'Center for Internet Security benchmarks for Microsoft 365 configuration.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $frameworkNist = DB::table('compliance_frameworks')->insertGetId([
            'name' => 'NIST Cybersecurity Framework',
            'slug' => 'nist-csf',
            'version' => 'v2.0',
            'description' => 'National Institute of Standards and Technology Cybersecurity Framework.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $frameworkNzism = DB::table('compliance_frameworks')->insertGetId([
            'name' => 'NZ Information Security Manual',
            'slug' => 'nzism',
            'version' => 'v3.7',
            'description' => 'New Zealand Government Communications Security Bureau (GCSB) Information Security Manual — mandatory security controls for NZ government and recommended for NZ businesses.',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ─── CIS Microsoft 365 Benchmarks v3.1 (15 controls) ────
        $cisControls = [
            ['control_ref' => '1.1.1', 'title' => 'Ensure MFA is enabled for all users', 'category' => 'Identity', 'rule_key' => 'mfa_coverage_below_90'],
            ['control_ref' => '1.1.3', 'title' => 'Ensure fewer than 5 Global Admins', 'category' => 'Identity', 'rule_key' => 'global_admins_above_4'],
            ['control_ref' => '1.1.6', 'title' => 'Ensure legacy authentication is blocked', 'category' => 'Identity', 'rule_key' => 'legacy_auth_not_blocked'],
            ['control_ref' => '1.1.9', 'title' => 'Ensure Conditional Access policies are configured', 'category' => 'Identity', 'rule_key' => 'conditional_access_gaps'],
            ['control_ref' => '1.1.15', 'title' => 'Ensure stale accounts are reviewed', 'category' => 'Identity', 'rule_key' => 'stale_users_detected'],
            ['control_ref' => '2.1.1', 'title' => 'Ensure Secure Score is above 50%', 'category' => 'Security', 'rule_key' => 'secure_score_below_50_percent'],
            ['control_ref' => '3.1.1', 'title' => 'Ensure device compliance is enforced', 'category' => 'Devices', 'rule_key' => 'device_compliance_below_90'],
            ['control_ref' => '5.1.1', 'title' => 'Ensure license utilization is monitored', 'category' => 'Licensing', 'rule_key' => 'license_waste_above_10_percent'],
            ['control_ref' => '5.2.1', 'title' => 'Ensure GDAP relationships are current', 'category' => 'Governance', 'rule_key' => 'gdap_expiry_approaching'],
            ['control_ref' => '1.2.1', 'title' => 'Ensure sign-in risk policy is configured', 'category' => 'Identity', 'rule_key' => null],
            ['control_ref' => '2.2.1', 'title' => 'Ensure audit logging is enabled', 'category' => 'Security', 'rule_key' => null],
            ['control_ref' => '3.2.1', 'title' => 'Ensure BitLocker is enforced', 'category' => 'Devices', 'rule_key' => null],
            ['control_ref' => '4.1.1', 'title' => 'Ensure DLP policies are defined', 'category' => 'Data Protection', 'rule_key' => null],
            ['control_ref' => '4.2.1', 'title' => 'Ensure sensitivity labels are published', 'category' => 'Data Protection', 'rule_key' => null],
            ['control_ref' => '5.3.1', 'title' => 'Ensure Partner Center alerts are monitored', 'category' => 'Governance', 'rule_key' => null],
        ];

        foreach ($cisControls as $control) {
            $controlId = DB::table('compliance_controls')->insertGetId([
                'framework_id' => $frameworkCis,
                'control_ref' => $control['control_ref'],
                'title' => $control['title'],
                'category' => $control['category'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($control['rule_key']) {
                DB::table('compliance_control_mappings')->insert([
                    'control_id' => $controlId,
                    'finding_rule_key' => $control['rule_key'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // ─── NIST CSF v2.0 (12 controls) ────────────────────────
        $nistControls = [
            ['control_ref' => 'PR.AA-01', 'title' => 'Identities and credentials are managed', 'category' => 'Protect', 'rule_key' => 'mfa_coverage_below_90'],
            ['control_ref' => 'PR.AA-02', 'title' => 'Authentication mechanisms are protected', 'category' => 'Protect', 'rule_key' => 'legacy_auth_not_blocked'],
            ['control_ref' => 'PR.AA-03', 'title' => 'Privileged access is managed', 'category' => 'Protect', 'rule_key' => 'global_admins_above_4'],
            ['control_ref' => 'PR.AA-05', 'title' => 'Access policies are enforced', 'category' => 'Protect', 'rule_key' => 'conditional_access_gaps'],
            ['control_ref' => 'PR.PS-01', 'title' => 'Configuration baselines are maintained', 'category' => 'Protect', 'rule_key' => 'device_compliance_below_90'],
            ['control_ref' => 'ID.AM-02', 'title' => 'Software and assets are inventoried', 'category' => 'Identify', 'rule_key' => 'license_waste_above_10_percent'],
            ['control_ref' => 'ID.RA-01', 'title' => 'Risk assessments are performed', 'category' => 'Identify', 'rule_key' => 'secure_score_below_50_percent'],
            ['control_ref' => 'DE.AE-02', 'title' => 'Anomalous behavior is detected', 'category' => 'Detect', 'rule_key' => 'risky_users_active'],
            ['control_ref' => 'GV.SC-04', 'title' => 'Supply chain risk is managed', 'category' => 'Govern', 'rule_key' => 'gdap_expiry_approaching'],
            ['control_ref' => 'DE.CM-01', 'title' => 'Networks and environments are monitored', 'category' => 'Detect', 'rule_key' => null],
            ['control_ref' => 'RS.AN-01', 'title' => 'Incidents are analyzed', 'category' => 'Respond', 'rule_key' => null],
            ['control_ref' => 'RC.RP-01', 'title' => 'Recovery plans are executed', 'category' => 'Recover', 'rule_key' => null],
        ];

        foreach ($nistControls as $control) {
            $controlId = DB::table('compliance_controls')->insertGetId([
                'framework_id' => $frameworkNist,
                'control_ref' => $control['control_ref'],
                'title' => $control['title'],
                'category' => $control['category'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            if ($control['rule_key']) {
                DB::table('compliance_control_mappings')->insert([
                    'control_id' => $controlId,
                    'finding_rule_key' => $control['rule_key'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        // ─── NZISM v3.7 (10 controls) ─────────────────────────
        // NZ Information Security Manual — GCSB mandatory controls
        // Some controls map to multiple rule_keys
        $nzismControls = [
            ['control_ref' => 'NZISM-11.1', 'title' => 'Multi-factor Authentication for All Users', 'category' => 'Access Control', 'rule_keys' => ['mfa_coverage_below_90']],
            ['control_ref' => 'NZISM-11.2', 'title' => 'Privileged Access Management', 'category' => 'Access Control', 'rule_keys' => ['global_admins_above_4', 'stale_users_detected']],
            ['control_ref' => 'NZISM-11.3', 'title' => 'Legacy Authentication Protocol Restrictions', 'category' => 'Access Control', 'rule_keys' => ['legacy_auth_not_blocked']],
            ['control_ref' => 'NZISM-11.4', 'title' => 'Conditional Access Policy Enforcement', 'category' => 'Access Control', 'rule_keys' => ['conditional_access_gaps']],
            ['control_ref' => 'NZISM-16.1', 'title' => 'Endpoint Patch and Compliance Management', 'category' => 'Software Security', 'rule_keys' => ['device_compliance_below_90']],
            ['control_ref' => 'NZISM-5.1', 'title' => 'Continuous Security Monitoring', 'category' => 'Information Security Monitoring', 'rule_keys' => ['secure_score_below_50_percent']],
            ['control_ref' => 'NZISM-5.2', 'title' => 'Anomalous Activity Detection and Response', 'category' => 'Information Security Monitoring', 'rule_keys' => ['risky_users_active']],
            ['control_ref' => 'NZISM-2.1', 'title' => 'Information Asset and License Management', 'category' => 'Information Security Governance', 'rule_keys' => ['license_waste_above_10_percent']],
            ['control_ref' => 'NZISM-19.1', 'title' => 'Third-Party and Supply Chain Security', 'category' => 'Gateway Security', 'rule_keys' => ['gdap_expiry_approaching']],
            ['control_ref' => 'NZISM-12.1', 'title' => 'Cryptographic Controls and Key Management', 'category' => 'Cryptography', 'rule_keys' => []],
        ];

        foreach ($nzismControls as $control) {
            $controlId = DB::table('compliance_controls')->insertGetId([
                'framework_id' => $frameworkNzism,
                'control_ref' => $control['control_ref'],
                'title' => $control['title'],
                'category' => $control['category'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($control['rule_keys'] as $ruleKey) {
                DB::table('compliance_control_mappings')->insert([
                    'control_id' => $controlId,
                    'finding_rule_key' => $ruleKey,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Copilot Usage ───────────────────────────────────────

    private function seedCopilotUsage(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Logan', 'Mia', 'Lucas', 'Charlotte', 'Alexander', 'Amelia', 'Henry', 'Harper', 'Daniel', 'Ella', 'Michael', 'Grace', 'James', 'Lily', 'Benjamin', 'Chloe', 'William', 'Zoey', 'David', 'Aria', 'Jack', 'Riley', 'Owen', 'Nora', 'Samuel', 'Layla', 'Ryan'];
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson'];

        foreach ($tenants as $tenant) {
            $userCount = rand(20, 30);
            $licenseRate = $tenant->primary_domain === 'litware.io' ? 0.30 : 0.60;

            // Reserve slots for specific patterns
            $neverUsedCount = rand(3, 5);
            $inactiveCount = rand(2, 3);
            $powerUserCount = rand(3, 5);
            $specialSlots = $neverUsedCount + $inactiveCount + $powerUserCount;
            $userCount = max($userCount, $specialSlots + 5); // ensure room for regular users too

            $rows = [];
            $usedUpns = [];

            $makeUpn = function () use ($firstNames, $lastNames, $tenant, &$usedUpns) {
                do {
                    $first = $firstNames[array_rand($firstNames)];
                    $last = $lastNames[array_rand($lastNames)];
                    $upn = strtolower("{$first}.{$last}") . rand(1, 99) . '@' . $tenant->primary_domain;
                } while (in_array($upn, $usedUpns));
                $usedUpns[] = $upn;
                return ['first' => $first, 'last' => $last, 'upn' => $upn];
            };

            // Pattern 1: Licensed but NEVER used (all activity null)
            for ($i = 0; $i < $neverUsedCount; $i++) {
                $u = $makeUpn();
                $rows[] = [
                    'tenant_id' => $tenant->tenant_id,
                    'user_principal_name' => $u['upn'],
                    'display_name' => "{$u['first']} {$u['last']}",
                    'last_activity_date' => null,
                    'last_activity_teams' => null,
                    'last_activity_word' => null,
                    'last_activity_excel' => null,
                    'last_activity_powerpoint' => null,
                    'last_activity_outlook' => null,
                    'last_activity_onenote' => null,
                    'last_activity_copilot_chat' => null,
                    'copilot_license_assigned' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Pattern 2: Licensed but inactive (last activity 45-90 days ago)
            for ($i = 0; $i < $inactiveCount; $i++) {
                $u = $makeUpn();
                $staleDays = rand(45, 90);
                $rows[] = [
                    'tenant_id' => $tenant->tenant_id,
                    'user_principal_name' => $u['upn'],
                    'display_name' => "{$u['first']} {$u['last']}",
                    'last_activity_date' => now()->subDays($staleDays)->toDateString(),
                    'last_activity_teams' => rand(1, 100) <= 50 ? now()->subDays(rand($staleDays, $staleDays + 15))->toDateString() : null,
                    'last_activity_word' => rand(1, 100) <= 30 ? now()->subDays(rand($staleDays, $staleDays + 20))->toDateString() : null,
                    'last_activity_excel' => null,
                    'last_activity_powerpoint' => null,
                    'last_activity_outlook' => rand(1, 100) <= 40 ? now()->subDays(rand($staleDays, $staleDays + 10))->toDateString() : null,
                    'last_activity_onenote' => null,
                    'last_activity_copilot_chat' => null,
                    'copilot_license_assigned' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Pattern 3: Power users (licensed, active across 5+ apps within last 30 days)
            for ($i = 0; $i < $powerUserCount; $i++) {
                $u = $makeUpn();
                $rows[] = [
                    'tenant_id' => $tenant->tenant_id,
                    'user_principal_name' => $u['upn'],
                    'display_name' => "{$u['first']} {$u['last']}",
                    'last_activity_date' => now()->subDays(rand(0, 3))->toDateString(),
                    'last_activity_teams' => now()->subDays(rand(0, 7))->toDateString(),
                    'last_activity_word' => now()->subDays(rand(0, 10))->toDateString(),
                    'last_activity_excel' => now()->subDays(rand(0, 14))->toDateString(),
                    'last_activity_powerpoint' => now()->subDays(rand(0, 14))->toDateString(),
                    'last_activity_outlook' => now()->subDays(rand(0, 5))->toDateString(),
                    'last_activity_onenote' => now()->subDays(rand(0, 20))->toDateString(),
                    'last_activity_copilot_chat' => now()->subDays(rand(0, 10))->toDateString(),
                    'copilot_license_assigned' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Remaining users: regular randomized generation
            $remainingCount = $userCount - $specialSlots;
            for ($i = 0; $i < $remainingCount; $i++) {
                $u = $makeUpn();
                $licensed = (rand(1, 100) / 100) <= $licenseRate;

                // Activity dates - only licensed users can have activity
                $hasActivity = $licensed && (rand(1, 100) > 20); // 80% of licensed users are active
                $lastActivityDate = $hasActivity ? now()->subDays(rand(0, 30))->toDateString() : null;

                // Per-app usage - randomize which apps each user uses
                $teamsDate = $hasActivity && rand(1, 100) <= 85 ? now()->subDays(rand(0, 14))->toDateString() : null;
                $outlookDate = $hasActivity && rand(1, 100) <= 75 ? now()->subDays(rand(0, 20))->toDateString() : null;
                $wordDate = $hasActivity && rand(1, 100) <= 60 ? now()->subDays(rand(0, 25))->toDateString() : null;
                $excelDate = $hasActivity && rand(1, 100) <= 50 ? now()->subDays(rand(0, 25))->toDateString() : null;
                $pptDate = $hasActivity && rand(1, 100) <= 40 ? now()->subDays(rand(0, 28))->toDateString() : null;
                $onenoteDate = $hasActivity && rand(1, 100) <= 30 ? now()->subDays(rand(0, 30))->toDateString() : null;
                $copilotChatDate = $hasActivity && rand(1, 100) <= 45 ? now()->subDays(rand(0, 20))->toDateString() : null;

                $rows[] = [
                    'tenant_id' => $tenant->tenant_id,
                    'user_principal_name' => $u['upn'],
                    'display_name' => "{$u['first']} {$u['last']}",
                    'last_activity_date' => $lastActivityDate,
                    'last_activity_teams' => $teamsDate,
                    'last_activity_word' => $wordDate,
                    'last_activity_excel' => $excelDate,
                    'last_activity_powerpoint' => $pptDate,
                    'last_activity_outlook' => $outlookDate,
                    'last_activity_onenote' => $onenoteDate,
                    'last_activity_copilot_chat' => $copilotChatDate,
                    'copilot_license_assigned' => $licensed,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            foreach (array_chunk($rows, 50) as $chunk) {
                DB::table('copilot_usage')->insert($chunk);
            }
        }
    }

    // ─── Copilot Agents ──────────────────────────────────────

    private function seedCopilotAgents(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $agentPool = [
            ['name' => 'HR Benefits Assistant', 'desc' => 'Helps employees find information about benefits, PTO policies, and HR procedures.', 'sources' => ['SharePoint:HR Policies', 'SharePoint:Employee Handbook']],
            ['name' => 'IT Helpdesk Bot', 'desc' => 'Assists with common IT support requests including password resets and software installation guides.', 'sources' => ['SharePoint:IT Knowledge Base', 'SharePoint:Software Catalog']],
            ['name' => 'Sales Proposal Generator', 'desc' => 'Generates customized sales proposals based on client requirements and product catalog.', 'sources' => ['SharePoint:Sales Resources', 'SharePoint:Product Catalog', 'SharePoint:Pricing Sheets']],
            ['name' => 'Legal Document Reviewer', 'desc' => 'Reviews contracts and legal documents for standard compliance terms and flags potential issues.', 'sources' => ['SharePoint:Legal Templates', 'SharePoint:Compliance Policies']],
            ['name' => 'Project Status Summarizer', 'desc' => 'Aggregates project updates from multiple sources and generates executive summaries.', 'sources' => ['SharePoint:Project Alpha', 'SharePoint:Project Tracking']],
            ['name' => 'Customer Support Agent', 'desc' => 'Provides first-line support responses for common customer inquiries and troubleshooting.', 'sources' => ['SharePoint:Customer Portal', 'SharePoint:FAQ Database']],
            ['name' => 'Finance Report Analyst', 'desc' => 'Analyzes financial reports and provides key insights on budget variances and trends.', 'sources' => ['SharePoint:Finance Reports', 'SharePoint:Budget Tracking']],
            ['name' => 'Engineering Knowledge Base', 'desc' => 'Answers technical questions using internal engineering documentation and architecture guides.', 'sources' => ['SharePoint:Engineering Wiki', 'SharePoint:Architecture Docs']],
        ];

        $creators = ['admin@', 'sarah.chen@', 'james.wilson@', 'tom.barrett@'];

        foreach ($tenants as $tenant) {
            $agentCount = rand(2, 5);
            $selectedIndexes = array_rand($agentPool, $agentCount);
            if (!is_array($selectedIndexes)) $selectedIndexes = [$selectedIndexes];

            foreach ($selectedIndexes as $idx) {
                $agent = $agentPool[$idx];
                $isDeclarative = rand(1, 100) <= 70;
                $status = rand(1, 100) <= 85 ? 'active' : 'disabled';

                DB::table('copilot_agents')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'agent_id' => Str::uuid()->toString(),
                    'display_name' => $agent['name'],
                    'description' => $agent['desc'],
                    'agent_type' => $isDeclarative ? 'declarative' : 'custom_engine',
                    'status' => $status,
                    'created_by' => $creators[array_rand($creators)] . $tenant->primary_domain,
                    'data_sources' => json_encode($agent['sources']),
                    'last_activity_at' => $status === 'active' ? now()->subHours(rand(1, 168)) : null,
                    'interaction_count' => $status === 'active' ? rand(50, 5000) : rand(0, 50),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── SharePoint Sites ────────────────────────────────────

    private function seedSharePointSites(): void
    {
        $tenants = DB::table('managed_tenants')
            ->where('gdap_status', '!=', 'pending')
            ->get();

        $sitePool = [
            ['name' => 'Company Intranet', 'template' => 'SITEPAGEPUBLISHING#0', 'path' => '/sites/intranet'],
            ['name' => 'HR Portal', 'template' => 'SITEPAGEPUBLISHING#0', 'path' => '/sites/hr'],
            ['name' => 'Engineering Wiki', 'template' => 'STS#3', 'path' => '/sites/engineering'],
            ['name' => 'Sales Resources', 'template' => 'STS#3', 'path' => '/sites/sales'],
            ['name' => 'Executive Dashboard', 'template' => 'SITEPAGEPUBLISHING#0', 'path' => '/sites/executive'],
            ['name' => 'Legal Documents', 'template' => 'STS#3', 'path' => '/sites/legal'],
            ['name' => 'Marketing Hub', 'template' => 'SITEPAGEPUBLISHING#0', 'path' => '/sites/marketing'],
            ['name' => 'Finance Reports', 'template' => 'STS#3', 'path' => '/sites/finance'],
            ['name' => 'IT Knowledge Base', 'template' => 'STS#3', 'path' => '/sites/it-kb'],
            ['name' => 'Project Alpha', 'template' => 'STS#3', 'path' => '/sites/project-alpha'],
            ['name' => 'Customer Portal', 'template' => 'SITEPAGEPUBLISHING#0', 'path' => '/sites/customer-portal'],
            ['name' => 'Training Materials', 'template' => 'STS#3', 'path' => '/sites/training'],
            ['name' => 'All Company', 'template' => 'SITEPAGEPUBLISHING#0', 'path' => '/sites/all-company'],
            ['name' => 'Product Development', 'template' => 'STS#3', 'path' => '/sites/product-dev'],
            ['name' => 'Shared Documents', 'template' => 'STS#3', 'path' => '/sites/shared-docs'],
        ];

        $sensitivityLabels = ['Confidential', 'Internal', 'Public', 'Highly Confidential', null, null, null, null];
        $sharingOptions = ['org', 'org', 'org', 'existing', 'existing', 'anyone', 'disabled'];

        $ownerNames = ['Sarah Chen', 'James Wilson', 'Tom Barrett', 'Emily Parker', 'Mark Stevens', 'Lisa Rodriguez'];

        foreach ($tenants as $tenant) {
            $siteCount = rand(8, 15);
            $selectedIndexes = array_rand($sitePool, $siteCount);
            if (!is_array($selectedIndexes)) $selectedIndexes = [$selectedIndexes];

            $anyoneCount = 0;

            foreach ($selectedIndexes as $idx) {
                $site = $sitePool[$idx];
                $domain = str_replace('.', '-', $tenant->primary_domain);
                $siteUrl = "https://{$domain}.sharepoint.com{$site['path']}";

                // Control external sharing - ensure 2-3 "anyone" sites per tenant
                $sharing = $sharingOptions[array_rand($sharingOptions)];
                if ($anyoneCount >= 3) {
                    $sharing = collect(['org', 'existing', 'disabled'])->random();
                }
                if ($sharing === 'anyone') $anyoneCount++;

                $isPublic = rand(1, 100) <= 20;
                $hasGuest = rand(1, 100) <= 15;
                $label = $sensitivityLabels[array_rand($sensitivityLabels)];

                $storageUsed = rand(100, 50000) * 1024 * 1024; // 100MB to ~50GB
                $storageAllocated = $storageUsed + rand(1000, 50000) * 1024 * 1024;
                $fileCount = rand(50, 10000);
                $activeFiles = (int) round($fileCount * (rand(10, 60) / 100));

                $permissionedUsers = $sharing === 'anyone'
                    ? rand(200, 500)
                    : rand(5, 150);

                $ownerName = $ownerNames[array_rand($ownerNames)];
                $ownerEmail = strtolower(str_replace(' ', '.', $ownerName)) . '@' . $tenant->primary_domain;

                DB::table('sharepoint_sites')->insert([
                    'tenant_id' => $tenant->tenant_id,
                    'site_id' => Str::uuid()->toString(),
                    'site_url' => $siteUrl,
                    'display_name' => $site['name'],
                    'storage_used_bytes' => $storageUsed,
                    'storage_allocated_bytes' => $storageAllocated,
                    'file_count' => $fileCount,
                    'active_file_count' => $activeFiles,
                    'last_activity_date' => now()->subDays(rand(0, 30))->toDateString(),
                    'page_view_count' => rand(10, 50000),
                    'external_sharing' => $sharing,
                    'is_public' => $isPublic,
                    'owner_name' => $ownerName,
                    'owner_email' => $ownerEmail,
                    'sensitivity_label' => $label,
                    'site_template' => $site['template'],
                    'has_guest_access' => $hasGuest,
                    'permissioned_user_count' => $permissionedUsers,
                    'restricted_content_discovery' => rand(1, 100) <= 10,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    // ─── Copilot Readiness ───────────────────────────────────

    private function seedCopilotReadiness(): void
    {
        $profiles = [
            'a1b2c3d4-1111-4000-8000-000000000001' => [ // Contoso - good (82)
                'overall_score' => 82.00,
                'data_exposure_score' => 78.50,
                'access_governance_score' => 85.00,
                'data_protection_score' => 80.00,
                'ai_governance_score' => 84.50,
                'copilot_licensed_users' => 52,
                'copilot_active_users' => 41,
                'sites_with_everyone_access' => 3,
                'sites_with_external_sharing' => 4,
                'sites_with_guest_access' => 2,
                'public_sites_count' => 2,
                'sensitivity_labels_count' => 4,
                'sensitivity_labels_applied_pct' => 72.00,
                'm365_apps_on_current_channel_pct' => 88.00,
            ],
            'a1b2c3d4-2222-4000-8000-000000000002' => [ // Northwind - decent (68)
                'overall_score' => 68.00,
                'data_exposure_score' => 62.00,
                'access_governance_score' => 70.50,
                'data_protection_score' => 65.00,
                'ai_governance_score' => 74.50,
                'copilot_licensed_users' => 25,
                'copilot_active_users' => 16,
                'sites_with_everyone_access' => 5,
                'sites_with_external_sharing' => 6,
                'sites_with_guest_access' => 3,
                'public_sites_count' => 4,
                'sensitivity_labels_count' => 3,
                'sensitivity_labels_applied_pct' => 48.00,
                'm365_apps_on_current_channel_pct' => 72.00,
            ],
            'a1b2c3d4-3333-4000-8000-000000000003' => [ // Adventure Works - decent (75)
                'overall_score' => 75.00,
                'data_exposure_score' => 72.00,
                'access_governance_score' => 78.00,
                'data_protection_score' => 74.50,
                'ai_governance_score' => 76.00,
                'copilot_licensed_users' => 70,
                'copilot_active_users' => 55,
                'sites_with_everyone_access' => 4,
                'sites_with_external_sharing' => 5,
                'sites_with_guest_access' => 2,
                'public_sites_count' => 3,
                'sensitivity_labels_count' => 4,
                'sensitivity_labels_applied_pct' => 65.00,
                'm365_apps_on_current_channel_pct' => 80.00,
            ],
            'a1b2c3d4-4444-4000-8000-000000000004' => [ // Fabrikam - poor (45)
                'overall_score' => 45.00,
                'data_exposure_score' => 38.00,
                'access_governance_score' => 42.50,
                'data_protection_score' => 50.00,
                'ai_governance_score' => 49.50,
                'copilot_licensed_users' => 30,
                'copilot_active_users' => 12,
                'sites_with_everyone_access' => 8,
                'sites_with_external_sharing' => 10,
                'sites_with_guest_access' => 6,
                'public_sites_count' => 7,
                'sensitivity_labels_count' => 2,
                'sensitivity_labels_applied_pct' => 22.00,
                'm365_apps_on_current_channel_pct' => 55.00,
            ],
            'a1b2c3d4-5555-4000-8000-000000000005' => [ // Woodgrove Bank - excellent (91)
                'overall_score' => 91.00,
                'data_exposure_score' => 92.50,
                'access_governance_score' => 94.00,
                'data_protection_score' => 88.00,
                'ai_governance_score' => 90.00,
                'copilot_licensed_users' => 120,
                'copilot_active_users' => 105,
                'sites_with_everyone_access' => 0,
                'sites_with_external_sharing' => 1,
                'sites_with_guest_access' => 1,
                'public_sites_count' => 0,
                'sensitivity_labels_count' => 5,
                'sensitivity_labels_applied_pct' => 95.00,
                'm365_apps_on_current_channel_pct' => 96.00,
            ],
            'a1b2c3d4-6666-4000-8000-000000000006' => [ // Litware - terrible (28)
                'overall_score' => 28.00,
                'data_exposure_score' => 22.00,
                'access_governance_score' => 25.00,
                'data_protection_score' => 30.00,
                'ai_governance_score' => 35.00,
                'copilot_licensed_users' => 8,
                'copilot_active_users' => 2,
                'sites_with_everyone_access' => 10,
                'sites_with_external_sharing' => 12,
                'sites_with_guest_access' => 8,
                'public_sites_count' => 9,
                'sensitivity_labels_count' => 1,
                'sensitivity_labels_applied_pct' => 8.00,
                'm365_apps_on_current_channel_pct' => 35.00,
            ],
            'a1b2c3d4-8888-4000-8000-000000000008' => [ // Proseware - very good (85)
                'overall_score' => 85.00,
                'data_exposure_score' => 83.00,
                'access_governance_score' => 88.00,
                'data_protection_score' => 84.00,
                'ai_governance_score' => 85.00,
                'copilot_licensed_users' => 95,
                'copilot_active_users' => 82,
                'sites_with_everyone_access' => 1,
                'sites_with_external_sharing' => 3,
                'sites_with_guest_access' => 2,
                'public_sites_count' => 1,
                'sensitivity_labels_count' => 5,
                'sensitivity_labels_applied_pct' => 82.00,
                'm365_apps_on_current_channel_pct' => 92.00,
            ],
        ];

        $dataPoints = 12;

        foreach ($profiles as $tenantId => $current) {
            // How much worse they were 90 days ago
            $startDelta = rand(15, 25);

            for ($i = 0; $i < $dataPoints; $i++) {
                // Calculate date: spread evenly over 90 days
                $daysAgo = (int) round(90 - ($i * (90 / ($dataPoints - 1))));
                $progress = $i / ($dataPoints - 1); // 0.0 → 1.0

                // Interpolate scores from start to current with noise
                $scores = [];
                foreach (['overall_score', 'data_exposure_score', 'access_governance_score', 'data_protection_score', 'ai_governance_score'] as $key) {
                    $start = max(0, $current[$key] - $startDelta + rand(-3, 3));
                    $value = $start + ($current[$key] - $start) * $progress + (rand(-20, 20) / 10);
                    $scores[$key] = round(max(0, min(100, $value)), 2);
                }

                DB::table('copilot_readiness')->insert(array_merge($scores, [
                    'tenant_id' => $tenantId,
                    'copilot_licensed_users' => $current['copilot_licensed_users'],
                    'copilot_active_users' => $current['copilot_active_users'],
                    'sites_with_everyone_access' => $current['sites_with_everyone_access'],
                    'sites_with_external_sharing' => $current['sites_with_external_sharing'],
                    'sites_with_guest_access' => $current['sites_with_guest_access'],
                    'public_sites_count' => $current['public_sites_count'],
                    'sensitivity_labels_count' => $current['sensitivity_labels_count'],
                    'sensitivity_labels_applied_pct' => $current['sensitivity_labels_applied_pct'],
                    'm365_apps_on_current_channel_pct' => $current['m365_apps_on_current_channel_pct'],
                    'calculated_at' => now()->subDays($daysAgo),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]));
            }
        }
    }

    // ─── Authentication Method Stats ─────────────────────────

    private function seedAuthMethodStats(): void
    {
        $stats = [
            'a1b2c3d4-1111-4000-8000-000000000001' => [ // Contoso - 85 users
                'total_users' => 85,
                'mfa_capable_users' => 72,
                'authenticator_app_count' => 55,
                'fido2_count' => 8,
                'windows_hello_count' => 15,
                'phone_sms_count' => 35,
                'phone_call_count' => 12,
                'email_otp_count' => 20,
                'password_only_count' => 13,
                'passwordless_count' => 23,
                'sspr_capable_count' => 65,
                'sspr_registered_count' => 58,
            ],
            'a1b2c3d4-2222-4000-8000-000000000002' => [ // Northwind - 42 users
                'total_users' => 42,
                'mfa_capable_users' => 30,
                'authenticator_app_count' => 22,
                'fido2_count' => 2,
                'windows_hello_count' => 6,
                'phone_sms_count' => 18,
                'phone_call_count' => 5,
                'email_otp_count' => 10,
                'password_only_count' => 12,
                'passwordless_count' => 8,
                'sspr_capable_count' => 28,
                'sspr_registered_count' => 22,
            ],
            'a1b2c3d4-3333-4000-8000-000000000003' => [ // Adventure Works - 120 users
                'total_users' => 120,
                'mfa_capable_users' => 102,
                'authenticator_app_count' => 80,
                'fido2_count' => 15,
                'windows_hello_count' => 30,
                'phone_sms_count' => 50,
                'phone_call_count' => 18,
                'email_otp_count' => 28,
                'password_only_count' => 18,
                'passwordless_count' => 45,
                'sspr_capable_count' => 95,
                'sspr_registered_count' => 88,
            ],
            'a1b2c3d4-4444-4000-8000-000000000004' => [ // Fabrikam - 55 users
                'total_users' => 55,
                'mfa_capable_users' => 35,
                'authenticator_app_count' => 25,
                'fido2_count' => 3,
                'windows_hello_count' => 8,
                'phone_sms_count' => 20,
                'phone_call_count' => 7,
                'email_otp_count' => 12,
                'password_only_count' => 20,
                'passwordless_count' => 11,
                'sspr_capable_count' => 30,
                'sspr_registered_count' => 24,
            ],
            'a1b2c3d4-5555-4000-8000-000000000005' => [ // Woodgrove Bank - 200 users
                'total_users' => 200,
                'mfa_capable_users' => 196,
                'authenticator_app_count' => 170,
                'fido2_count' => 45,
                'windows_hello_count' => 80,
                'phone_sms_count' => 60,
                'phone_call_count' => 25,
                'email_otp_count' => 40,
                'password_only_count' => 4,
                'passwordless_count' => 125,
                'sspr_capable_count' => 195,
                'sspr_registered_count' => 192,
            ],
            'a1b2c3d4-6666-4000-8000-000000000006' => [ // Litware - 28 users
                'total_users' => 28,
                'mfa_capable_users' => 14,
                'authenticator_app_count' => 10,
                'fido2_count' => 0,
                'windows_hello_count' => 2,
                'phone_sms_count' => 8,
                'phone_call_count' => 3,
                'email_otp_count' => 5,
                'password_only_count' => 14,
                'passwordless_count' => 2,
                'sspr_capable_count' => 12,
                'sspr_registered_count' => 8,
            ],
            'a1b2c3d4-7777-4000-8000-000000000007' => [ // Tailspin Toys - 65 users (pending tenant)
                'total_users' => 65,
                'mfa_capable_users' => 48,
                'authenticator_app_count' => 35,
                'fido2_count' => 5,
                'windows_hello_count' => 12,
                'phone_sms_count' => 28,
                'phone_call_count' => 9,
                'email_otp_count' => 15,
                'password_only_count' => 17,
                'passwordless_count' => 17,
                'sspr_capable_count' => 40,
                'sspr_registered_count' => 34,
            ],
            'a1b2c3d4-8888-4000-8000-000000000008' => [ // Proseware - 150 users
                'total_users' => 150,
                'mfa_capable_users' => 140,
                'authenticator_app_count' => 115,
                'fido2_count' => 25,
                'windows_hello_count' => 45,
                'phone_sms_count' => 55,
                'phone_call_count' => 20,
                'email_otp_count' => 32,
                'password_only_count' => 10,
                'passwordless_count' => 70,
                'sspr_capable_count' => 130,
                'sspr_registered_count' => 122,
            ],
        ];

        foreach ($stats as $tenantId => $data) {
            DB::table('authentication_method_stats')->insert(array_merge($data, [
                'tenant_id' => $tenantId,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    // ─── Directory Role Assignments ──────────────────────────

    private function seedDirectoryRoleAssignments(): void
    {
        $roles = [
            ['id' => '62e90394-69f5-4237-9190-012177145e10', 'name' => 'Global Administrator', 'max' => 3],
            ['id' => 'fe930be7-5e62-47db-91af-98c3a49a38b1', 'name' => 'User Administrator', 'max' => 1],
            ['id' => '29232cdf-9323-42fd-ade2-1d097af3e4de', 'name' => 'Exchange Administrator', 'max' => 1],
            ['id' => 'f28a1f50-f6e7-4571-818b-6a12f2af6b6c', 'name' => 'SharePoint Administrator', 'max' => 1],
            ['id' => '194ae4cb-b126-40b2-bd5b-6091b380977d', 'name' => 'Security Administrator', 'max' => 1],
            ['id' => '17315797-102d-40b4-93e0-432062caca18', 'name' => 'Compliance Administrator', 'max' => 1],
            ['id' => '69091246-20e8-4a56-aa4d-066075b2a7a8', 'name' => 'Teams Administrator', 'max' => 1],
            ['id' => '729827e3-9c14-49f7-bb1b-9608f156bbb8', 'name' => 'Helpdesk Administrator', 'max' => 1],
        ];

        $tenants = [
            ['id' => 'a1b2c3d4-1111-4000-8000-000000000001', 'domain' => 'contoso.com', 'count' => 6],
            ['id' => 'a1b2c3d4-2222-4000-8000-000000000002', 'domain' => 'northwindtraders.com', 'count' => 4],
            ['id' => 'a1b2c3d4-3333-4000-8000-000000000003', 'domain' => 'adventureworks.co.nz', 'count' => 7],
            ['id' => 'a1b2c3d4-4444-4000-8000-000000000004', 'domain' => 'fabrikam.com', 'count' => 5],
            ['id' => 'a1b2c3d4-5555-4000-8000-000000000005', 'domain' => 'woodgrovebank.com', 'count' => 8],
            ['id' => 'a1b2c3d4-6666-4000-8000-000000000006', 'domain' => 'litware.io', 'count' => 3],
            ['id' => 'a1b2c3d4-7777-4000-8000-000000000007', 'domain' => 'tailspintoys.com', 'count' => 4],
            ['id' => 'a1b2c3d4-8888-4000-8000-000000000008', 'domain' => 'proseware.com', 'count' => 7],
        ];

        $firstNames = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Logan'];
        $lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

        foreach ($tenants as $tenant) {
            $selectedRoles = array_slice($roles, 0, $tenant['count']);

            foreach ($selectedRoles as $roleIdx => $role) {
                // Global Administrator gets 1-3 assignments; others get 1
                $assignmentCount = $role['name'] === 'Global Administrator' ? rand(1, 3) : 1;

                for ($a = 0; $a < $assignmentCount; $a++) {
                    $first = $firstNames[array_rand($firstNames)];
                    $last = $lastNames[array_rand($lastNames)];
                    $upn = strtolower("{$first}.{$last}") . rand(1, 99) . '@' . $tenant['domain'];

                    // Assignment type: direct (70%), group (20%), pim (10%)
                    $typeRoll = rand(1, 100);
                    $assignmentType = $typeRoll <= 70 ? 'direct' : ($typeRoll <= 90 ? 'group' : 'pim');

                    // Status: active (80%), eligible (20%)
                    $status = rand(1, 100) <= 80 ? 'active' : 'eligible';

                    $startDate = now()->subDays(rand(30, 365));

                    DB::table('directory_role_assignments')->insert([
                        'tenant_id' => $tenant['id'],
                        'user_id' => Str::uuid()->toString(),
                        'user_principal_name' => $upn,
                        'display_name' => "{$first} {$last}",
                        'role_id' => $role['id'],
                        'role_display_name' => $role['name'],
                        'assignment_type' => $assignmentType,
                        'status' => $status,
                        'start_date' => $startDate,
                        'end_date' => $status === 'eligible' ? $startDate->copy()->addDays(rand(90, 365)) : null,
                        'is_built_in_role' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }

    // ─── Guest Users ─────────────────────────────────────────

    private function seedGuestUsers(): void
    {
        $externalDomains = [
            ['domain' => 'partner.com', 'company' => 'Partner Solutions Ltd'],
            ['domain' => 'consultant.co.nz', 'company' => 'Consultant Group NZ'],
            ['domain' => 'vendor.org', 'company' => 'Vendor Services Inc'],
            ['domain' => 'supplier.net', 'company' => 'Supplier Network Corp'],
            ['domain' => 'agency.io', 'company' => 'Digital Agency Co'],
            ['domain' => 'contractor.com', 'company' => 'Contractor Professionals'],
            ['domain' => 'legal-firm.com', 'company' => 'Legal & Associates LLP'],
            ['domain' => 'accounting-co.nz', 'company' => 'Accounting Co NZ'],
        ];

        $firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Cameron', 'Dakota', 'Jamie', 'Reese', 'Skyler', 'Finley', 'Rowan', 'Blake', 'Hayden', 'Emerson', 'Phoenix', 'Sage'];
        $lastNames = ['Parker', 'Cooper', 'Reed', 'Brooks', 'Hayes', 'Griffin', 'Ward', 'Foster', 'Russell', 'Grant', 'Porter', 'Webb', 'Sullivan', 'Murphy', 'Bennett', 'Coleman', 'Perry', 'Stone', 'Murray', 'Walsh'];

        $tenants = [
            ['id' => 'a1b2c3d4-1111-4000-8000-000000000001', 'domain' => 'contoso.com', 'guest_count' => 15],
            ['id' => 'a1b2c3d4-2222-4000-8000-000000000002', 'domain' => 'northwindtraders.com', 'guest_count' => 10],
            ['id' => 'a1b2c3d4-3333-4000-8000-000000000003', 'domain' => 'adventureworks.co.nz', 'guest_count' => 22],
            ['id' => 'a1b2c3d4-4444-4000-8000-000000000004', 'domain' => 'fabrikam.com', 'guest_count' => 12],
            ['id' => 'a1b2c3d4-5555-4000-8000-000000000005', 'domain' => 'woodgrovebank.com', 'guest_count' => 25],
            ['id' => 'a1b2c3d4-6666-4000-8000-000000000006', 'domain' => 'litware.io', 'guest_count' => 8],
            ['id' => 'a1b2c3d4-7777-4000-8000-000000000007', 'domain' => 'tailspintoys.com', 'guest_count' => 11],
            ['id' => 'a1b2c3d4-8888-4000-8000-000000000008', 'domain' => 'proseware.com', 'guest_count' => 20],
        ];

        foreach ($tenants as $tenant) {
            $rows = [];

            for ($i = 0; $i < $tenant['guest_count']; $i++) {
                $first = $firstNames[array_rand($firstNames)];
                $last = $lastNames[array_rand($lastNames)];
                $ext = $externalDomains[array_rand($externalDomains)];
                $email = strtolower("{$first}.{$last}") . rand(1, 99) . '@' . $ext['domain'];
                $guestUpn = str_replace('@', '_', $email) . '#EXT#@' . $tenant['domain'];

                // external_user_state: Accepted (70%), PendingAcceptance (20%), null (10%)
                $stateRoll = rand(1, 100);
                $externalState = $stateRoll <= 70 ? 'Accepted' : ($stateRoll <= 90 ? 'PendingAcceptance' : null);

                // creation_type: Invitation (80%), DirectConnect (15%), SelfService (5%)
                $creationRoll = rand(1, 100);
                $creationType = $creationRoll <= 80 ? 'Invitation' : ($creationRoll <= 95 ? 'DirectConnect' : 'SelfService');

                // account_enabled: true (85%), false (15%)
                $enabled = rand(1, 100) <= 85;

                // last_sign_in_at: varied — some null, some recent, some stale (90+ days)
                $signInRoll = rand(1, 100);
                if ($signInRoll <= 15) {
                    $lastSignIn = null; // never signed in
                } elseif ($signInRoll <= 40) {
                    $lastSignIn = now()->subDays(rand(91, 300)); // stale
                } elseif ($signInRoll <= 70) {
                    $lastSignIn = now()->subDays(rand(1, 30)); // recent
                } else {
                    $lastSignIn = now()->subDays(rand(31, 90)); // moderate
                }

                $createdDate = now()->subDays(rand(30, 500));

                $rows[] = [
                    'tenant_id' => $tenant['id'],
                    'user_id' => Str::uuid()->toString(),
                    'display_name' => "{$first} {$last}",
                    'user_principal_name' => $guestUpn,
                    'mail' => $email,
                    'user_type' => 'Guest',
                    'external_user_state' => $externalState,
                    'creation_type' => $creationType,
                    'company_name' => $ext['company'],
                    'domain' => $ext['domain'],
                    'created_datetime' => $createdDate,
                    'last_sign_in_at' => $lastSignIn,
                    'account_enabled' => $enabled,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            foreach (array_chunk($rows, 50) as $chunk) {
                DB::table('guest_users')->insert($chunk);
            }
        }
    }

    // ─── Sign-In Summaries ───────────────────────────────────

    private function seedSignInSummaries(): void
    {
        $tenants = [
            ['id' => 'a1b2c3d4-1111-4000-8000-000000000001', 'users' => 85],
            ['id' => 'a1b2c3d4-2222-4000-8000-000000000002', 'users' => 42],
            ['id' => 'a1b2c3d4-3333-4000-8000-000000000003', 'users' => 120],
            ['id' => 'a1b2c3d4-4444-4000-8000-000000000004', 'users' => 55],
            ['id' => 'a1b2c3d4-5555-4000-8000-000000000005', 'users' => 200],
            ['id' => 'a1b2c3d4-6666-4000-8000-000000000006', 'users' => 28],
            ['id' => 'a1b2c3d4-7777-4000-8000-000000000007', 'users' => 65],
            ['id' => 'a1b2c3d4-8888-4000-8000-000000000008', 'users' => 150],
        ];

        $failureReasons = [
            'Invalid password',
            'MFA denied',
            'Account locked',
            'Expired token',
            'Conditional Access block',
            'IP blocked',
        ];

        $locations = [
            ['country' => 'New Zealand', 'city' => 'Auckland'],
            ['country' => 'New Zealand', 'city' => 'Wellington'],
            ['country' => 'New Zealand', 'city' => 'Christchurch'],
            ['country' => 'Australia', 'city' => 'Sydney'],
            ['country' => 'Australia', 'city' => 'Melbourne'],
            ['country' => 'United States', 'city' => 'New York'],
            ['country' => 'United Kingdom', 'city' => 'London'],
            ['country' => 'Singapore', 'city' => 'Singapore'],
        ];

        $apps = [
            'Microsoft Teams',
            'Microsoft Outlook',
            'SharePoint Online',
            'Microsoft 365 Portal',
            'Azure Portal',
            'Microsoft OneDrive',
            'Microsoft Word',
            'Microsoft Excel',
            'Microsoft PowerPoint',
            'Power BI',
        ];

        foreach ($tenants as $tenant) {
            $rows = [];

            for ($day = 0; $day < 30; $day++) {
                $date = Carbon::today()->subDays($day);

                // Total sign-ins proportional to user count (roughly 1-1.5x users per day)
                $baseSignIns = (int) round($tenant['users'] * (rand(90, 140) / 100));
                // Weekends have fewer sign-ins
                if ($date->isWeekend()) {
                    $baseSignIns = (int) round($baseSignIns * 0.3);
                }
                $total = max(1, $baseSignIns);

                // Success rate: 95-99%
                $successRate = rand(95, 99) / 100;
                $successful = (int) round($total * $successRate);
                $failed = $total - $successful;

                // Interactive vs non-interactive
                $interactivePct = rand(60, 70) / 100;
                $interactive = (int) round($total * $interactivePct);
                $nonInteractive = $total - $interactive;

                // MFA stats based on interactive sign-ins
                $mfaPromptedPct = rand(40, 60) / 100;
                $mfaPrompted = (int) round($interactive * $mfaPromptedPct);
                $mfaSucceeded = (int) round($mfaPrompted * 0.95);
                $mfaFailed = $mfaPrompted - $mfaSucceeded;

                // Top failure reason
                $topReason = $failureReasons[array_rand($failureReasons)];
                $topFailureCount = $failed > 0 ? (int) round($failed * (rand(30, 60) / 100)) : 0;

                // Unique users: 60-80% of total users
                $uniqueUsers = (int) round($tenant['users'] * (rand(60, 80) / 100));
                if ($date->isWeekend()) {
                    $uniqueUsers = (int) round($uniqueUsers * 0.35);
                }

                // by_location: 2-4 random locations
                $locCount = rand(2, 4);
                $selectedLocs = array_rand($locations, $locCount);
                if (!is_array($selectedLocs)) $selectedLocs = [$selectedLocs];
                $remainingForLoc = $total;
                $byLocation = [];
                foreach ($selectedLocs as $li => $locIdx) {
                    $isLast = ($li === count($selectedLocs) - 1);
                    $locCount = $isLast ? $remainingForLoc : (int) round($remainingForLoc * (rand(25, 50) / 100));
                    $locCount = max(1, $locCount);
                    $remainingForLoc -= $locCount;
                    $byLocation[] = [
                        'country' => $locations[$locIdx]['country'],
                        'city' => $locations[$locIdx]['city'],
                        'count' => $locCount,
                    ];
                }

                // by_app: 3-5 random apps
                $appCount = rand(3, 5);
                $selectedApps = array_rand(array_flip($apps), $appCount);
                $remainingForApp = $total;
                $byApp = [];
                foreach ($selectedApps as $ai => $appName) {
                    $isLast = ($ai === count($selectedApps) - 1);
                    $appCountVal = $isLast ? $remainingForApp : (int) round($remainingForApp * (rand(20, 40) / 100));
                    $appCountVal = max(1, $appCountVal);
                    $remainingForApp -= $appCountVal;
                    $byApp[] = [
                        'app_name' => $appName,
                        'count' => $appCountVal,
                    ];
                }

                $rows[] = [
                    'tenant_id' => $tenant['id'],
                    'date' => $date->toDateString(),
                    'total_sign_ins' => $total,
                    'successful_sign_ins' => $successful,
                    'failed_sign_ins' => $failed,
                    'interactive_sign_ins' => $interactive,
                    'non_interactive_sign_ins' => $nonInteractive,
                    'mfa_prompted' => $mfaPrompted,
                    'mfa_succeeded' => $mfaSucceeded,
                    'mfa_failed' => $mfaFailed,
                    'top_failure_reason' => $failed > 0 ? $topReason : null,
                    'top_failure_count' => $topFailureCount,
                    'unique_users' => $uniqueUsers,
                    'by_location' => json_encode($byLocation),
                    'by_app' => json_encode($byApp),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            foreach (array_chunk($rows, 50) as $chunk) {
                DB::table('sign_in_summaries')->insert($chunk);
            }
        }
    }
}
