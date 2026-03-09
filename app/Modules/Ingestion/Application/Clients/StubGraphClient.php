<?php

declare(strict_types=1);

namespace App\Modules\Ingestion\Application\Clients;

use App\Modules\Ingestion\Application\Contracts\GraphClient;

class StubGraphClient implements GraphClient
{
    public function fetchUsers(string $tenantId): array
    {
        return [
            [
                'id' => 'stub-user-1',
                'displayName' => 'Stub Engineer',
                'mail' => 'engineer@'.$tenantId.'.example.com',
                'userPrincipalName' => 'engineer@'.$tenantId.'.example.com',
                'accountEnabled' => true,
                'lastSignInDateTime' => now()->subDays(1)->toIso8601String(),
            ],
            [
                'id' => 'stub-user-2',
                'displayName' => 'Stub Admin',
                'mail' => 'admin@'.$tenantId.'.example.com',
                'userPrincipalName' => 'admin@'.$tenantId.'.example.com',
                'accountEnabled' => true,
                'lastSignInDateTime' => now()->subHours(3)->toIso8601String(),
            ],
        ];
    }

    public function fetchDevices(string $tenantId): array
    {
        return [
            [
                'id' => 'stub-device-1',
                'displayName' => 'DESKTOP-001',
                'operatingSystem' => 'Windows',
                'operatingSystemVersion' => '10.0.19045',
                'isCompliant' => true,
                'isManaged' => true,
                'approximateLastSignInDateTime' => now()->subDays(2)->toIso8601String(),
            ],
            [
                'id' => 'stub-device-2',
                'displayName' => 'LAPTOP-002',
                'operatingSystem' => 'Windows',
                'operatingSystemVersion' => '10.0.22631',
                'isCompliant' => false,
                'isManaged' => true,
                'approximateLastSignInDateTime' => now()->subDays(14)->toIso8601String(),
            ],
        ];
    }

    public function fetchLicenses(string $tenantId): array
    {
        return [
            [
                'skuId' => 'stub-sku-m365-bp',
                'skuPartNumber' => 'O365_BUSINESS_PREMIUM',
                'consumedUnits' => 18,
                'prepaidUnits' => ['enabled' => 25, 'suspended' => 0, 'warning' => 0],
            ],
            [
                'skuId' => 'stub-sku-aad-p2',
                'skuPartNumber' => 'AAD_PREMIUM_P2',
                'consumedUnits' => 5,
                'prepaidUnits' => ['enabled' => 10, 'suspended' => 0, 'warning' => 0],
            ],
        ];
    }

    public function fetchServiceHealth(string $tenantId): array
    {
        return [
            'services' => [
                ['service' => 'Exchange Online', 'status' => 'serviceDegradation', 'isActive' => true],
                ['service' => 'SharePoint Online', 'status' => 'serviceOperational', 'isActive' => false],
                ['service' => 'Microsoft Teams', 'status' => 'serviceOperational', 'isActive' => false],
                ['service' => 'Microsoft Intune', 'status' => 'serviceOperational', 'isActive' => false],
            ],
            'issues' => [
                [
                    'id' => 'EX123456',
                    'service' => 'Exchange Online',
                    'title' => 'Some users unable to access mailboxes',
                    'classification' => 'advisory',
                    'startDateTime' => now()->subHours(6)->toIso8601String(),
                ],
            ],
        ];
    }

    public function fetchSecureScore(string $tenantId): array
    {
        return [
            'currentScore' => 62.5,
            'maxScore' => 100,
            'enabledServices' => ['Exchange', 'SharePoint', 'Teams', 'AzureAD'],
            'controlScores' => [
                ['controlName' => 'MFARegistrationV2', 'score' => 9.0, 'maxScore' => 10.0],
                ['controlName' => 'BlockLegacyAuthentication', 'score' => 8.0, 'maxScore' => 8.0],
                ['controlName' => 'AdminMFAV2', 'score' => 7.0, 'maxScore' => 10.0],
                ['controlName' => 'SigninRiskPolicy', 'score' => 0.0, 'maxScore' => 5.0],
                ['controlName' => 'UserRiskPolicy', 'score' => 0.0, 'maxScore' => 5.0],
            ],
        ];
    }

    public function fetchRiskyUsers(string $tenantId): array
    {
        return [
            [
                'id' => 'risky-user-1',
                'userPrincipalName' => 'j.compromised@'.$tenantId.'.example.com',
                'displayName' => 'John Compromised',
                'riskLevel' => 'high',
                'riskState' => 'atRisk',
                'riskDetail' => 'anomalousToken',
                'riskLastUpdatedDateTime' => now()->subHours(2)->toIso8601String(),
            ],
            [
                'id' => 'risky-user-2',
                'userPrincipalName' => 's.suspicious@'.$tenantId.'.example.com',
                'displayName' => 'Sarah Suspicious',
                'riskLevel' => 'medium',
                'riskState' => 'atRisk',
                'riskDetail' => 'unfamiliarFeatures',
                'riskLastUpdatedDateTime' => now()->subDays(1)->toIso8601String(),
            ],
            [
                'id' => 'risky-user-3',
                'userPrincipalName' => 'b.cleared@'.$tenantId.'.example.com',
                'displayName' => 'Bob Cleared',
                'riskLevel' => 'low',
                'riskState' => 'remediated',
                'riskDetail' => 'leakedCredentials',
                'riskLastUpdatedDateTime' => now()->subDays(7)->toIso8601String(),
            ],
        ];
    }

    public function fetchConditionalAccessPolicies(string $tenantId): array
    {
        return [
            [
                'id' => 'ca-policy-1',
                'displayName' => 'Require MFA for all users',
                'state' => 'enabled',
                'conditions' => ['users' => ['includeUsers' => ['All']], 'applications' => ['includeApplications' => ['All']]],
                'grantControls' => ['builtInControls' => ['mfa'], 'operator' => 'OR'],
            ],
            [
                'id' => 'ca-policy-2',
                'displayName' => 'Block legacy authentication',
                'state' => 'enabled',
                'conditions' => ['clientAppTypes' => ['exchangeActiveSync', 'other']],
                'grantControls' => ['builtInControls' => ['block'], 'operator' => 'OR'],
            ],
            [
                'id' => 'ca-policy-3',
                'displayName' => 'Require compliant devices for Office 365',
                'state' => 'enabledForReportingButNotEnforced',
                'conditions' => ['applications' => ['includeApplications' => ['Office365']]],
                'grantControls' => ['builtInControls' => ['compliantDevice'], 'operator' => 'OR'],
            ],
            [
                'id' => 'ca-policy-4',
                'displayName' => 'Block high-risk sign-ins',
                'state' => 'disabled',
                'conditions' => ['signInRiskLevels' => ['high']],
                'grantControls' => ['builtInControls' => ['block'], 'operator' => 'OR'],
            ],
        ];
    }

    public function fetchSecureScoreHistory(string $tenantId): array
    {
        return [
            ['currentScore' => 54.2, 'maxScore' => 100, 'createdDateTime' => now()->subDays(28)->toIso8601String(), 'controlScores' => []],
            ['currentScore' => 57.8, 'maxScore' => 100, 'createdDateTime' => now()->subDays(21)->toIso8601String(), 'controlScores' => []],
            ['currentScore' => 59.1, 'maxScore' => 100, 'createdDateTime' => now()->subDays(14)->toIso8601String(), 'controlScores' => []],
            ['currentScore' => 61.3, 'maxScore' => 100, 'createdDateTime' => now()->subDays(7)->toIso8601String(), 'controlScores' => []],
            ['currentScore' => 62.5, 'maxScore' => 100, 'createdDateTime' => now()->toIso8601String(), 'controlScores' => [
                ['controlName' => 'MFARegistrationV2', 'score' => 9.0, 'maxScore' => 10.0],
                ['controlName' => 'BlockLegacyAuthentication', 'score' => 8.0, 'maxScore' => 8.0],
                ['controlName' => 'AdminMFAV2', 'score' => 7.0, 'maxScore' => 10.0],
                ['controlName' => 'SigninRiskPolicy', 'score' => 0.0, 'maxScore' => 5.0],
                ['controlName' => 'UserRiskPolicy', 'score' => 0.0, 'maxScore' => 5.0],
            ]],
        ];
    }

    public function fetchServiceHealthEvents(string $tenantId): array
    {
        return [
            [
                'id' => 'EX123456',
                'service' => 'Exchange Online',
                'title' => 'Some users unable to access mailboxes',
                'classification' => 'incident',
                'status' => 'serviceRestored',
                'startDateTime' => now()->subHours(6)->toIso8601String(),
                'endDateTime' => now()->subHours(1)->toIso8601String(),
            ],
            [
                'id' => 'SP789012',
                'service' => 'SharePoint Online',
                'title' => 'Planned maintenance: Storage migration',
                'classification' => 'advisory',
                'status' => 'resolved',
                'startDateTime' => now()->subDays(2)->toIso8601String(),
                'endDateTime' => now()->subDays(1)->toIso8601String(),
            ],
            [
                'id' => 'TM345678',
                'service' => 'Microsoft Teams',
                'title' => 'Intermittent issues with Teams calling',
                'classification' => 'incident',
                'status' => 'investigating',
                'startDateTime' => now()->subHours(1)->toIso8601String(),
                'endDateTime' => null,
            ],
        ];
    }

    public function fetchMailboxUsage(string $tenantId): array
    {
        return [
            'totalMailboxes' => 25,
            'activeMailboxes' => 22,
            'totalStorageUsedGB' => 48.7,
            'totalStorageAllocatedGB' => 1250.0,
            'averageMailboxSizeGB' => 1.95,
            'sendCount7d' => 1842,
            'receiveCount7d' => 5231,
        ];
    }

    public function fetchSharePointUsage(string $tenantId): array
    {
        return [
            'totalSites' => 15,
            'activeSites' => 12,
            'totalStorageUsedGB' => 234.5,
            'totalStorageAllocatedTB' => 1.0,
            'totalFiles' => 45820,
            'activeFiles7d' => 1247,
            'externalSharingEnabled' => 3,
        ];
    }

    public function fetchCopilotUsage(string $tenantId): array
    {
        return [];
    }

    public function fetchSharePointSites(string $tenantId): array
    {
        return [];
    }

    public function fetchDelegatedTenants(): array
    {
        return [
            [
                'tenantId' => 'aaa-111-bbb-222',
                'displayName' => 'Contoso Ltd',
                'defaultDomainName' => 'contoso.onmicrosoft.com',
                'gdapStatus' => 'active',
                'gdapExpiry' => now()->addMonths(6)->toIso8601String(),
            ],
            [
                'tenantId' => 'ccc-333-ddd-444',
                'displayName' => 'Fabrikam Inc',
                'defaultDomainName' => 'fabrikam.onmicrosoft.com',
                'gdapStatus' => 'active',
                'gdapExpiry' => now()->addMonths(3)->toIso8601String(),
            ],
            [
                'tenantId' => 'eee-555-fff-666',
                'displayName' => 'Northwind Traders',
                'defaultDomainName' => 'northwind.onmicrosoft.com',
                'gdapStatus' => 'expiring_soon',
                'gdapExpiry' => now()->addDays(15)->toIso8601String(),
            ],
            [
                'tenantId' => 'ggg-777-hhh-888',
                'displayName' => 'Adventure Works',
                'defaultDomainName' => 'adventureworks.onmicrosoft.com',
                'gdapStatus' => 'active',
                'gdapExpiry' => now()->addYear()->toIso8601String(),
            ],
            [
                'tenantId' => 'iii-999-jjj-000',
                'displayName' => 'Woodgrove Bank',
                'defaultDomainName' => 'woodgrove.onmicrosoft.com',
                'gdapStatus' => 'pending',
                'gdapExpiry' => null,
            ],
        ];
    }
}
