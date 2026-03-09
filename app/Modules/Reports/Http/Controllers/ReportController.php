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
