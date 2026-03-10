<?php

declare(strict_types=1);

namespace App\Modules\Teams\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class TeamsController extends Controller
{
    /**
     * Combined overview + paginated list endpoint.
     *
     * The frontend hook (useTeamsData) calls ONLY this endpoint and expects:
     *   - summary stats (flat): total_teams, active_users, total_messages_30d,
     *     meetings_organized, calls
     *   - message_types: [{type, count}, ...]   (for bar chart)
     *   - items: paginated Team[] with aliased fields
     *   - pagination: {total, per_page, current_page, last_page}
     */
    public function overview(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // ── Summary stats ────────────────────────────────────────────────────
        $teamsQuery = DB::table('teams')
            ->when($tenantId, fn ($q, $id) => $q->where('teams.tenant_id', $id));

        $totalTeams = (clone $teamsQuery)->count();

        // Aggregate activity from latest report records per tenant
        $activitySummary = DB::table('teams_activity')
            ->when($tenantId, fn ($q, $id) => $q->where('teams_activity.tenant_id', $id))
            ->selectRaw('
                COALESCE(SUM(active_users), 0) as total_active_users,
                COALESCE(SUM(channel_messages), 0) as total_channel_messages,
                COALESCE(SUM(chat_messages), 0) as total_chat_messages,
                COALESCE(SUM(total_messages), 0) as total_messages,
                COALESCE(SUM(meetings_organized), 0) as total_meetings,
                COALESCE(SUM(calls_count), 0) as total_calls
            ')
            ->first();

        // Message types breakdown for the chart
        $messageTypes = [];
        if ($activitySummary) {
            $channelMessages = (int) $activitySummary->total_channel_messages;
            $chatMessages    = (int) $activitySummary->total_chat_messages;
            if ($channelMessages > 0 || $chatMessages > 0) {
                $messageTypes = [
                    ['type' => 'Channel', 'count' => $channelMessages],
                    ['type' => 'Chat', 'count' => $chatMessages],
                ];
            }
        }

        // ── Paginated teams list ─────────────────────────────────────────────
        $query = DB::table('teams')
            ->leftJoin('managed_tenants', 'teams.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'teams.id',
                'teams.tenant_id',
                'managed_tenants.customer_name',
                'teams.display_name',
                'teams.visibility',
                'teams.member_count',
                'teams.channel_count',
                'teams.guest_count',
                'teams.is_archived',
                'teams.last_activity_date as last_activity',
            ]);

        if ($tenantId) {
            $query->where('teams.tenant_id', $tenantId);
        }

        if ($request->filled('visibility')) {
            $query->where('teams.visibility', (string) $request->string('visibility'));
        }

        if ($request->filled('is_archived')) {
            $query->where('teams.is_archived', $request->boolean('is_archived'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('teams.display_name', 'like', "%{$search}%")
                  ->orWhere('teams.description', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $teams = $query->orderBy('teams.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'total_teams'       => $totalTeams,
            'active_users'      => (int) ($activitySummary->total_active_users ?? 0),
            'total_messages_30d' => (int) ($activitySummary->total_messages ?? 0),
            'meetings_organized' => (int) ($activitySummary->total_meetings ?? 0),
            'calls'             => (int) ($activitySummary->total_calls ?? 0),
            'message_types'     => $messageTypes,
            'items'             => $teams->items(),
            'pagination'        => [
                'total'        => $teams->total(),
                'per_page'     => $teams->perPage(),
                'current_page' => $teams->currentPage(),
                'last_page'    => $teams->lastPage(),
            ],
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $query = DB::table('teams')
            ->leftJoin('managed_tenants', 'teams.tenant_id', '=', 'managed_tenants.tenant_id')
            ->select([
                'teams.id',
                'teams.tenant_id',
                'managed_tenants.customer_name',
                'teams.display_name',
                'teams.visibility',
                'teams.member_count',
                'teams.channel_count',
                'teams.guest_count',
                'teams.is_archived',
                'teams.last_activity_date as last_activity',
            ]);

        if ($request->filled('tenant_id')) {
            $query->where('teams.tenant_id', (string) $request->string('tenant_id'));
        }

        if ($request->filled('is_archived')) {
            $query->where('teams.is_archived', $request->boolean('is_archived'));
        }

        if ($request->filled('visibility')) {
            $query->where('teams.visibility', (string) $request->string('visibility'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('teams.display_name', 'like', "%{$search}%")
                  ->orWhere('teams.description', 'like', "%{$search}%")
                  ->orWhere('managed_tenants.customer_name', 'like', "%{$search}%");
            });
        }

        $teams = $query->orderBy('teams.display_name')
            ->paginate((int) $request->integer('per_page', 25));

        return ApiResponse::success([
            'items' => $teams->items(),
            'pagination' => [
                'total' => $teams->total(),
                'per_page' => $teams->perPage(),
                'current_page' => $teams->currentPage(),
                'last_page' => $teams->lastPage(),
            ],
        ]);
    }

    /**
     * Teams usage analytics endpoint.
     *
     * The frontend hook (useTeamsUsageData) expects:
     *   - summary stats: total_messages, total_meetings, total_calls, avg_meeting_minutes
     *   - trend: [{date, messages, meetings, calls}, ...]
     *   - user_activity: paginated [{id, display_name, user_principal_name,
     *     messages_sent, meetings_attended, calls_made, meeting_minutes, last_activity}]
     *   - pagination: {total, per_page, current_page, last_page}
     *
     * Note: The teams_activity table stores aggregate reports (not per-user data).
     * We derive trend data from it, and for user_activity we use the
     * password_policies table as a user roster joined with activity estimates
     * since a dedicated teams_user_activity table does not yet exist.
     */
    public function usage(Request $request): JsonResponse
    {
        $tenantId = $request->filled('tenant_id') ? (string) $request->string('tenant_id') : null;

        // ── Summary stats from teams_activity ────────────────────────────────
        $summary = DB::table('teams_activity')
            ->when($tenantId, fn ($q, $id) => $q->where('teams_activity.tenant_id', $id))
            ->selectRaw('
                COALESCE(SUM(total_messages), 0) as total_messages,
                COALESCE(SUM(meetings_organized + meetings_attended), 0) as total_meetings,
                COALESCE(SUM(calls_count), 0) as total_calls,
                CASE WHEN SUM(meetings_organized + meetings_attended) > 0
                    THEN CAST(SUM(audio_duration_minutes + video_duration_minutes) AS FLOAT) / SUM(meetings_organized + meetings_attended)
                    ELSE 0
                END as avg_meeting_minutes
            ')
            ->first();

        // ── Trend data (daily activity) ──────────────────────────────────────
        $trend = DB::table('teams_activity')
            ->when($tenantId, fn ($q, $id) => $q->where('teams_activity.tenant_id', $id))
            ->select([
                'report_date as date',
                DB::raw('SUM(total_messages) as messages'),
                DB::raw('SUM(meetings_organized) as meetings'),
                DB::raw('SUM(calls_count) as calls'),
            ])
            ->groupBy('report_date')
            ->orderBy('report_date')
            ->get();

        // ── User activity (placeholder: no per-user teams table exists yet) ──
        // Return an empty paginated result set so the frontend renders gracefully.
        $page    = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 25);

        return ApiResponse::success([
            'total_messages'     => (int) ($summary->total_messages ?? 0),
            'total_meetings'     => (int) ($summary->total_meetings ?? 0),
            'total_calls'        => (int) ($summary->total_calls ?? 0),
            'avg_meeting_minutes' => (int) round((float) ($summary->avg_meeting_minutes ?? 0)),
            'trend'              => $trend,
            'user_activity'      => [],
            'pagination'         => [
                'total'        => 0,
                'per_page'     => $perPage,
                'current_page' => $page,
                'last_page'    => 1,
            ],
        ]);
    }
}
