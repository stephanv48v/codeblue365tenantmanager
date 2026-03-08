<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class IntegrationsSeeder extends Seeder
{
    public function run(): void
    {
        $integrations = [
            ['slug' => 'microsoft-graph', 'name' => 'Microsoft Graph'],
            ['slug' => 'entra-id', 'name' => 'Microsoft Entra ID'],
            ['slug' => 'intune', 'name' => 'Microsoft Intune'],
            ['slug' => 'm365-usage-reporting', 'name' => 'Microsoft 365 Usage Reporting'],
            ['slug' => 'microsoft-secure-score', 'name' => 'Microsoft Secure Score'],
            ['slug' => 'identity-secure-score', 'name' => 'Identity Secure Score'],
            ['slug' => 'service-health', 'name' => 'Service Health / Message Center'],
            ['slug' => 'license-data', 'name' => 'License Data'],
            ['slug' => 'device-inventory', 'name' => 'Device Inventory'],
        ];

        foreach ($integrations as $integration) {
            DB::table('integrations')->updateOrInsert(
                ['slug' => $integration['slug']],
                [
                    'name' => $integration['name'],
                    'status' => 'not_configured',
                    'description' => $integration['name'].' connector',
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }
    }
}
