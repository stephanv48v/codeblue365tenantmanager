<?php

declare(strict_types=1);

namespace App\Modules\Exchange\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class ExchangeController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $mailboxQuery = DB::table('mailboxes')
            ->when($tenantId, fn ($q, $id) => $q->where('mailboxes.tenant_id', $id));

        $totalMailboxes = (clone $mailboxQuery)->count();
        $sharedMailboxes = (clone $mailboxQuery)->where('mailbox_type', 'shared')->count();
        $totalStorageUsed = (int) (clone $mailboxQuery)->sum('storage_used_bytes');

        $forwardingRules = DB::table('forwarding_rules')
            ->when($tenantId, fn ($q, $id) => $q->where('forwarding_rules.tenant_id', $id))
            ->count();

        $externalForwarding = DB::table('forwarding_rules')
            ->where('is_external', true)
            ->when($tenantId, fn ($q, $id) => $q->where('forwarding_rules.tenant_id', $id))
            ->count();

        // Paginated mailbox list
        $mbQuery = DB::table('mailboxes')
            ->leftJoin('managed_tenants', 'mailboxes.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'mailboxes.id',
                'mailboxes.tenant_id',
                'managed_tenants.customer_name',
                'mailboxes.display_name',
                'mailboxes.user_principal_name as email',
                'mailboxes.mailbox_type as type',
                'mailboxes.storage_used_bytes as storage_used',
                'mailboxes.items_count',
                'mailboxes.last_activity_date as last_activity',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('mailboxes.tenant_id', $id));

        if ($request->filled('type')) {
            $mbQuery->where('mailboxes.mailbox_type', (string) $request->string('type'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $mbQuery->where(function ($q) use ($search): void {
                $q->where('mailboxes.display_name', 'like', "%{$search}%")
                  ->orWhere('mailboxes.user_principal_name', 'like', "%{$search}%");
            });
        }

        $mailboxes = $mbQuery->orderBy('mailboxes.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        // Top forwarding rules preview
        $forwarding = DB::table('forwarding_rules')
            ->leftJoin('managed_tenants', 'forwarding_rules.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'forwarding_rules.id',
                'forwarding_rules.tenant_id',
                'managed_tenants.customer_name',
                'forwarding_rules.display_name as user',
                'forwarding_rules.forwarding_target as forwarding_target',
                'forwarding_rules.forwarding_type as type',
                'forwarding_rules.is_external',
                'forwarding_rules.status',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('forwarding_rules.tenant_id', $id))
            ->orderByDesc('forwarding_rules.is_external')
            ->limit(10)
            ->get();

        return ApiResponse::success([
            'total_mailboxes' => $totalMailboxes,
            'shared_mailboxes' => $sharedMailboxes,
            'total_storage_used' => $totalStorageUsed,
            'forwarding_rules' => $forwardingRules,
            'external_forwarding' => $externalForwarding,
            'mailboxes' => $mailboxes->items(),
            'forwarding' => $forwarding,
            'pagination' => [
                'total' => $mailboxes->total(),
                'per_page' => $mailboxes->perPage(),
                'current_page' => $mailboxes->currentPage(),
                'last_page' => $mailboxes->lastPage(),
            ],
        ]);
    }

    public function mailboxes(Request $request): JsonResponse
    {
        $query = DB::table('mailboxes')
            ->leftJoin('managed_tenants', 'mailboxes.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'mailboxes.*',
                'managed_tenants.customer_name',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('mailboxes.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('mailbox_type')) {
            $query->where('mailboxes.mailbox_type', (string) $request->string('mailbox_type'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('mailboxes.display_name', 'like', "%{$search}%")
                  ->orWhere('mailboxes.user_principal_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $mailboxes = $query->orderBy('mailboxes.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $mailboxes->items(),
            'pagination' => [
                'total' => $mailboxes->total(),
                'per_page' => $mailboxes->perPage(),
                'current_page' => $mailboxes->currentPage(),
                'last_page' => $mailboxes->lastPage(),
            ],
        ]);
    }

    public function forwardingRules(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $totalQuery = DB::table('forwarding_rules')
            ->when($tenantId, fn ($q, $id) => $q->where('forwarding_rules.tenant_id', $id));
        $total = (clone $totalQuery)->count();
        $externalCount = (clone $totalQuery)->where('is_external', true)->count();
        $internalCount = $total - $externalCount;

        $query = DB::table('forwarding_rules')
            ->leftJoin('managed_tenants', 'forwarding_rules.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'forwarding_rules.id',
                'forwarding_rules.tenant_id',
                'managed_tenants.customer_name',
                'forwarding_rules.display_name as user',
                'forwarding_rules.forwarding_target as forwarding_target',
                'forwarding_rules.forwarding_type as type',
                'forwarding_rules.is_external',
                'forwarding_rules.status',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('forwarding_rules.tenant_id', $id));

        if ($request->filled('is_external')) {
            $query->where('forwarding_rules.is_external', $request->boolean('is_external'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('forwarding_rules.display_name', 'like', "%{$search}%")
                  ->orWhere('forwarding_rules.forwarding_target', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $rules = $query->orderByDesc('forwarding_rules.is_external')
            ->orderBy('forwarding_rules.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'total' => $total,
            'external_count' => $externalCount,
            'internal_count' => $internalCount,
            'items' => $rules->items(),
            'pagination' => [
                'total' => $rules->total(),
                'per_page' => $rules->perPage(),
                'current_page' => $rules->currentPage(),
                'last_page' => $rules->lastPage(),
            ],
        ]);
    }

    public function mailFlowRules(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $statsQuery = DB::table('mail_flow_rules')
            ->when($tenantId, fn ($q, $id) => $q->where('mail_flow_rules.tenant_id', $id));
        $totalRules = (clone $statsQuery)->count();
        $enabled = (clone $statsQuery)->where('state', 'Enabled')->count();
        $disabled = $totalRules - $enabled;

        $query = DB::table('mail_flow_rules')
            ->leftJoin('managed_tenants', 'mail_flow_rules.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'mail_flow_rules.id',
                'mail_flow_rules.tenant_id',
                'managed_tenants.customer_name',
                'mail_flow_rules.rule_name as rule_name',
                'mail_flow_rules.state',
                'mail_flow_rules.priority',
                'mail_flow_rules.description',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('mail_flow_rules.tenant_id', $id));

        if ($request->filled('state')) {
            $query->where('mail_flow_rules.state', (string) $request->string('state'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('mail_flow_rules.rule_name', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $rules = $query->orderBy('mail_flow_rules.priority')
            ->orderBy('mail_flow_rules.rule_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'total' => $totalRules,
            'enabled' => $enabled,
            'disabled' => $disabled,
            'items' => $rules->items(),
            'pagination' => [
                'total' => $rules->total(),
                'per_page' => $rules->perPage(),
                'current_page' => $rules->currentPage(),
                'last_page' => $rules->lastPage(),
            ],
        ]);
    }

    public function distributionLists(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        $totalQuery = DB::table('distribution_lists')
            ->when($tenantId, fn ($q, $id) => $q->where('distribution_lists.tenant_id', $id));
        $total = (clone $totalQuery)->count();
        $externalSendersCount = (clone $totalQuery)->where('external_senders_allowed', true)->count();

        $query = DB::table('distribution_lists')
            ->leftJoin('managed_tenants', 'distribution_lists.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'distribution_lists.id',
                'distribution_lists.tenant_id',
                'managed_tenants.customer_name',
                'distribution_lists.display_name',
                'distribution_lists.email_address as email',
                'distribution_lists.group_type',
                'distribution_lists.member_count',
                'distribution_lists.external_senders_allowed as external_senders_allowed',
                'distribution_lists.managed_by',
            ])
            ->when($tenantId, fn ($q, $id) => $q->where('distribution_lists.tenant_id', $id));

        if ($request->filled('group_type')) {
            $query->where('distribution_lists.group_type', (string) $request->string('group_type'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('distribution_lists.display_name', 'like', "%{$search}%")
                  ->orWhere('distribution_lists.email_address', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $lists = $query->orderBy('distribution_lists.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'total' => $total,
            'external_senders_count' => $externalSendersCount,
            'items' => $lists->items(),
            'pagination' => [
                'total' => $lists->total(),
                'per_page' => $lists->perPage(),
                'current_page' => $lists->currentPage(),
                'last_page' => $lists->lastPage(),
            ],
        ]);
    }
}
