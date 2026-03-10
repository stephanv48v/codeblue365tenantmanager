<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ─── Email / Exchange ───────────────────────────────────
        Schema::create('mailboxes', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('user_principal_name');
            $table->string('display_name');
            $table->string('mailbox_type')->default('user'); // user, shared, room, equipment
            $table->bigInteger('storage_used_bytes')->default(0);
            $table->bigInteger('storage_quota_bytes')->default(0);
            $table->integer('items_count')->default(0);
            $table->boolean('has_archive')->default(false);
            $table->boolean('litigation_hold_enabled')->default(false);
            $table->string('last_activity_date')->nullable();
            $table->timestamps();
        });

        Schema::create('mail_flow_rules', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('rule_name');
            $table->string('state')->default('enabled'); // enabled, disabled
            $table->string('priority')->nullable();
            $table->text('description')->nullable();
            $table->string('sender_scope')->nullable();
            $table->string('recipient_scope')->nullable();
            $table->text('conditions_json')->nullable();
            $table->text('actions_json')->nullable();
            $table->timestamps();
        });

        Schema::create('distribution_lists', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('display_name');
            $table->string('email_address');
            $table->string('group_type')->default('distribution'); // distribution, mail-enabled-security
            $table->integer('member_count')->default(0);
            $table->boolean('external_senders_allowed')->default(false);
            $table->boolean('hidden_from_gal')->default(false);
            $table->string('managed_by')->nullable();
            $table->timestamps();
        });

        Schema::create('forwarding_rules', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('user_principal_name');
            $table->string('display_name');
            $table->string('forwarding_type'); // smtp, inbox-rule, transport-rule
            $table->string('forwarding_target');
            $table->boolean('is_external')->default(false);
            $table->boolean('delivers_to_mailbox_and_forward')->default(true);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        // ─── Groups ────────────────────────────────────────────
        Schema::create('groups', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('group_id')->unique();
            $table->string('display_name');
            $table->string('group_type'); // microsoft365, security, distribution, dynamic-security, dynamic-m365
            $table->string('mail')->nullable();
            $table->boolean('mail_enabled')->default(false);
            $table->boolean('security_enabled')->default(false);
            $table->string('membership_type')->default('assigned'); // assigned, dynamic
            $table->string('membership_rule')->nullable();
            $table->integer('member_count')->default(0);
            $table->integer('owner_count')->default(0);
            $table->boolean('has_owners')->default(true);
            $table->string('visibility')->default('public'); // public, private, hiddenmembership
            $table->string('expiration_date')->nullable();
            $table->string('last_activity_date')->nullable();
            $table->string('created_date')->nullable();
            $table->timestamps();
        });

        // ─── App Registrations ──────────────────────────────────
        Schema::create('app_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('app_id');
            $table->string('display_name');
            $table->string('app_type')->default('app-registration'); // app-registration, enterprise-app, managed-identity
            $table->string('sign_in_audience')->default('AzureADMyOrg');
            $table->integer('credential_count')->default(0);
            $table->string('nearest_credential_expiry')->nullable();
            $table->boolean('has_expired_credentials')->default(false);
            $table->integer('api_permissions_count')->default(0);
            $table->boolean('has_admin_consent')->default(false);
            $table->text('required_resource_access_json')->nullable();
            $table->string('publisher_domain')->nullable();
            $table->boolean('is_first_party')->default(false);
            $table->string('last_sign_in_date')->nullable();
            $table->string('created_date')->nullable();
            $table->timestamps();
        });

        Schema::create('oauth_consent_grants', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('app_id');
            $table->string('app_display_name');
            $table->string('principal_type')->default('user'); // user, servicePrincipal, allPrincipals
            $table->string('principal_name')->nullable();
            $table->string('consent_type')->default('principal'); // principal, allPrincipals
            $table->text('scopes')->nullable();
            $table->string('risk_level')->default('low'); // low, medium, high, critical
            $table->timestamps();
        });

        // ─── Teams ──────────────────────────────────────────────
        Schema::create('teams_activity', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('report_period')->default('30'); // days
            $table->integer('active_users')->default(0);
            $table->integer('active_channels')->default(0);
            $table->integer('total_messages')->default(0);
            $table->integer('channel_messages')->default(0);
            $table->integer('chat_messages')->default(0);
            $table->integer('meetings_organized')->default(0);
            $table->integer('meetings_attended')->default(0);
            $table->integer('calls_count')->default(0);
            $table->integer('audio_duration_minutes')->default(0);
            $table->integer('video_duration_minutes')->default(0);
            $table->integer('screen_share_duration_minutes')->default(0);
            $table->string('report_date');
            $table->timestamps();
        });

        Schema::create('teams', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('team_id');
            $table->string('display_name');
            $table->string('description')->nullable();
            $table->string('visibility')->default('private'); // private, public
            $table->integer('member_count')->default(0);
            $table->integer('channel_count')->default(0);
            $table->integer('guest_count')->default(0);
            $table->boolean('is_archived')->default(false);
            $table->string('last_activity_date')->nullable();
            $table->string('created_date')->nullable();
            $table->timestamps();
        });

        // ─── DLP & Sensitivity Labels ───────────────────────────
        Schema::create('dlp_policies', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('policy_name');
            $table->string('status')->default('enabled'); // enabled, disabled, test-with-tips, test-without-tips
            $table->string('mode')->default('enforce'); // enforce, test
            $table->text('locations_json')->nullable(); // exchange, sharepoint, onedrive, teams, endpoints
            $table->integer('rule_count')->default(0);
            $table->integer('matches_last_30d')->default(0);
            $table->integer('overrides_last_30d')->default(0);
            $table->integer('false_positives_last_30d')->default(0);
            $table->string('priority')->default('medium');
            $table->string('created_date')->nullable();
            $table->timestamps();
        });

        Schema::create('sensitivity_labels', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('label_id');
            $table->string('label_name');
            $table->string('parent_label')->nullable();
            $table->string('priority')->default('0');
            $table->boolean('is_active')->default(true);
            $table->boolean('auto_labeling_enabled')->default(false);
            $table->boolean('encryption_enabled')->default(false);
            $table->boolean('content_marking_enabled')->default(false);
            $table->integer('files_labeled_count')->default(0);
            $table->integer('emails_labeled_count')->default(0);
            $table->integer('sites_labeled_count')->default(0);
            $table->string('scope')->default('all'); // all, files, emails, sites, groups
            $table->timestamps();
        });

        // ─── Power Platform ─────────────────────────────────────
        Schema::create('power_apps', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('app_id');
            $table->string('display_name');
            $table->string('owner')->nullable();
            $table->string('environment_name')->nullable();
            $table->string('app_type')->default('canvas'); // canvas, model-driven
            $table->integer('shared_users_count')->default(0);
            $table->integer('shared_groups_count')->default(0);
            $table->integer('sessions_last_30d')->default(0);
            $table->string('status')->default('active');
            $table->text('connectors_json')->nullable();
            $table->string('last_modified_date')->nullable();
            $table->string('created_date')->nullable();
            $table->timestamps();
        });

        Schema::create('power_automate_flows', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('flow_id');
            $table->string('display_name');
            $table->string('owner')->nullable();
            $table->string('environment_name')->nullable();
            $table->string('flow_type')->default('automated'); // automated, instant, scheduled
            $table->string('status')->default('active'); // active, suspended, stopped
            $table->integer('runs_last_30d')->default(0);
            $table->integer('failures_last_30d')->default(0);
            $table->text('connectors_json')->nullable();
            $table->boolean('uses_premium_connector')->default(false);
            $table->boolean('has_external_connection')->default(false);
            $table->string('last_run_date')->nullable();
            $table->string('created_date')->nullable();
            $table->timestamps();
        });

        // ─── ConnectWise Integration ────────────────────────────
        Schema::create('connectwise_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->nullable();
            $table->string('ticket_id');
            $table->string('summary');
            $table->string('status')->default('new'); // new, open, in-progress, closed
            $table->string('priority')->default('medium'); // low, medium, high, critical
            $table->string('source')->default('manual'); // manual, finding, alert, automated
            $table->unsignedBigInteger('source_finding_id')->nullable();
            $table->unsignedBigInteger('source_alert_id')->nullable();
            $table->string('board_name')->nullable();
            $table->string('assigned_to')->nullable();
            $table->string('company_name')->nullable();
            $table->string('contact_name')->nullable();
            $table->string('cw_ticket_url')->nullable();
            $table->string('created_date')->nullable();
            $table->string('closed_date')->nullable();
            $table->timestamps();
        });

        Schema::create('connectwise_config', function (Blueprint $table) {
            $table->id();
            $table->string('site_url');
            $table->string('company_id');
            $table->text('public_key_encrypted')->nullable();
            $table->text('private_key_encrypted')->nullable();
            $table->string('default_board')->nullable();
            $table->string('default_status')->default('New');
            $table->string('default_priority')->default('Medium');
            $table->boolean('auto_create_from_findings')->default(false);
            $table->boolean('auto_create_from_alerts')->default(false);
            $table->string('severity_threshold')->default('high'); // low, medium, high, critical
            $table->boolean('sync_enabled')->default(true);
            $table->string('last_sync_at')->nullable();
            $table->timestamps();
        });

        // ─── Notifications ──────────────────────────────────────
        Schema::create('notification_channels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type'); // email, teams-webhook
            $table->text('config_json'); // email addresses or webhook URL
            $table->boolean('enabled')->default(true);
            $table->string('last_sent_at')->nullable();
            $table->timestamps();
        });

        Schema::create('notification_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('channel_id');
            $table->string('event_type'); // finding.critical, alert.new, score.drop, gdap.expiring, credential.expiring
            $table->string('severity_threshold')->default('high');
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });

        // ─── Remediation Actions ────────────────────────────────
        Schema::create('remediation_actions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->unsignedBigInteger('finding_id')->nullable();
            $table->string('action_type'); // enable-mfa, disable-legacy-auth, revoke-consent, enable-ca-policy, block-forwarding, etc.
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('pending'); // pending, in-progress, completed, failed
            $table->string('initiated_by')->nullable();
            $table->string('completed_at')->nullable();
            $table->text('result_json')->nullable();
            $table->timestamps();
        });

        // ─── Enhanced Identity ───────────────────────────────────
        Schema::create('password_policies', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('user_principal_name');
            $table->string('display_name');
            $table->string('password_last_set')->nullable();
            $table->string('password_expiry_date')->nullable();
            $table->boolean('password_never_expires')->default(false);
            $table->boolean('uses_legacy_auth')->default(false);
            $table->text('legacy_protocols_json')->nullable(); // POP3, IMAP, SMTP, ActiveSync
            $table->boolean('is_break_glass_account')->default(false);
            $table->timestamps();
        });

        Schema::create('pim_role_activations', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('user_principal_name');
            $table->string('display_name');
            $table->string('role_name');
            $table->string('activation_type')->default('eligible'); // eligible, active
            $table->string('status')->default('active');
            $table->string('start_date')->nullable();
            $table->string('end_date')->nullable();
            $table->string('justification')->nullable();
            $table->timestamps();
        });

        // ─── Enhanced Security ───────────────────────────────────
        Schema::create('secure_score_actions', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('action_id');
            $table->string('title');
            $table->string('category'); // Identity, Data, Device, Apps, Infrastructure
            $table->float('max_score')->default(0);
            $table->float('current_score')->default(0);
            $table->string('status')->default('todo'); // todo, inprogress, completed, riskaccepted, thirdparty
            $table->string('implementation_status')->nullable();
            $table->text('remediation_description')->nullable();
            $table->string('user_impact')->default('low'); // low, moderate, high
            $table->text('threats_json')->nullable();
            $table->timestamps();
        });

        Schema::create('defender_alerts', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('alert_id');
            $table->string('title');
            $table->string('severity')->default('medium'); // informational, low, medium, high
            $table->string('category'); // Credential Access, Execution, Persistence, etc.
            $table->string('status')->default('new'); // new, inProgress, resolved, redirected
            $table->string('service_source')->default('MDE'); // MDE, MDI, MDO, MDA, AAD-IP
            $table->string('detection_source')->nullable();
            $table->text('description')->nullable();
            $table->string('assigned_to')->nullable();
            $table->string('first_activity_date')->nullable();
            $table->string('last_activity_date')->nullable();
            $table->timestamps();
        });

        Schema::create('security_defaults', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->unique();
            $table->boolean('security_defaults_enabled')->default(false);
            $table->boolean('per_user_mfa_enforced')->default(false);
            $table->integer('users_mfa_enforced')->default(0);
            $table->integer('users_mfa_registered')->default(0);
            $table->integer('users_passwordless')->default(0);
            $table->boolean('legacy_auth_blocked')->default(false);
            $table->integer('legacy_auth_sign_ins_30d')->default(0);
            $table->string('assessed_at')->nullable();
            $table->timestamps();
        });

        // ─── Enhanced Devices ────────────────────────────────────
        Schema::create('compliance_policies', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('policy_id');
            $table->string('policy_name');
            $table->string('platform'); // windows, ios, android, macos
            $table->integer('assigned_count')->default(0);
            $table->integer('compliant_count')->default(0);
            $table->integer('non_compliant_count')->default(0);
            $table->integer('error_count')->default(0);
            $table->string('last_evaluated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('autopilot_devices', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('serial_number');
            $table->string('model')->nullable();
            $table->string('manufacturer')->nullable();
            $table->string('enrollment_status')->default('pending'); // pending, enrolled, failed
            $table->string('deployment_profile')->nullable();
            $table->string('group_tag')->nullable();
            $table->string('last_contacted_date')->nullable();
            $table->timestamps();
        });

        // ─── Enhanced Licensing ──────────────────────────────────
        Schema::create('license_cost_analysis', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('sku_name');
            $table->string('sku_friendly_name');
            $table->integer('purchased_units')->default(0);
            $table->integer('assigned_units')->default(0);
            $table->integer('active_units')->default(0);
            $table->float('cost_per_unit_monthly')->default(0);
            $table->float('total_monthly_cost')->default(0);
            $table->float('wasted_monthly_cost')->default(0);
            $table->string('optimization_recommendation')->nullable();
            $table->string('report_date');
            $table->timestamps();
        });

        // ─── Tenant Comparison ───────────────────────────────────
        Schema::create('tenant_benchmarks', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('metric_name'); // secure_score, mfa_coverage, device_compliance, copilot_adoption, etc.
            $table->float('metric_value')->default(0);
            $table->float('fleet_average')->default(0);
            $table->float('fleet_best')->default(0);
            $table->string('percentile_rank')->nullable();
            $table->string('report_date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        $tables = [
            'tenant_benchmarks', 'license_cost_analysis', 'autopilot_devices',
            'compliance_policies', 'security_defaults', 'defender_alerts',
            'secure_score_actions', 'pim_role_activations', 'password_policies',
            'remediation_actions', 'notification_rules', 'notification_channels',
            'connectwise_config', 'connectwise_tickets', 'power_automate_flows',
            'power_apps', 'sensitivity_labels', 'dlp_policies', 'teams',
            'teams_activity', 'oauth_consent_grants', 'app_registrations',
            'groups', 'forwarding_rules', 'distribution_lists',
            'mail_flow_rules', 'mailboxes',
        ];

        foreach ($tables as $table) {
            Schema::dropIfExists($table);
        }
    }
};
