<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IntegrationPlaybooksSeeder extends Seeder
{
    public function run(): void
    {
        $rows = [
            [
                'slug' => 'microsoft-graph-core',
                'title' => 'Microsoft Graph Core Setup',
                'integration_slug' => 'microsoft-graph',
                'version' => '1.0.0',
                'owner' => 'Integration Admin',
                'prerequisites' => ['Entra app registration', 'GDAP relationship active'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Register app in Entra ID', 'validation' => 'Application ID present'],
                    ['order' => 2, 'instruction' => 'Grant Graph application permissions', 'validation' => 'Required scopes assigned'],
                    ['order' => 3, 'instruction' => 'Complete admin consent', 'validation' => 'Consent status is granted'],
                ],
                'permissions' => ['Directory.Read.All', 'User.Read.All'],
                'gdap_requirements' => ['Global Reader'],
                'consent_requirements' => ['Admin consent required'],
                'troubleshooting' => [
                    ['error' => 'invalid_client', 'resolution' => 'Verify client secret and app ID'],
                    ['error' => 'insufficient privileges', 'resolution' => 'Confirm required Graph scopes are granted'],
                ],
            ],
            [
                'slug' => 'secure-score-onboarding',
                'title' => 'Secure Score Onboarding',
                'integration_slug' => 'microsoft-secure-score',
                'version' => '1.0.0',
                'owner' => 'Security Admin',
                'prerequisites' => ['Microsoft Graph Core Setup completed'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Enable Secure Score API access', 'validation' => 'Secure Score endpoint returns data'],
                    ['order' => 2, 'instruction' => 'Configure scheduled sync', 'validation' => 'Daily sync job exists'],
                ],
                'permissions' => ['SecurityEvents.Read.All'],
                'gdap_requirements' => ['Security Reader'],
                'consent_requirements' => ['Admin consent required'],
                'troubleshooting' => [
                    ['error' => '403 Forbidden', 'resolution' => 'Validate role assignment and consent status'],
                ],
            ],
            [
                'slug' => 'entra-id-setup',
                'title' => 'Microsoft Entra ID Setup',
                'integration_slug' => 'entra-id',
                'version' => '1.0.0',
                'owner' => 'Integration Admin',
                'prerequisites' => ['Microsoft Graph Core Setup completed', 'GDAP relationship with Directory Reader role'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Verify GDAP relationship includes Directory Reader role', 'validation' => 'Role assignment confirmed'],
                    ['order' => 2, 'instruction' => 'Grant Directory.Read.All and User.Read.All permissions', 'validation' => 'Permissions assigned'],
                    ['order' => 3, 'instruction' => 'Test user enumeration endpoint', 'validation' => 'Users list returned successfully'],
                    ['order' => 4, 'instruction' => 'Enable scheduled user sync', 'validation' => 'Sync job configured'],
                ],
                'permissions' => ['Directory.Read.All', 'User.Read.All', 'AuditLog.Read.All'],
                'gdap_requirements' => ['Directory Reader', 'Global Reader'],
                'consent_requirements' => ['Admin consent required for Directory.Read.All'],
                'troubleshooting' => [
                    ['error' => 'Authorization_RequestDenied', 'resolution' => 'Verify GDAP roles include Directory Reader'],
                    ['error' => 'empty user list', 'resolution' => 'Check tenant has licensed users and GDAP is active'],
                ],
            ],
            [
                'slug' => 'intune-device-management',
                'title' => 'Microsoft Intune Device Management',
                'integration_slug' => 'intune',
                'version' => '1.0.0',
                'owner' => 'Integration Admin',
                'prerequisites' => ['Microsoft Graph Core Setup completed', 'Intune license active on tenant'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Grant DeviceManagementManagedDevices.Read.All permission', 'validation' => 'Permission assigned'],
                    ['order' => 2, 'instruction' => 'Verify GDAP includes Intune Administrator role', 'validation' => 'Role confirmed'],
                    ['order' => 3, 'instruction' => 'Test device enumeration endpoint', 'validation' => 'Device list returned'],
                    ['order' => 4, 'instruction' => 'Enable scheduled device sync', 'validation' => 'Sync job configured'],
                ],
                'permissions' => ['DeviceManagementManagedDevices.Read.All', 'DeviceManagementConfiguration.Read.All'],
                'gdap_requirements' => ['Intune Administrator'],
                'consent_requirements' => ['Admin consent required'],
                'troubleshooting' => [
                    ['error' => 'no devices returned', 'resolution' => 'Verify Intune is licensed and devices are enrolled'],
                    ['error' => '403 on managed devices', 'resolution' => 'Confirm Intune Administrator GDAP role'],
                ],
            ],
            [
                'slug' => 'm365-usage-reporting',
                'title' => 'M365 Usage Reporting Setup',
                'integration_slug' => 'm365-usage',
                'version' => '1.0.0',
                'owner' => 'Integration Admin',
                'prerequisites' => ['Microsoft Graph Core Setup completed'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Grant Reports.Read.All permission', 'validation' => 'Permission assigned'],
                    ['order' => 2, 'instruction' => 'Test usage report endpoint', 'validation' => 'Report data returned'],
                    ['order' => 3, 'instruction' => 'Configure reporting period (7/30/90/180 days)', 'validation' => 'Reporting period set'],
                ],
                'permissions' => ['Reports.Read.All'],
                'gdap_requirements' => ['Reports Reader'],
                'consent_requirements' => ['Admin consent required'],
                'troubleshooting' => [
                    ['error' => 'empty report', 'resolution' => 'Reports may take 48 hours to populate for new tenants'],
                    ['error' => '403 on reports', 'resolution' => 'Verify Reports Reader role in GDAP'],
                ],
            ],
            [
                'slug' => 'identity-secure-score',
                'title' => 'Identity Secure Score Setup',
                'integration_slug' => 'identity-secure-score',
                'version' => '1.0.0',
                'owner' => 'Security Admin',
                'prerequisites' => ['Microsoft Graph Core Setup completed', 'Entra ID P1 or P2 license'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Grant IdentityRiskyUser.Read.All permission', 'validation' => 'Permission assigned'],
                    ['order' => 2, 'instruction' => 'Test Identity Secure Score endpoint', 'validation' => 'Score data returned'],
                    ['order' => 3, 'instruction' => 'Enable scheduled identity score sync', 'validation' => 'Sync job configured'],
                ],
                'permissions' => ['IdentityRiskyUser.Read.All', 'SecurityEvents.Read.All'],
                'gdap_requirements' => ['Security Reader'],
                'consent_requirements' => ['Admin consent required'],
                'troubleshooting' => [
                    ['error' => 'score not available', 'resolution' => 'Verify Entra ID P1/P2 license is active'],
                    ['error' => '403 on identity score', 'resolution' => 'Confirm Security Reader GDAP role'],
                ],
            ],
            [
                'slug' => 'service-health-setup',
                'title' => 'Service Health & Message Center Setup',
                'integration_slug' => 'service-health',
                'version' => '1.0.0',
                'owner' => 'Integration Admin',
                'prerequisites' => ['Microsoft Graph Core Setup completed'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Grant ServiceHealth.Read.All permission', 'validation' => 'Permission assigned'],
                    ['order' => 2, 'instruction' => 'Test service health endpoint', 'validation' => 'Health data returned'],
                    ['order' => 3, 'instruction' => 'Configure alert notifications for service incidents', 'validation' => 'Notifications configured'],
                ],
                'permissions' => ['ServiceHealth.Read.All', 'ServiceMessage.Read.All'],
                'gdap_requirements' => ['Service Support Administrator'],
                'consent_requirements' => ['Admin consent required'],
                'troubleshooting' => [
                    ['error' => 'no health data', 'resolution' => 'Service health data requires up to 24 hours to populate'],
                    ['error' => '403 on service health', 'resolution' => 'Verify Service Support Administrator GDAP role'],
                ],
            ],
            [
                'slug' => 'license-data-connector',
                'title' => 'License Data Connector Setup',
                'integration_slug' => 'license-management',
                'version' => '1.0.0',
                'owner' => 'Integration Admin',
                'prerequisites' => ['Microsoft Graph Core Setup completed'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Grant Organization.Read.All permission', 'validation' => 'Permission assigned'],
                    ['order' => 2, 'instruction' => 'Test subscribed SKU endpoint', 'validation' => 'License data returned'],
                    ['order' => 3, 'instruction' => 'Enable scheduled license sync', 'validation' => 'Sync job configured'],
                ],
                'permissions' => ['Organization.Read.All', 'Directory.Read.All'],
                'gdap_requirements' => ['License Administrator', 'Global Reader'],
                'consent_requirements' => ['Admin consent required'],
                'troubleshooting' => [
                    ['error' => 'empty license list', 'resolution' => 'Ensure tenant has active subscriptions'],
                    ['error' => '403 on subscribed SKUs', 'resolution' => 'Verify License Administrator GDAP role'],
                ],
            ],
            [
                'slug' => 'device-inventory-setup',
                'title' => 'Device Inventory Connector Setup',
                'integration_slug' => 'device-inventory',
                'version' => '1.0.0',
                'owner' => 'Integration Admin',
                'prerequisites' => ['Microsoft Intune setup completed', 'Entra ID setup completed'],
                'steps' => [
                    ['order' => 1, 'instruction' => 'Verify both Intune and Entra device permissions', 'validation' => 'Permissions confirmed'],
                    ['order' => 2, 'instruction' => 'Test combined device inventory endpoint', 'validation' => 'Merged device list returned'],
                    ['order' => 3, 'instruction' => 'Configure compliance state mapping', 'validation' => 'Compliance states mapped'],
                    ['order' => 4, 'instruction' => 'Enable scheduled device inventory sync', 'validation' => 'Sync job configured'],
                ],
                'permissions' => ['DeviceManagementManagedDevices.Read.All', 'Device.Read.All'],
                'gdap_requirements' => ['Intune Administrator', 'Cloud Device Administrator'],
                'consent_requirements' => ['Admin consent required for both Intune and Entra scopes'],
                'troubleshooting' => [
                    ['error' => 'partial device list', 'resolution' => 'Ensure both Intune and Entra ID integrations are active'],
                    ['error' => 'compliance state unknown', 'resolution' => 'Verify Intune compliance policies are configured on tenant'],
                ],
            ],
        ];

        foreach ($rows as $row) {
            DB::table('integration_playbooks')->updateOrInsert(
                ['slug' => $row['slug']],
                [
                    'title' => $row['title'],
                    'integration_slug' => $row['integration_slug'],
                    'version' => $row['version'],
                    'owner' => $row['owner'],
                    'prerequisites' => json_encode($row['prerequisites'], JSON_THROW_ON_ERROR),
                    'steps' => json_encode($row['steps'], JSON_THROW_ON_ERROR),
                    'permissions' => json_encode($row['permissions'], JSON_THROW_ON_ERROR),
                    'gdap_requirements' => json_encode($row['gdap_requirements'], JSON_THROW_ON_ERROR),
                    'consent_requirements' => json_encode($row['consent_requirements'], JSON_THROW_ON_ERROR),
                    'troubleshooting' => json_encode($row['troubleshooting'], JSON_THROW_ON_ERROR),
                    'is_active' => true,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
