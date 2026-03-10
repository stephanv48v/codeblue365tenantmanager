<?php

declare(strict_types=1);

namespace App\Modules\Dlp\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class DlpController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // --- Build summary stats ---
        $policyQuery = DB::table('dlp_policies')
            ->when($tenantId, fn ($q, $id) => $q->where('dlp_policies.tenant_id', $id));

        $totalPolicies = (clone $policyQuery)->count();
        $activePolicies = (clone $policyQuery)->where('status', 'enabled')->count();
        $totalMatches30d = (int) (clone $policyQuery)->sum('matches_last_30d');
        $overrides = (int) (clone $policyQuery)->sum('overrides_last_30d');
        $falsePositives = (int) (clone $policyQuery)->sum('false_positives_last_30d');

        $labelsQuery = DB::table('sensitivity_labels')
            ->when($tenantId, fn ($q, $id) => $q->where('sensitivity_labels.tenant_id', $id));

        $totalLabels = (clone $labelsQuery)->count();
        $autoLabelingEnabled = (clone $labelsQuery)->where('auto_labeling_enabled', true)->count();
        $encryptionEnabled = (clone $labelsQuery)->where('encryption_enabled', true)->count();

        // --- Policies list with aliased field names ---
        $policies = DB::table('dlp_policies')
            ->leftJoin('managed_tenants', 'dlp_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn ($q, $id) => $q->where('dlp_policies.tenant_id', $id))
            ->select([
                'dlp_policies.id',
                'dlp_policies.tenant_id',
                'managed_tenants.customer_name',
                'dlp_policies.policy_name',
                'dlp_policies.status',
                'dlp_policies.mode',
                'dlp_policies.locations_json',
                'dlp_policies.rule_count',
                'dlp_policies.matches_last_30d',
                'dlp_policies.overrides_last_30d as overrides',
            ])
            ->orderBy('dlp_policies.policy_name')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'tenant_id' => $p->tenant_id,
                'customer_name' => $p->customer_name,
                'policy_name' => $p->policy_name,
                'status' => $p->status,
                'mode' => $p->mode,
                'locations' => $p->locations_json ? json_decode($p->locations_json, true) : [],
                'rule_count' => (int) $p->rule_count,
                'matches_last_30d' => (int) $p->matches_last_30d,
                'overrides' => (int) $p->overrides,
            ]);

        // --- Labels list with aliased field names ---
        $labels = DB::table('sensitivity_labels')
            ->leftJoin('managed_tenants', 'sensitivity_labels.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn ($q, $id) => $q->where('sensitivity_labels.tenant_id', $id))
            ->select([
                'sensitivity_labels.id',
                'sensitivity_labels.tenant_id',
                'managed_tenants.customer_name',
                'sensitivity_labels.label_name',
                'sensitivity_labels.parent_label',
                'sensitivity_labels.priority',
                'sensitivity_labels.is_active',
                'sensitivity_labels.auto_labeling_enabled',
                'sensitivity_labels.encryption_enabled',
                'sensitivity_labels.content_marking_enabled',
                'sensitivity_labels.files_labeled_count',
                'sensitivity_labels.emails_labeled_count',
                'sensitivity_labels.sites_labeled_count',
            ])
            ->orderBy('sensitivity_labels.label_name')
            ->get()
            ->map(fn ($l) => [
                'id' => $l->id,
                'tenant_id' => $l->tenant_id,
                'customer_name' => $l->customer_name,
                'label_name' => $l->label_name,
                'parent_label' => $l->parent_label,
                'priority' => (int) $l->priority,
                'is_active' => (bool) $l->is_active,
                'auto_labeling_enabled' => (bool) $l->auto_labeling_enabled,
                'encryption_enabled' => (bool) $l->encryption_enabled,
                'content_marking' => $l->content_marking_enabled ? 'Enabled' : null,
                'files_labeled' => (int) $l->files_labeled_count,
                'emails_labeled' => (int) $l->emails_labeled_count,
                'sites_labeled' => (int) $l->sites_labeled_count,
            ]);

        return ApiResponse::success([
            'summary' => [
                'total_policies' => $totalPolicies,
                'active_policies' => $activePolicies,
                'total_matches_30d' => $totalMatches30d,
                'overrides' => $overrides,
                'false_positives' => $falsePositives,
                'total_labels' => $totalLabels,
                'auto_labeling_enabled' => $autoLabelingEnabled,
                'encryption_enabled' => $encryptionEnabled,
            ],
            'policies' => $policies,
            'labels' => $labels,
        ]);
    }

    public function policies(Request $request): JsonResponse
    {
        $query = DB::table('dlp_policies')
            ->leftJoin('managed_tenants', 'dlp_policies.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'dlp_policies.id',
                'dlp_policies.tenant_id',
                'managed_tenants.customer_name',
                'dlp_policies.policy_name',
                'dlp_policies.status',
                'dlp_policies.mode',
                'dlp_policies.locations_json',
                'dlp_policies.rule_count',
                'dlp_policies.matches_last_30d',
                'dlp_policies.overrides_last_30d as overrides',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('dlp_policies.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('dlp_policies.status', (string) $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('dlp_policies.policy_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $policies = $query->orderBy('dlp_policies.policy_name')
            ->paginate((int) $request->integer('per_page', 25));

        $items = collect($policies->items())->map(fn ($p) => [
            'id' => $p->id,
            'tenant_id' => $p->tenant_id,
            'customer_name' => $p->customer_name,
            'policy_name' => $p->policy_name,
            'status' => $p->status,
            'mode' => $p->mode,
            'locations' => $p->locations_json ? json_decode($p->locations_json, true) : [],
            'rule_count' => (int) $p->rule_count,
            'matches_last_30d' => (int) $p->matches_last_30d,
            'overrides' => (int) $p->overrides,
        ]);

        return ApiResponse::success([
            'items' => $items,
            'pagination' => [
                'total' => $policies->total(),
                'per_page' => $policies->perPage(),
                'current_page' => $policies->currentPage(),
                'last_page' => $policies->lastPage(),
            ],
        ]);
    }

    public function labels(Request $request): JsonResponse
    {
        $query = DB::table('sensitivity_labels')
            ->leftJoin('managed_tenants', 'sensitivity_labels.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'sensitivity_labels.id',
                'sensitivity_labels.tenant_id',
                'managed_tenants.customer_name',
                'sensitivity_labels.label_name',
                'sensitivity_labels.parent_label',
                'sensitivity_labels.priority',
                'sensitivity_labels.is_active',
                'sensitivity_labels.auto_labeling_enabled',
                'sensitivity_labels.encryption_enabled',
                'sensitivity_labels.content_marking_enabled',
                'sensitivity_labels.files_labeled_count',
                'sensitivity_labels.emails_labeled_count',
                'sensitivity_labels.sites_labeled_count',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('sensitivity_labels.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('sensitivity_labels.label_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $labels = $query->orderBy('sensitivity_labels.label_name')
            ->paginate((int) $request->integer('per_page', 25));

        $items = collect($labels->items())->map(fn ($l) => [
            'id' => $l->id,
            'tenant_id' => $l->tenant_id,
            'customer_name' => $l->customer_name,
            'label_name' => $l->label_name,
            'parent_label' => $l->parent_label,
            'priority' => (int) $l->priority,
            'is_active' => (bool) $l->is_active,
            'auto_labeling_enabled' => (bool) $l->auto_labeling_enabled,
            'encryption_enabled' => (bool) $l->encryption_enabled,
            'content_marking' => $l->content_marking_enabled ? 'Enabled' : null,
            'files_labeled' => (int) $l->files_labeled_count,
            'emails_labeled' => (int) $l->emails_labeled_count,
            'sites_labeled' => (int) $l->sites_labeled_count,
        ]);

        return ApiResponse::success([
            'items' => $items,
            'pagination' => [
                'total' => $labels->total(),
                'per_page' => $labels->perPage(),
                'current_page' => $labels->currentPage(),
                'last_page' => $labels->lastPage(),
            ],
        ]);
    }
}
