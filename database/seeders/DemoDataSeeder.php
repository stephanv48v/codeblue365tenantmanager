<?php

declare(strict_types=1);

namespace Database\Seeders;

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
        $this->seedCopilotUsage();
        $this->seedCopilotAgents();
        $this->seedSharePointSites();
        $this->seedCopilotReadiness();
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

        foreach ($findings as $finding) {
            DB::table('recommendations')->insert([
                'tenant_id' => $finding->tenant_id,
                'finding_id' => $finding->id,
                'priority' => $finding->severity === 'critical' ? 'high' : ($finding->severity === 'high' ? 'high' : 'medium'),
                'title' => 'Remediate: ' . str_replace('_', ' ', $finding->rule_key),
                'description' => $finding->recommended_remediation,
                'action_url' => 'https://admin.microsoft.com',
                'status' => 'open',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
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
            $userCount = rand(15, 30);
            $licenseRate = $tenant->primary_domain === 'litware.io' ? 0.30 : 0.60;

            $rows = [];
            for ($i = 0; $i < $userCount; $i++) {
                $first = $firstNames[array_rand($firstNames)];
                $last = $lastNames[array_rand($lastNames)];
                $upn = strtolower("{$first}.{$last}") . rand(1, 99) . '@' . $tenant->primary_domain;
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
                    'user_principal_name' => $upn,
                    'display_name' => "{$first} {$last}",
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

        foreach ($profiles as $tenantId => $scores) {
            DB::table('copilot_readiness')->insert(array_merge($scores, [
                'tenant_id' => $tenantId,
                'details' => json_encode([
                    'assessment_version' => '1.0',
                    'data_sources_evaluated' => ['SharePoint', 'OneDrive', 'Exchange', 'Teams'],
                    'recommendations_count' => max(0, (int) round((100 - $scores['overall_score']) / 5)),
                ]),
                'calculated_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }
}
