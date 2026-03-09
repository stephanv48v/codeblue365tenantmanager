<?php

declare(strict_types=1);

namespace App\Modules\Reports\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function exportTenants(): StreamedResponse
    {
        $tenants = DB::table('managed_tenants')->orderBy('customer_name')->get();

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

    public function exportScores(): StreamedResponse
    {
        $scores = DB::table('scores')->orderByDesc('calculated_at')->get();

        return $this->streamCsv('scores_export.csv', [
            'ID', 'Tenant ID', 'Identity Currency', 'Device Currency', 'App Currency',
            'Security Posture', 'Governance Readiness', 'Integration Readiness', 'Composite Score', 'Calculated At',
        ], $scores->map(fn ($s) => [
            $s->id, $s->tenant_id, $s->identity_currency, $s->device_currency, $s->app_currency,
            $s->security_posture, $s->governance_readiness, $s->integration_readiness, $s->composite_score, $s->calculated_at,
        ])->toArray());
    }

    public function exportIdentity(): StreamedResponse
    {
        $users = DB::table('users_normalized')
            ->leftJoin('managed_tenants', 'users_normalized.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'users_normalized.*',
                'managed_tenants.customer_name',
            ])
            ->orderBy('users_normalized.display_name')
            ->get();

        return $this->streamCsv('identity_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Display Name', 'UPN', 'Enabled',
            'MFA Registered', 'Last Sign-In', 'Assigned Roles', 'Created At',
        ], $users->map(fn ($u) => [
            $u->id, $u->tenant_id, $u->customer_name ?? '', $u->display_name, $u->user_principal_name,
            $u->account_enabled ? 'Yes' : 'No', $u->mfa_registered ? 'Yes' : 'No',
            $u->last_sign_in_at, $u->assigned_roles ?? '', $u->created_at,
        ])->toArray());
    }

    public function exportDeviceCompliance(): StreamedResponse
    {
        $devices = DB::table('devices')
            ->leftJoin('managed_tenants', 'devices.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['devices.*', 'managed_tenants.customer_name'])
            ->orderBy('devices.device_name')
            ->get();

        return $this->streamCsv('device_compliance_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Device Name', 'OS', 'OS Version',
            'Compliance State', 'Managed', 'Enrolled At',
        ], $devices->map(fn ($d) => [
            $d->id, $d->tenant_id, $d->customer_name ?? '', $d->device_name,
            $d->operating_system, $d->os_version, $d->compliance_state,
            $d->is_managed ? 'Yes' : 'No', $d->enrolled_at ?? '',
        ])->toArray());
    }

    public function exportLicenseUtilization(): StreamedResponse
    {
        $licenses = DB::table('licenses')
            ->leftJoin('managed_tenants', 'licenses.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['licenses.*', 'managed_tenants.customer_name'])
            ->orderBy('managed_tenants.customer_name')
            ->get();

        return $this->streamCsv('license_utilization_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'SKU', 'Total Units', 'Assigned Units',
            'Available', 'Waste %',
        ], $licenses->map(fn ($l) => [
            $l->id, $l->tenant_id, $l->customer_name ?? '', $l->sku_name,
            $l->total_units, $l->assigned_units,
            $l->total_units - $l->assigned_units,
            $l->total_units > 0 ? round((($l->total_units - $l->assigned_units) / $l->total_units) * 100, 1) : 0,
        ])->toArray());
    }

    public function exportSecurityPosture(): StreamedResponse
    {
        $scores = DB::table('scores')
            ->join('managed_tenants', 'scores.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'scores.*',
                'managed_tenants.customer_name',
            ])
            ->whereIn('scores.id', function ($query): void {
                $query->selectRaw('MAX(id)')->from('scores')->groupBy('tenant_id');
            })
            ->orderByDesc('scores.composite_score')
            ->get();

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

    public function exportServiceHealth(): StreamedResponse
    {
        $events = DB::table('service_health_events')
            ->leftJoin('managed_tenants', 'service_health_events.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select(['service_health_events.*', 'managed_tenants.customer_name'])
            ->orderByDesc('service_health_events.start_at')
            ->get();

        return $this->streamCsv('service_health_export.csv', [
            'ID', 'Tenant ID', 'Customer', 'Event ID', 'Service', 'Title',
            'Classification', 'Status', 'Start', 'End',
        ], $events->map(fn ($e) => [
            $e->id, $e->tenant_id, $e->customer_name ?? '', $e->event_id,
            $e->service, $e->title, $e->classification, $e->status,
            $e->start_at, $e->end_at,
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
