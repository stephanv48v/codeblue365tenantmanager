<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Add enabled column to integrations
        Schema::table('integrations', function (Blueprint $table): void {
            $table->boolean('enabled')->default(true)->after('status');
        });

        // Add settings.manage and settings.view permissions
        $now = now();
        $permIds = [];
        foreach (['settings.manage', 'settings.view'] as $slug) {
            $permIds[$slug] = DB::table('permissions')->insertGetId([
                'name' => ucwords(str_replace('.', ' ', $slug)),
                'slug' => $slug,
                'description' => "Permission to {$slug}",
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Grant both to platform-super-admin
        $superAdminRole = DB::table('roles')->where('slug', 'platform-super-admin')->first();
        if ($superAdminRole) {
            foreach ($permIds as $permId) {
                DB::table('role_permissions')->insertOrIgnore([
                    'role_id' => $superAdminRole->id,
                    'permission_id' => $permId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // Grant settings.view to msp-operations-manager
        $opsManager = DB::table('roles')->where('slug', 'msp-operations-manager')->first();
        if ($opsManager && isset($permIds['settings.view'])) {
            DB::table('role_permissions')->insertOrIgnore([
                'role_id' => $opsManager->id,
                'permission_id' => $permIds['settings.view'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // Seed default settings
        $defaults = [
            ['key' => 'partner_tenant.tenant_id', 'value' => null, 'group' => 'partner_tenant', 'description' => 'Partner tenant Azure AD tenant ID'],
            ['key' => 'partner_tenant.display_name', 'value' => null, 'group' => 'partner_tenant', 'description' => 'Partner tenant display name'],
            ['key' => 'partner_tenant.primary_domain', 'value' => null, 'group' => 'partner_tenant', 'description' => 'Partner tenant primary domain'],
            ['key' => 'partner_tenant.client_id', 'value' => null, 'group' => 'partner_tenant', 'description' => 'App registration client ID'],
            ['key' => 'partner_tenant.client_secret', 'value' => null, 'group' => 'partner_tenant', 'description' => 'App registration client secret (encrypted)'],
            ['key' => 'partner_tenant.connection_status', 'value' => json_encode('not_connected'), 'group' => 'partner_tenant', 'description' => 'Connection status'],
            ['key' => 'partner_tenant.last_verified_at', 'value' => null, 'group' => 'partner_tenant', 'description' => 'Last successful connection test'],
            ['key' => 'rbac.entra_group_role_map', 'value' => json_encode([]), 'group' => 'rbac', 'description' => 'Entra group ID to role slug mapping'],
            ['key' => 'scoring.weights', 'value' => json_encode(['identity_currency' => 0.20, 'device_currency' => 0.15, 'app_currency' => 0.10, 'security_posture' => 0.25, 'governance_readiness' => 0.15, 'integration_readiness' => 0.15]), 'group' => 'scoring', 'description' => 'Score category weights'],
            ['key' => 'integrations.sync_interval_minutes', 'value' => json_encode(60), 'group' => 'integrations', 'description' => 'Sync interval in minutes'],
            ['key' => 'integrations.auto_sync_enabled', 'value' => json_encode(true), 'group' => 'integrations', 'description' => 'Auto sync enabled'],
            ['key' => 'notifications.email_enabled', 'value' => json_encode(false), 'group' => 'notifications', 'description' => 'Email notifications enabled'],
            ['key' => 'notifications.findings_severity_threshold', 'value' => json_encode('high'), 'group' => 'notifications', 'description' => 'Minimum severity for finding notifications'],
            ['key' => 'notifications.gdap_expiry_warning_days', 'value' => json_encode(30), 'group' => 'notifications', 'description' => 'Days before GDAP expiry to warn'],
            ['key' => 'discovery.last_results', 'value' => json_encode([]), 'group' => 'discovery', 'description' => 'Last tenant discovery results'],
            ['key' => 'discovery.last_run_at', 'value' => null, 'group' => 'discovery', 'description' => 'Last discovery run timestamp'],
        ];

        foreach ($defaults as $setting) {
            DB::table('settings')->insertOrIgnore(array_merge($setting, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }

    public function down(): void
    {
        DB::table('settings')->whereIn('group', ['partner_tenant', 'rbac', 'scoring', 'integrations', 'notifications', 'discovery'])->delete();
        DB::table('permissions')->whereIn('slug', ['settings.manage', 'settings.view'])->delete();

        Schema::table('integrations', function (Blueprint $table): void {
            $table->dropColumn('enabled');
        });
    }
};
