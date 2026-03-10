<?php

declare(strict_types=1);

namespace App\Modules\ConnectWise\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class ConnectWiseController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // --- Summary stats ---
        $baseQuery = DB::table('connectwise_tickets')
            ->when($tenantId, fn ($q, $id) => $q->where('connectwise_tickets.tenant_id', $id));

        $openTickets = (clone $baseQuery)->whereIn('status', ['open', 'new'])->count();
        $inProgress = (clone $baseQuery)->where('status', 'in_progress')->count();
        $closedThisMonth = (clone $baseQuery)
            ->where('status', 'closed')
            ->where('closed_date', '>=', now()->startOfMonth()->toDateString())
            ->count();
        $criticalPriority = (clone $baseQuery)->where('priority', 'critical')->count();

        // --- Tickets list with filters and pagination ---
        $query = DB::table('connectwise_tickets')
            ->leftJoin('managed_tenants', 'connectwise_tickets.tenant_id', '=', 'managed_tenants.tenant_id')
            ->when($tenantId, fn ($q, $id) => $q->where('connectwise_tickets.tenant_id', $id))
            ->select([
                'connectwise_tickets.id',
                'connectwise_tickets.ticket_id',
                'connectwise_tickets.summary',
                'connectwise_tickets.tenant_id',
                'managed_tenants.customer_name',
                'connectwise_tickets.status',
                'connectwise_tickets.priority',
                'connectwise_tickets.source',
                'connectwise_tickets.assigned_to',
                'connectwise_tickets.created_date',
            ]);

        if ($request->filled('status')) {
            $query->where('connectwise_tickets.status', (string) $request->string('status'));
        }

        if ($request->filled('priority')) {
            $query->where('connectwise_tickets.priority', (string) $request->string('priority'));
        }

        if ($request->filled('source')) {
            $query->where('connectwise_tickets.source', (string) $request->string('source'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('connectwise_tickets.summary', 'like', "%{$search}%")
                  ->orWhere('connectwise_tickets.ticket_id', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $tickets = $query->orderByDesc('connectwise_tickets.created_date')
            ->paginate((int) $request->integer('per_page', 25));

        $items = collect($tickets->items())->map(fn ($t) => [
            'id' => $t->id,
            'ticket_id' => $t->ticket_id,
            'summary' => $t->summary,
            'tenant_id' => $t->tenant_id,
            'customer_name' => $t->customer_name,
            'status' => $t->status,
            'priority' => $t->priority,
            'source' => $t->source,
            'assigned_to' => $t->assigned_to,
            'created_date' => $t->created_date,
        ]);

        return ApiResponse::success([
            'summary' => [
                'open_tickets' => $openTickets,
                'in_progress' => $inProgress,
                'closed_this_month' => $closedThisMonth,
                'critical_priority' => $criticalPriority,
            ],
            'tickets' => $items,
            'pagination' => [
                'total' => $tickets->total(),
                'per_page' => $tickets->perPage(),
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
            ],
        ]);
    }

    public function tickets(Request $request): JsonResponse
    {
        $query = DB::table('connectwise_tickets')
            ->leftJoin('managed_tenants', 'connectwise_tickets.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'connectwise_tickets.id',
                'connectwise_tickets.ticket_id',
                'connectwise_tickets.summary',
                'connectwise_tickets.tenant_id',
                'managed_tenants.customer_name',
                'connectwise_tickets.status',
                'connectwise_tickets.priority',
                'connectwise_tickets.source',
                'connectwise_tickets.assigned_to',
                'connectwise_tickets.created_date',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('connectwise_tickets.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('status')) {
            $query->where('connectwise_tickets.status', (string) $request->string('status'));
        }

        if ($request->filled('priority')) {
            $query->where('connectwise_tickets.priority', (string) $request->string('priority'));
        }

        if ($request->filled('source')) {
            $query->where('connectwise_tickets.source', (string) $request->string('source'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('connectwise_tickets.summary', 'like', "%{$search}%")
                  ->orWhere('connectwise_tickets.ticket_id', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $tickets = $query->orderByDesc('connectwise_tickets.created_date')
            ->paginate((int) $request->integer('per_page', 25));

        $items = collect($tickets->items())->map(fn ($t) => [
            'id' => $t->id,
            'ticket_id' => $t->ticket_id,
            'summary' => $t->summary,
            'tenant_id' => $t->tenant_id,
            'customer_name' => $t->customer_name,
            'status' => $t->status,
            'priority' => $t->priority,
            'source' => $t->source,
            'assigned_to' => $t->assigned_to,
            'created_date' => $t->created_date,
        ]);

        return ApiResponse::success([
            'items' => $items,
            'pagination' => [
                'total' => $tickets->total(),
                'per_page' => $tickets->perPage(),
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
            ],
        ]);
    }

    public function config(Request $request): JsonResponse
    {
        $config = DB::table('settings')
            ->where('group', 'connectwise')
            ->orderBy('key')
            ->get(['id', 'key', 'value', 'description'])
            ->map(fn ($s) => [
                'id' => $s->id,
                'key' => $s->key,
                'value' => json_decode($s->value, true),
                'description' => $s->description,
            ]);

        return ApiResponse::success(['config' => $config->toArray()]);
    }

    public function updateConfig(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'site_url' => ['sometimes', 'string', 'url'],
            'company_id' => ['sometimes', 'string'],
            'default_board' => ['sometimes', 'string'],
            'auto_create' => ['sometimes', 'boolean'],
            'severity_threshold' => ['sometimes', 'string', 'in:low,medium,high,critical'],
        ]);

        $now = now();

        foreach ($validated as $key => $value) {
            DB::table('settings')->updateOrInsert(
                ['key' => "connectwise.{$key}"],
                [
                    'value' => json_encode($value),
                    'group' => 'connectwise',
                    'updated_at' => $now,
                ]
            );
        }

        DB::table('audit_logs')->insert([
            'event_type' => 'connectwise.config_updated',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode($validated, JSON_THROW_ON_ERROR),
            'created_at' => $now,
        ]);

        return ApiResponse::success(['message' => 'ConnectWise configuration updated.']);
    }

    public function createTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'string'],
            'summary' => ['required', 'string', 'max:500'],
            'description' => ['sometimes', 'string'],
            'priority' => ['required', 'string', 'in:low,medium,high,critical'],
            'source' => ['sometimes', 'string'],
            'board' => ['sometimes', 'string'],
        ]);

        $tenant = DB::table('managed_tenants')
            ->where('tenant_id', $validated['tenant_id'])
            ->first();

        if ($tenant === null) {
            return ApiResponse::error('tenant_not_found', 'Tenant not found.', 404);
        }

        $now = now();
        $ticketId = 'CW-' . strtoupper(substr(md5((string) microtime(true)), 0, 8));

        $id = DB::table('connectwise_tickets')->insertGetId([
            'tenant_id' => $validated['tenant_id'],
            'ticket_id' => $ticketId,
            'summary' => $validated['summary'],
            'status' => 'open',
            'priority' => $validated['priority'],
            'source' => $validated['source'] ?? 'manual',
            'board_name' => $validated['board'] ?? null,
            'assigned_to' => $request->user()?->email,
            'created_date' => $now->toDateString(),
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('audit_logs')->insert([
            'event_type' => 'connectwise.ticket_created',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'ticket_id' => $ticketId,
                'id' => $id,
                'tenant_id' => $validated['tenant_id'],
                'summary' => $validated['summary'],
            ], JSON_THROW_ON_ERROR),
            'created_at' => $now,
        ]);

        return ApiResponse::success([
            'message' => 'Ticket created successfully.',
            'id' => $id,
            'ticket_id' => $ticketId,
        ]);
    }
}
