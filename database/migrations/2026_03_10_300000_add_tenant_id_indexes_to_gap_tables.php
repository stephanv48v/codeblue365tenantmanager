<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tables that need a tenant_id index.
     */
    private array $tenantIdTables = [
        'mailboxes',
        'mail_flow_rules',
        'distribution_lists',
        'forwarding_rules',
        'groups',
        'app_registrations',
        'oauth_consent_grants',
        'teams_activity',
        'teams',
        'dlp_policies',
        'sensitivity_labels',
        'power_apps',
        'power_automate_flows',
        'connectwise_tickets',
        'remediation_actions',
        'password_policies',
        'pim_role_activations',
        'secure_score_actions',
        'defender_alerts',
        'compliance_policies',
        'autopilot_devices',
        'license_cost_analysis',
        'tenant_benchmarks',
        'security_defaults',
    ];

    public function up(): void
    {
        foreach ($this->tenantIdTables as $tableName) {
            try {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->index('tenant_id', "{$tableName}_tenant_id_index");
                });
            } catch (\Exception $e) {
                // Index may already exist; skip gracefully.
            }
        }

        // Add created_at index on audit_logs for faster time-range queries
        try {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->index('created_at', 'audit_logs_created_at_index');
            });
        } catch (\Exception $e) {
            // Index may already exist; skip gracefully.
        }
    }

    public function down(): void
    {
        foreach ($this->tenantIdTables as $tableName) {
            try {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->dropIndex("{$tableName}_tenant_id_index");
                });
            } catch (\Exception $e) {
                // Index may not exist; skip gracefully.
            }
        }

        try {
            Schema::table('audit_logs', function (Blueprint $table) {
                $table->dropIndex('audit_logs_created_at_index');
            });
        } catch (\Exception $e) {
            // Index may not exist; skip gracefully.
        }
    }
};
