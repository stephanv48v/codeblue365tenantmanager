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
