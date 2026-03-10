<?php

declare(strict_types=1);

namespace App\Modules\Reports\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportEnhancedController extends Controller
{
    public function exportMailboxes(Request $request): StreamedResponse
    {
        $query = DB::table('mailboxes')
            ->leftJoin('managed_tenants', 'mailboxes.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['mailboxes.*', 'managed_tenants.customer_name'])
            ->orderBy('mailboxes.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('mailboxes.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('mailboxes_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Display Name', 'UPN', 'Mailbox Type',
            'Storage Used (MB)', 'Storage Quota (MB)', 'Items', 'Has Archive',
            'Litigation Hold', 'Last Activity',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->display_name,
            $r->user_principal_name,
            $r->mailbox_type,
            round($r->storage_used_bytes / 1048576, 2),
            round($r->storage_quota_bytes / 1048576, 2),
            $r->items_count,
            $r->has_archive ? 'Yes' : 'No',
            $r->litigation_hold_enabled ? 'Yes' : 'No',
            $r->last_activity_date ?? '',
        ])->toArray());
    }

    public function exportForwardingRules(Request $request): StreamedResponse
    {
        $query = DB::table('forwarding_rules')
            ->leftJoin('managed_tenants', 'forwarding_rules.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['forwarding_rules.*', 'managed_tenants.customer_name'])
            ->orderBy('forwarding_rules.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('forwarding_rules.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('forwarding_rules_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Display Name', 'UPN', 'Forwarding Type',
            'Forwarding Target', 'Is External', 'Delivers to Mailbox', 'Status',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->display_name,
            $r->user_principal_name,
            $r->forwarding_type,
            $r->forwarding_target,
            $r->is_external ? 'Yes' : 'No',
            $r->delivers_to_mailbox_and_forward ? 'Yes' : 'No',
            $r->status,
        ])->toArray());
    }

    public function exportGroups(Request $request): StreamedResponse
    {
        $query = DB::table('groups')
            ->leftJoin('managed_tenants', 'groups.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['groups.*', 'managed_tenants.customer_name'])
            ->orderBy('groups.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('groups.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('groups_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Display Name', 'Group Type', 'Mail',
            'Membership Type', 'Members', 'Owners', 'Has Owners', 'Visibility',
            'Last Activity', 'Created',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->display_name,
            $r->group_type,
            $r->mail ?? '',
            $r->membership_type,
            $r->member_count,
            $r->owner_count,
            $r->has_owners ? 'Yes' : 'No',
            $r->visibility,
            $r->last_activity_date ?? '',
            $r->created_date ?? '',
        ])->toArray());
    }

    public function exportAppRegistrations(Request $request): StreamedResponse
    {
        $query = DB::table('app_registrations')
            ->leftJoin('managed_tenants', 'app_registrations.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['app_registrations.*', 'managed_tenants.customer_name'])
            ->orderBy('app_registrations.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('app_registrations.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('app_registrations_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'App Name', 'App ID', 'App Type',
            'Sign-In Audience', 'Credentials', 'Expired Credentials', 'API Permissions',
            'Admin Consent', 'Publisher Domain', 'First Party', 'Last Sign-In', 'Created',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->display_name,
            $r->app_id,
            $r->app_type,
            $r->sign_in_audience,
            $r->credential_count,
            $r->has_expired_credentials ? 'Yes' : 'No',
            $r->api_permissions_count,
            $r->has_admin_consent ? 'Yes' : 'No',
            $r->publisher_domain ?? '',
            $r->is_first_party ? 'Yes' : 'No',
            $r->last_sign_in_date ?? '',
            $r->created_date ?? '',
        ])->toArray());
    }

    public function exportTeams(Request $request): StreamedResponse
    {
        $query = DB::table('teams')
            ->leftJoin('managed_tenants', 'teams.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['teams.*', 'managed_tenants.customer_name'])
            ->orderBy('teams.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('teams.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('teams_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Team Name', 'Visibility', 'Members',
            'Channels', 'Guests', 'Archived', 'Last Activity', 'Created',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->display_name,
            $r->visibility,
            $r->member_count,
            $r->channel_count,
            $r->guest_count,
            $r->is_archived ? 'Yes' : 'No',
            $r->last_activity_date ?? '',
            $r->created_date ?? '',
        ])->toArray());
    }

    public function exportDlpPolicies(Request $request): StreamedResponse
    {
        $query = DB::table('dlp_policies')
            ->leftJoin('managed_tenants', 'dlp_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['dlp_policies.*', 'managed_tenants.customer_name'])
            ->orderBy('dlp_policies.policy_name');

        if ($request->filled('tenant_id')) {
            $query->where('dlp_policies.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('dlp_policies_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Policy Name', 'Status', 'Mode',
            'Rules', 'Matches (30d)', 'Overrides (30d)', 'False Positives (30d)',
            'Priority', 'Created',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->policy_name,
            $r->status,
            $r->mode,
            $r->rule_count,
            $r->matches_last_30d,
            $r->overrides_last_30d,
            $r->false_positives_last_30d,
            $r->priority,
            $r->created_date ?? '',
        ])->toArray());
    }

    public function exportSensitivityLabels(Request $request): StreamedResponse
    {
        $query = DB::table('sensitivity_labels')
            ->leftJoin('managed_tenants', 'sensitivity_labels.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['sensitivity_labels.*', 'managed_tenants.customer_name'])
            ->orderBy('sensitivity_labels.label_name');

        if ($request->filled('tenant_id')) {
            $query->where('sensitivity_labels.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('sensitivity_labels_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Label Name', 'Parent Label', 'Priority',
            'Active', 'Auto Labeling', 'Encryption', 'Content Marking',
            'Files Labeled', 'Emails Labeled', 'Sites Labeled', 'Scope',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->label_name,
            $r->parent_label ?? '',
            $r->priority,
            $r->is_active ? 'Yes' : 'No',
            $r->auto_labeling_enabled ? 'Yes' : 'No',
            $r->encryption_enabled ? 'Yes' : 'No',
            $r->content_marking_enabled ? 'Yes' : 'No',
            $r->files_labeled_count,
            $r->emails_labeled_count,
            $r->sites_labeled_count,
            $r->scope,
        ])->toArray());
    }

    public function exportPowerApps(Request $request): StreamedResponse
    {
        $query = DB::table('power_apps')
            ->leftJoin('managed_tenants', 'power_apps.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['power_apps.*', 'managed_tenants.customer_name'])
            ->orderBy('power_apps.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('power_apps.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('power_apps_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'App Name', 'Owner', 'Environment',
            'App Type', 'Shared Users', 'Shared Groups', 'Sessions (30d)',
            'Status', 'Last Modified', 'Created',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->display_name,
            $r->owner ?? '',
            $r->environment_name ?? '',
            $r->app_type,
            $r->shared_users_count,
            $r->shared_groups_count,
            $r->sessions_last_30d,
            $r->status,
            $r->last_modified_date ?? '',
            $r->created_date ?? '',
        ])->toArray());
    }

    public function exportPowerAutomateFlows(Request $request): StreamedResponse
    {
        $query = DB::table('power_automate_flows')
            ->leftJoin('managed_tenants', 'power_automate_flows.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['power_automate_flows.*', 'managed_tenants.customer_name'])
            ->orderBy('power_automate_flows.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('power_automate_flows.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('power_automate_flows_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Flow Name', 'Owner', 'Environment',
            'Flow Type', 'Status', 'Runs (30d)', 'Failures (30d)',
            'Uses Premium', 'External Connection', 'Last Run', 'Created',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->display_name,
            $r->owner ?? '',
            $r->environment_name ?? '',
            $r->flow_type,
            $r->status,
            $r->runs_last_30d,
            $r->failures_last_30d,
            $r->uses_premium_connector ? 'Yes' : 'No',
            $r->has_external_connection ? 'Yes' : 'No',
            $r->last_run_date ?? '',
            $r->created_date ?? '',
        ])->toArray());
    }

    public function exportConnectWiseTickets(Request $request): StreamedResponse
    {
        $query = DB::table('connectwise_tickets')
            ->leftJoin('managed_tenants', 'connectwise_tickets.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['connectwise_tickets.*', 'managed_tenants.customer_name'])
            ->orderByDesc('connectwise_tickets.created_date');

        if ($request->filled('tenant_id')) {
            $query->where('connectwise_tickets.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('connectwise_tickets_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Ticket ID', 'Summary', 'Status',
            'Priority', 'Source', 'Board', 'Assigned To', 'Company',
            'Contact', 'Created', 'Closed',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id ?? '',
            $r->customer_name ?? '',
            $r->ticket_id,
            $r->summary,
            $r->status,
            $r->priority,
            $r->source,
            $r->board_name ?? '',
            $r->assigned_to ?? '',
            $r->company_name ?? '',
            $r->contact_name ?? '',
            $r->created_date ?? '',
            $r->closed_date ?? '',
        ])->toArray());
    }

    public function exportSecureScoreActions(Request $request): StreamedResponse
    {
        $query = DB::table('secure_score_actions')
            ->leftJoin('managed_tenants', 'secure_score_actions.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['secure_score_actions.*', 'managed_tenants.customer_name'])
            ->orderBy('secure_score_actions.category')
            ->orderBy('secure_score_actions.title');

        if ($request->filled('tenant_id')) {
            $query->where('secure_score_actions.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('secure_score_actions_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Title', 'Category', 'Max Score',
            'Current Score', 'Status', 'Implementation', 'User Impact',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->title,
            $r->category,
            $r->max_score,
            $r->current_score,
            $r->status,
            $r->implementation_status ?? '',
            $r->user_impact,
        ])->toArray());
    }

    public function exportDefenderAlerts(Request $request): StreamedResponse
    {
        $query = DB::table('defender_alerts')
            ->leftJoin('managed_tenants', 'defender_alerts.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['defender_alerts.*', 'managed_tenants.customer_name'])
            ->orderByRaw("CASE defender_alerts.severity WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 WHEN 'informational' THEN 4 ELSE 5 END")
            ->orderByDesc('defender_alerts.first_activity_date');

        if ($request->filled('tenant_id')) {
            $query->where('defender_alerts.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('defender_alerts_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Title', 'Severity', 'Category',
            'Status', 'Service Source', 'Detection Source', 'Assigned To',
            'First Activity', 'Last Activity',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->title,
            $r->severity,
            $r->category,
            $r->status,
            $r->service_source,
            $r->detection_source ?? '',
            $r->assigned_to ?? '',
            $r->first_activity_date ?? '',
            $r->last_activity_date ?? '',
        ])->toArray());
    }

    public function exportCompliancePolicies(Request $request): StreamedResponse
    {
        $query = DB::table('compliance_policies')
            ->leftJoin('managed_tenants', 'compliance_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['compliance_policies.*', 'managed_tenants.customer_name'])
            ->orderBy('compliance_policies.policy_name');

        if ($request->filled('tenant_id')) {
            $query->where('compliance_policies.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('compliance_policies_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Policy Name', 'Platform', 'Assigned',
            'Compliant', 'Non-Compliant', 'Errors', 'Compliance %', 'Last Evaluated',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->policy_name,
            $r->platform,
            $r->assigned_count,
            $r->compliant_count,
            $r->non_compliant_count,
            $r->error_count,
            $r->assigned_count > 0 ? round(($r->compliant_count / $r->assigned_count) * 100, 1) : 0,
            $r->last_evaluated_at ?? '',
        ])->toArray());
    }

    public function exportLicenseCostAnalysis(Request $request): StreamedResponse
    {
        $query = DB::table('license_cost_analysis')
            ->leftJoin('managed_tenants', 'license_cost_analysis.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['license_cost_analysis.*', 'managed_tenants.customer_name'])
            ->orderByDesc('license_cost_analysis.total_monthly_cost');

        if ($request->filled('tenant_id')) {
            $query->where('license_cost_analysis.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('license_cost_analysis_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'SKU', 'Friendly Name', 'Purchased',
            'Assigned', 'Active', 'Cost/Unit/Month', 'Total Monthly Cost',
            'Wasted Monthly Cost', 'Recommendation', 'Report Date',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->sku_name,
            $r->sku_friendly_name,
            $r->purchased_units,
            $r->assigned_units,
            $r->active_units,
            round($r->cost_per_unit_monthly, 2),
            round($r->total_monthly_cost, 2),
            round($r->wasted_monthly_cost, 2),
            $r->optimization_recommendation ?? '',
            $r->report_date,
        ])->toArray());
    }

    public function exportPasswordHealth(Request $request): StreamedResponse
    {
        $query = DB::table('password_policies')
            ->leftJoin('managed_tenants', 'password_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['password_policies.*', 'managed_tenants.customer_name'])
            ->orderBy('password_policies.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('password_policies.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('password_health_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Display Name', 'UPN',
            'Password Last Set', 'Password Expiry', 'Never Expires',
            'Uses Legacy Auth', 'Legacy Protocols', 'Break-Glass Account',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->display_name,
            $r->user_principal_name,
            $r->password_last_set ?? '',
            $r->password_expiry_date ?? '',
            $r->password_never_expires ? 'Yes' : 'No',
            $r->uses_legacy_auth ? 'Yes' : 'No',
            $r->legacy_protocols_json ? implode('; ', json_decode($r->legacy_protocols_json, true) ?? []) : '',
            $r->is_break_glass_account ? 'Yes' : 'No',
        ])->toArray());
    }

    public function exportTenantBenchmarks(Request $request): StreamedResponse
    {
        $query = DB::table('tenant_benchmarks')
            ->leftJoin('managed_tenants', 'tenant_benchmarks.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['tenant_benchmarks.*', 'managed_tenants.customer_name'])
            ->orderBy('managed_tenants.customer_name')
            ->orderBy('tenant_benchmarks.metric_name');

        if ($request->filled('tenant_id')) {
            $query->where('tenant_benchmarks.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('tenant_benchmarks_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Metric', 'Value', 'Fleet Average',
            'Fleet Best', 'Percentile Rank', 'Report Date',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->tenant_id,
            $r->customer_name ?? '',
            $r->metric_name,
            $r->metric_value,
            $r->fleet_average,
            $r->fleet_best,
            $r->percentile_rank ?? '',
            $r->report_date,
        ])->toArray());
    }

    /** @param array<int, array<int, mixed>> $rows */
    private function streamCsv(string $filename, array $headers, array $rows): StreamedResponse
    {
        return new StreamedResponse(function () use ($headers, $rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);

            foreach ($rows as $row) {
                fputcsv($handle, $row);
            }

            fclose($handle);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}
