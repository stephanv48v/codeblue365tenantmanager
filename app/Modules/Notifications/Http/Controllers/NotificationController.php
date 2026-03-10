<?php

declare(strict_types=1);

namespace App\Modules\Notifications\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;

class NotificationController extends Controller
{
    public function channels(Request $request): JsonResponse
    {
        $query = DB::table('notification_channels')
            ->select([
                'notification_channels.id',
                'notification_channels.name',
                'notification_channels.type',
                'notification_channels.enabled',
                'notification_channels.last_sent_at',
            ]);

        if ($request->filled('type')) {
            $query->where('notification_channels.type', (string) $request->string('type'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('notification_channels.name', 'like', "%{$search}%")
                  ->orWhere('notification_channels.type', 'like', "%{$search}%");
            });
        }

        $channels = $query->orderBy('notification_channels.name')->get();

        return ApiResponse::success(['channels' => $channels]);
    }

    public function createChannel(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'in:email,slack,teams,webhook,pagerduty'],
            'config' => ['required', 'array'],
            'enabled' => ['sometimes', 'boolean'],
        ]);

        $now = now();

        $channelId = DB::table('notification_channels')->insertGetId([
            'name' => $validated['name'],
            'type' => $validated['type'],
            'config_json' => json_encode($validated['config'], JSON_THROW_ON_ERROR),
            'enabled' => $validated['enabled'] ?? true,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        DB::table('audit_logs')->insert([
            'event_type' => 'notifications.channel_created',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'channel_id' => $channelId,
                'name' => $validated['name'],
                'type' => $validated['type'],
            ], JSON_THROW_ON_ERROR),
            'created_at' => $now,
        ]);

        return ApiResponse::success([
            'message' => 'Notification channel created.',
            'channel_id' => $channelId,
        ]);
    }

    public function updateChannel(Request $request, int $id): JsonResponse
    {
        $channel = DB::table('notification_channels')->where('id', $id)->first();

        if ($channel === null) {
            return ApiResponse::error('channel_not_found', 'Notification channel not found.', 404);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'string', 'in:email,slack,teams,webhook,pagerduty'],
            'config' => ['sometimes', 'array'],
            'enabled' => ['sometimes', 'boolean'],
        ]);

        $updateData = ['updated_at' => now()];

        if (isset($validated['name'])) {
            $updateData['name'] = $validated['name'];
        }
        if (isset($validated['type'])) {
            $updateData['type'] = $validated['type'];
        }
        if (isset($validated['config'])) {
            $updateData['config_json'] = json_encode($validated['config'], JSON_THROW_ON_ERROR);
        }
        if (isset($validated['enabled'])) {
            $updateData['enabled'] = $validated['enabled'];
        }

        DB::table('notification_channels')->where('id', $id)->update($updateData);

        DB::table('audit_logs')->insert([
            'event_type' => 'notifications.channel_updated',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'channel_id' => $id,
                'changes' => array_keys($validated),
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success(['message' => 'Notification channel updated.']);
    }

    public function deleteChannel(int $id): JsonResponse
    {
        $channel = DB::table('notification_channels')->where('id', $id)->first();

        if ($channel === null) {
            return ApiResponse::error('channel_not_found', 'Notification channel not found.', 404);
        }

        DB::table('notification_channels')->where('id', $id)->delete();

        DB::table('audit_logs')->insert([
            'event_type' => 'notifications.channel_deleted',
            'actor_identifier' => null,
            'payload' => json_encode([
                'channel_id' => $id,
                'name' => $channel->name,
                'type' => $channel->type,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success(['message' => 'Notification channel deleted.']);
    }

    public function rules(Request $request): JsonResponse
    {
        $query = DB::table('notification_rules')
            ->leftJoin('notification_channels', 'notification_rules.channel_id', '=', 'notification_channels.id')
            ->select([
                'notification_rules.id',
                'notification_rules.event_type',
                'notification_rules.severity_threshold',
                'notification_channels.name as channel_name',
                'notification_rules.enabled',
            ]);

        if ($request->filled('event_type')) {
            $query->where('notification_rules.event_type', (string) $request->string('event_type'));
        }

        if ($request->filled('enabled')) {
            $query->where('notification_rules.enabled', $request->boolean('enabled'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->string('search');
            $query->where(function ($q) use ($search): void {
                $q->where('notification_rules.event_type', 'like', "%{$search}%")
                  ->orWhere('notification_channels.name', 'like', "%{$search}%");
            });
        }

        $rules = $query->orderBy('notification_rules.event_type')->get();

        return ApiResponse::success(['rules' => $rules]);
    }

    public function updateRule(Request $request, int $id): JsonResponse
    {
        $rule = DB::table('notification_rules')->where('id', $id)->first();

        if ($rule === null) {
            return ApiResponse::error('rule_not_found', 'Notification rule not found.', 404);
        }

        $validated = $request->validate([
            'event_type' => ['sometimes', 'string'],
            'channel_id' => ['sometimes', 'integer'],
            'enabled' => ['sometimes', 'boolean'],
            'severity_threshold' => ['sometimes', 'string', 'in:all,low,medium,high,critical'],
        ]);

        $updateData = ['updated_at' => now()];

        if (isset($validated['event_type'])) {
            $updateData['event_type'] = $validated['event_type'];
        }
        if (isset($validated['channel_id'])) {
            $updateData['channel_id'] = $validated['channel_id'];
        }
        if (isset($validated['enabled'])) {
            $updateData['enabled'] = $validated['enabled'];
        }
        if (isset($validated['severity_threshold'])) {
            $updateData['severity_threshold'] = $validated['severity_threshold'];
        }

        DB::table('notification_rules')->where('id', $id)->update($updateData);

        DB::table('audit_logs')->insert([
            'event_type' => 'notifications.rule_updated',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode([
                'rule_id' => $id,
                'changes' => array_keys($validated),
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return ApiResponse::success(['message' => 'Notification rule updated.']);
    }
}
