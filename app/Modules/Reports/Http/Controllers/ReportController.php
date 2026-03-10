<?php

declare(strict_types=1);

namespace App\Modules\Reports\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function exportTenants(Request $request): StreamedResponse
    {
        $query = DB::table('managed_tenants')->orderBy('customer_name');
        if ($request->filled('tenant_id')) {
            $query->where('managed_tenants.tenant_id', (string) $request->string('tenant_id'));
        }
        $tenants = $query->get();

        return $this->streamCsv('tenants_export.csv', [
            'ID', 'Tenant ID', 'Customer Name', 'Primary Domain', 'GDAP Status',
            'GDAP Expiry', 'Integration Status', 'Last Sync', 'Assigned Engineer', 'Support Tier',
        ], $tenants->map(fn ($t) => [
            $t->id, $t->tenant_id, $t->customer_name, $t->primary_domain, $t->gdap_status,
            $t->gdap_expiry_at, $t->integration_status, $t->last_sync_at, $t->assigned_engineer, $t->support_tier,
        ])->toArray());
    }

    public function exportFindings(Request $request): StreamedResponse
    {
        $query = DB::table('findings')->orderByDesc('last_detected_at');

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', (string) $request->string('tenant_id'));
        }

        $findings = $query->get();

        return $this->streamCsv('findings_export.csv', [
            'ID', 'Tenant ID', 'Category', 'Severity', 'Status', 'Description',
            'Impact', 'Remediation', 'First Detected', 'Last Detected',
        ], $findings->map(fn ($f) => [
            $f->id, $f->tenant_id, $f->category, $f->severity, $f->status ?? 'open',
            $f->description, $f->impact, $f->recommended_remediation, $f->first_detected_at, $f->last_detected_at,
        ])->toArray());
    }

    public function exportScores(Request $request): StreamedResponse
    {
        $query = DB::table('scores')->orderByDesc('calculated_at');
        if ($request->filled('tenant_id')) {
            $query->where('scores.tenant_id', (string) $request->string('tenant_id'));
        }
        $scores = $query->get();

        return $this->streamCsv('scores_export.csv', [
            'ID', 'Tenant ID', 'Identity Currency', 'Device Currency', 'App Currency',
            'Security Posture', 'Governance Readiness', 'Integration Readiness', 'Composite Score', 'Calculated At',
        ], $scores->map(fn ($s) => [
            $s->id, $s->tenant_id, $s->identity_currency, $s->device_currency, $s->app_currency,
            $s->security_posture, $s->governance_readiness, $s->integration_readiness, $s->composite_score, $s->calculated_at,
        ])->toArray());
    }

    public function exportIdentity(Request $request): StreamedResponse
    {
        $query = DB::table('users_normalized')
            ->leftJoin('managed_tenants', 'users_normalized.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'users_normalized.*',
                'managed_tenants.customer_name',
            ])
            ->orderBy('users_normalized.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('users_normalized.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->boolean('stale')) {
            $query->where('users_normalized.account_enabled', true)
                ->where(function ($q): void {
                    $q->where('users_normalized.last_sign_in_at', '<', now()->subDays(90))
                      ->orWhereNull('users_normalized.last_sign_in_at');
                });
        }

        if ($request->filled('mfa_status')) {
            $mfaStatus = (string) $request->string('mfa_status');
            if ($mfaStatus === 'registered') {
                $query->where('users_normalized.mfa_registered', true);
            } elseif ($mfaStatus === 'not_registered') {
                $query->where('users_normalized.mfa_registered', false);
            }
        }

        if ($request->filled('account_enabled')) {
            $enabled = (string) $request->string('account_enabled');
            $query->where('users_normalized.account_enabled', $enabled === 'enabled');
        }

        $users = $query->get();
        $staleThreshold = now()->subDays(90);

        return $this->streamCsv('identity_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Display Name', 'UPN', 'Enabled',
            'MFA Registered', 'Stale', 'Last Sign-In', 'Assigned Roles', 'Created At',
        ], $users->map(fn ($u) => [
            $u->id, $u->tenant_id, $u->customer_name ?? '', $u->display_name, $u->user_principal_name,
            $u->account_enabled ? 'Yes' : 'No', $u->mfa_registered ? 'Yes' : 'No',
            ($u->account_enabled && (! $u->last_sign_in_at || $u->last_sign_in_at < $staleThreshold)) ? 'Yes' : 'No',
            $u->last_sign_in_at, $u->assigned_roles ?? '', $u->created_at,
        ])->toArray());
    }

    public function exportDeviceCompliance(Request $request): StreamedResponse
    {
        $query = DB::table('devices')
            ->leftJoin('managed_tenants', 'devices.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['devices.*', 'managed_tenants.customer_name'])
            ->orderBy('devices.display_name');
        if ($request->filled('tenant_id')) {
            $query->where('devices.tenant_id', (string) $request->string('tenant_id'));
        }
        $devices = $query->get();

        return $this->streamCsv('device_compliance_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Device Name', 'OS', 'OS Version',
            'Compliance State', 'Managed By', 'Enrolled At',
        ], $devices->map(fn ($d) => [
            $d->id, $d->tenant_id, $d->customer_name ?? '', $d->display_name,
            $d->os, $d->os_version, $d->compliance_state,
            $d->managed_by ?? 'Unmanaged', $d->enrolled_at ?? '',
        ])->toArray());
    }

    public function exportLicenseUtilization(Request $request): StreamedResponse
    {
        $query = DB::table('licenses')
            ->leftJoin('managed_tenants', 'licenses.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['licenses.*', 'managed_tenants.customer_name'])
            ->orderBy('managed_tenants.customer_name');
        if ($request->filled('tenant_id')) {
            $query->where('licenses.tenant_id', (string) $request->string('tenant_id'));
        }
        $licenses = $query->get();

        return $this->streamCsv('license_utilization_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'SKU', 'Total', 'Assigned',
            'Available', 'Waste %',
        ], $licenses->map(fn ($l) => [
            $l->id, $l->tenant_id, $l->customer_name ?? '', $l->sku_name,
            $l->total, $l->assigned,
            $l->total - $l->assigned,
            $l->total > 0 ? round((($l->total - $l->assigned) / $l->total) * 100, 1) : 0,
        ])->toArray());
    }

    public function exportSecurityPosture(Request $request): StreamedResponse
    {
        $query = DB::table('scores')
            ->join('managed_tenants', 'scores.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'scores.*',
                'managed_tenants.customer_name',
            ])
            ->whereIn('scores.id', function ($query): void {
                $query->selectRaw('MAX(id)')->from('scores')->groupBy('tenant_id');
            })
            ->orderByDesc('scores.composite_score');
        if ($request->filled('tenant_id')) {
            $query->where('scores.tenant_id', (string) $request->string('tenant_id'));
        }
        $scores = $query->get();

        return $this->streamCsv('security_posture_export.csv', [
            'Tenant ID', 'Customer', 'Composite', 'Identity', 'Device', 'App',
            'Security Posture', 'Governance', 'Integration', 'Calculated At',
        ], $scores->map(fn ($s) => [
            $s->tenant_id, $s->customer_name, $s->composite_score,
            $s->identity_currency, $s->device_currency, $s->app_currency,
            $s->security_posture, $s->governance_readiness, $s->integration_readiness,
            $s->calculated_at,
        ])->toArray());
    }

    public function exportServiceHealth(Request $request): StreamedResponse
    {
        $query = DB::table('service_health_events')
            ->leftJoin('managed_tenants', 'service_health_events.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['service_health_events.*', 'managed_tenants.customer_name'])
            ->orderByDesc('service_health_events.start_at');
        if ($request->filled('tenant_id')) {
            $query->where('service_health_events.tenant_id', (string) $request->string('tenant_id'));
        }
        $events = $query->get();

        return $this->streamCsv('service_health_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Event ID', 'Service', 'Title',
            'Classification', 'Status', 'Start', 'End',
        ], $events->map(fn ($e) => [
            $e->id, $e->tenant_id, $e->customer_name ?? '', $e->event_id,
            $e->service, $e->title, $e->classification, $e->status,
            $e->start_at, $e->end_at,
        ])->toArray());
    }

    public function exportCopilotUsage(Request $request): StreamedResponse
    {
        $query = DB::table('copilot_usage')
            ->leftJoin('managed_tenants', 'copilot_usage.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['copilot_usage.*', 'managed_tenants.customer_name'])
            ->orderBy('copilot_usage.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('copilot_usage.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('copilot_usage_export.csv', [
            'Display Name', 'UPN', 'Customer', 'Licensed', 'Last Activity',
            'Teams', 'Word', 'Excel', 'PowerPoint', 'Outlook', 'OneNote', 'Copilot Chat',
        ], $records->map(fn ($r) => [
            $r->display_name,
            $r->user_principal_name,
            $r->customer_name ?? '',
            $r->copilot_license_assigned ? 'Yes' : 'No',
            $r->last_activity_date,
            $r->last_activity_teams,
            $r->last_activity_word,
            $r->last_activity_excel,
            $r->last_activity_powerpoint,
            $r->last_activity_outlook,
            $r->last_activity_onenote,
            $r->last_activity_copilot_chat,
        ])->toArray());
    }

    public function exportSharePointSites(Request $request): StreamedResponse
    {
        $query = DB::table('sharepoint_sites')
            ->leftJoin('managed_tenants', 'sharepoint_sites.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['sharepoint_sites.*', 'managed_tenants.customer_name'])
            ->orderBy('sharepoint_sites.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('sharepoint_sites.tenant_id', (string) $request->string('tenant_id'));
        }

        $sites = $query->get();

        return $this->streamCsv('sharepoint_sites_export.csv', [
            'Site Name', 'URL', 'Customer', 'Storage (MB)', 'Files',
            'External Sharing', 'Public', 'Guest Access', 'Sensitivity Label',
            'Permissioned Users', 'Last Activity',
        ], $sites->map(fn ($s) => [
            $s->display_name,
            $s->site_url,
            $s->customer_name ?? '',
            round($s->storage_used_bytes / 1048576, 2),
            $s->file_count,
            $s->external_sharing,
            $s->is_public ? 'Yes' : 'No',
            $s->has_guest_access ? 'Yes' : 'No',
            $s->sensitivity_label ?? '',
            $s->permissioned_user_count,
            $s->last_activity_date,
        ])->toArray());
    }

    public function exportAdminAccounts(Request $request): StreamedResponse
    {
        $query = DB::table('directory_role_assignments')
            ->leftJoin('managed_tenants', 'directory_role_assignments.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['directory_role_assignments.*', 'managed_tenants.customer_name'])
            ->orderBy('directory_role_assignments.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('directory_role_assignments.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('admin_accounts_export.csv', [
            'Display Name', 'UPN', 'Customer', 'Role', 'Assignment Type', 'Status', 'Start Date', 'End Date',
        ], $records->map(fn ($r) => [
            $r->display_name,
            $r->user_principal_name,
            $r->customer_name ?? '',
            $r->role_display_name,
            $r->assignment_type ?? '',
            $r->status ?? '',
            $r->start_date ?? '',
            $r->end_date ?? '',
        ])->toArray());
    }

    public function exportGuestUsers(Request $request): StreamedResponse
    {
        $query = DB::table('guest_users')
            ->leftJoin('managed_tenants', 'guest_users.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['guest_users.*', 'managed_tenants.customer_name'])
            ->orderBy('guest_users.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('guest_users.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('guest_users_export.csv', [
            'Display Name', 'UPN', 'Email', 'Customer', 'Domain', 'Company', 'State', 'Created', 'Last Sign-In', 'Enabled',
        ], $records->map(fn ($r) => [
            $r->display_name,
            $r->user_principal_name,
            $r->mail ?? '',
            $r->customer_name ?? '',
            $r->domain ?? '',
            $r->company_name ?? '',
            $r->external_user_state ?? '',
            $r->created_at ?? '',
            $r->last_sign_in_at ?? '',
            $r->account_enabled ? 'Yes' : 'No',
        ])->toArray());
    }

    public function exportRiskyUsers(Request $request): StreamedResponse
    {
        $query = DB::table('risky_users')
            ->leftJoin('managed_tenants', 'risky_users.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['risky_users.*', 'managed_tenants.customer_name'])
            ->orderByRaw("CASE risky_users.risk_level WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END");

        if ($request->filled('tenant_id')) {
            $query->where('risky_users.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('risky_users_export.csv', [
            'Display Name', 'UPN', 'Customer', 'Risk Level', 'Risk State', 'Risk Detail', 'Last Updated',
        ], $records->map(fn ($r) => [
            $r->display_name,
            $r->user_principal_name,
            $r->customer_name ?? '',
            $r->risk_level,
            $r->risk_state,
            $r->risk_detail ?? '',
            $r->risk_last_updated_at ?? '',
        ])->toArray());
    }

    public function exportConditionalAccess(Request $request): StreamedResponse
    {
        $query = DB::table('conditional_access_policies')
            ->leftJoin('managed_tenants', 'conditional_access_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['conditional_access_policies.*', 'managed_tenants.customer_name'])
            ->orderBy('conditional_access_policies.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('conditional_access_policies.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('conditional_access_export.csv', [
            'Policy Name', 'Customer', 'State', 'Conditions', 'Grant Controls', 'Session Controls',
        ], $records->map(fn ($r) => [
            $r->display_name,
            $r->customer_name ?? '',
            $r->state,
            $r->conditions ? implode('; ', array_map(fn ($k, $v) => $k . ': ' . (is_array($v) ? json_encode($v) : $v), array_keys($decoded = json_decode($r->conditions, true) ?? []), array_values($decoded))) : '',
            $r->grant_controls ? implode('; ', array_map(fn ($k, $v) => $k . ': ' . (is_array($v) ? implode(', ', $v) : $v), array_keys($grantDecoded = json_decode($r->grant_controls, true) ?? []), array_values($grantDecoded))) : '',
            '',
        ])->toArray());
    }

    public function exportSignInActivity(Request $request): StreamedResponse
    {
        $query = DB::table('sign_in_summaries')
            ->leftJoin('managed_tenants', 'sign_in_summaries.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['sign_in_summaries.*', 'managed_tenants.customer_name'])
            ->orderByDesc('sign_in_summaries.date');

        if ($request->filled('tenant_id')) {
            $query->where('sign_in_summaries.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('sign_in_activity_export.csv', [
            'Customer', 'Date', 'Total Sign-Ins', 'Successful', 'Failed', 'MFA Prompted',
            'MFA Succeeded', 'MFA Failed', 'Unique Users', 'Top Failure Reason',
        ], $records->map(fn ($r) => [
            $r->customer_name ?? '',
            $r->date,
            $r->total_sign_ins,
            $r->successful_sign_ins,
            $r->failed_sign_ins,
            $r->mfa_prompted,
            $r->mfa_succeeded,
            $r->mfa_failed,
            $r->unique_users,
            $r->top_failure_reason ?? '',
        ])->toArray());
    }

    public function exportAuthMethods(Request $request): StreamedResponse
    {
        $query = DB::table('authentication_method_stats')
            ->leftJoin('managed_tenants', 'authentication_method_stats.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['authentication_method_stats.*', 'managed_tenants.customer_name'])
            ->orderBy('managed_tenants.customer_name');

        if ($request->filled('tenant_id')) {
            $query->where('authentication_method_stats.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('auth_methods_export.csv', [
            'Customer', 'Total Users', 'MFA Capable %', 'Authenticator App', 'FIDO2',
            'Windows Hello', 'Phone SMS', 'Phone Call', 'Email OTP', 'Password Only',
            'Passwordless', 'SSPR Capable', 'SSPR Registered',
        ], $records->map(fn ($r) => [
            $r->customer_name ?? '',
            $r->total_users,
            $r->total_users > 0 ? round(($r->mfa_capable_users / $r->total_users) * 100, 1) : 0,
            $r->authenticator_app_count,
            $r->fido2_count,
            $r->windows_hello_count,
            $r->phone_sms_count,
            $r->phone_call_count,
            $r->email_otp_count,
            $r->password_only_count,
            $r->passwordless_count,
            $r->sspr_capable_count,
            $r->sspr_registered_count,
        ])->toArray());
    }

    public function exportAlerts(Request $request): StreamedResponse
    {
        $query = DB::table('alerts')
            ->leftJoin('managed_tenants', 'alerts.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['alerts.*', 'managed_tenants.customer_name'])
            ->orderByDesc('alerts.created_at');

        if ($request->filled('tenant_id')) {
            $query->where('alerts.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('alerts_export.csv', [
            'ID', 'Customer', 'Type', 'Severity', 'Title', 'Message', 'Status',
            'Acknowledged By', 'Acknowledged At', 'Created At',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->customer_name ?? '',
            $r->type,
            $r->severity,
            $r->title,
            $r->message ?? '',
            $r->status,
            $r->acknowledged_by ?? '',
            $r->acknowledged_at ?? '',
            $r->created_at,
        ])->toArray());
    }

    public function exportRecommendations(Request $request): StreamedResponse
    {
        $query = DB::table('recommendations')
            ->leftJoin('managed_tenants', 'recommendations.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['recommendations.*', 'managed_tenants.customer_name'])
            ->orderByRaw("CASE recommendations.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END");

        if ($request->filled('tenant_id')) {
            $query->where('recommendations.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('recommendations_export.csv', [
            'ID', 'Customer', 'Priority', 'Title', 'Description', 'Status', 'Action URL', 'Created At',
        ], $records->map(fn ($r) => [
            $r->id,
            $r->customer_name ?? '',
            $r->priority,
            $r->title,
            $r->description ?? '',
            $r->status,
            $r->action_url ?? '',
            $r->created_at,
        ])->toArray());
    }

    public function exportComplianceControls(Request $request): StreamedResponse
    {
        $controls = DB::table('compliance_controls')
            ->join('compliance_frameworks', 'compliance_controls.framework_id', '=', 'compliance_frameworks.id')
            ->select([
                'compliance_controls.id as control_id',
                'compliance_frameworks.name as framework_name',
                'compliance_frameworks.version as framework_version',
                'compliance_controls.control_ref',
                'compliance_controls.title',
                'compliance_controls.category',
            ])
            ->orderBy('compliance_frameworks.name')
            ->orderBy('compliance_controls.control_ref')
            ->get();

        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $rows = $controls->map(function ($c) use ($tenantId) {
            $mappings = DB::table('compliance_control_mappings')
                ->where('control_id', $c->control_id)
                ->pluck('finding_rule_key')
                ->toArray();

            if (empty($mappings)) {
                $status = 'Not Mapped';
                $openFindings = 0;
            } else {
                $findingsQuery = DB::table('findings')
                    ->whereIn('rule_key', $mappings)
                    ->whereNotIn('status', ['dismissed', 'resolved']);

                if ($tenantId) {
                    $findingsQuery->where('tenant_id', $tenantId);
                }

                $openFindings = $findingsQuery->count();
                $status = $openFindings > 0 ? 'Non-Compliant' : 'Compliant';
            }

            return [
                $c->framework_name,
                $c->framework_version ?? '',
                $c->control_ref,
                $c->title,
                $c->category ?? '',
                $status,
                $openFindings,
            ];
        })->toArray();

        return $this->streamCsv('compliance_controls_export.csv', [
            'Framework', 'Version', 'Control Ref', 'Title', 'Category', 'Status', 'Open Findings Count',
        ], $rows);
    }

    public function exportCopilotAgents(Request $request): StreamedResponse
    {
        $query = DB::table('copilot_agents')
            ->leftJoin('managed_tenants', 'copilot_agents.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['copilot_agents.*', 'managed_tenants.customer_name'])
            ->orderBy('copilot_agents.display_name');

        if ($request->filled('tenant_id')) {
            $query->where('copilot_agents.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('copilot_agents_export.csv', [
            'Name', 'Customer', 'Agent Type', 'Status', 'Created By', 'Data Sources',
            'Interaction Count', 'Last Activity',
        ], $records->map(fn ($r) => [
            $r->display_name,
            $r->customer_name ?? '',
            $r->agent_type,
            $r->status,
            $r->created_by ?? '',
            $r->data_sources ? implode('; ', json_decode($r->data_sources, true) ?? []) : '',
            $r->interaction_count,
            $r->last_activity_at ?? '',
        ])->toArray());
    }

    public function exportSyncRuns(Request $request): StreamedResponse
    {
        $query = DB::table('sync_runs')
            ->leftJoin('managed_tenants', 'sync_runs.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['sync_runs.*', 'managed_tenants.customer_name'])
            ->orderByDesc('sync_runs.started_at');

        if ($request->filled('tenant_id')) {
            $query->where('sync_runs.tenant_id', (string) $request->string('tenant_id'));
        }

        $records = $query->get();

        return $this->streamCsv('sync_runs_export.csv', [
            'Customer', 'Job', 'Status', 'Records Processed', 'Started At', 'Finished At', 'Duration',
        ], $records->map(fn ($r) => [
            $r->customer_name ?? '',
            $r->sync_job,
            $r->status,
            $r->records_processed,
            $r->started_at ?? '',
            $r->finished_at ?? '',
            ($r->started_at && $r->finished_at) ? (strtotime($r->finished_at) - strtotime($r->started_at)) . 's' : 'N/A',
        ])->toArray());
    }

    public function exportCopilotAudit(Request $request): StreamedResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $controller = new \App\Modules\Copilot\Http\Controllers\CopilotDashboardController();

        // Build a synthetic request and call the audit endpoint to get the data
        $auditRequest = Request::create('/api/v1/copilot/audit', 'GET', $tenantId ? ['tenant_id' => $tenantId] : []);
        $response = $controller->audit($auditRequest);
        $data = json_decode($response->getContent(), true)['data'] ?? [];

        $rows = [];
        foreach ($data['categories'] ?? [] as $category) {
            foreach ($category['checks'] ?? [] as $check) {
                $rows[] = [
                    $category['name'],
                    $check['name'] ?? '',
                    $check['status'] ?? '',
                    is_array($check['value'] ?? null) ? json_encode($check['value']) : (string) ($check['value'] ?? ''),
                    $check['target'] ?? '',
                    $check['detail'] ?? '',
                    $check['remediation'] ?? '',
                ];
            }
        }

        return $this->streamCsv('copilot_audit_export.csv', [
            'Category', 'Check Name', 'Status', 'Current Value', 'Target', 'Detail', 'Remediation',
        ], $rows);
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
