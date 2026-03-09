<?php

declare(strict_types=1);

namespace App\Modules\Settings\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController
{
    public function show(string $group): JsonResponse
    {
        $settings = DB::table('settings')
            ->where('group', $group)
            ->orderBy('key')
            ->get(['id', 'key', 'value', 'group', 'description'])
            ->map(fn ($s) => [
                'id' => $s->id,
                'key' => $s->key,
                'value' => json_decode($s->value, true),
                'group' => $s->group,
                'description' => $s->description,
            ]);

        return ApiResponse::success(['items' => $settings->toArray()]);
    }

    public function update(Request $request, string $group): JsonResponse
    {
        $settings = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'present',
        ]);

        $now = now();

        foreach ($settings['settings'] as $item) {
            DB::table('settings')->updateOrInsert(
                ['key' => $item['key']],
                [
                    'value' => json_encode($item['value']),
                    'group' => $group,
                    'updated_at' => $now,
                ]
            );
        }

        DB::table('audit_logs')->insert([
            'event_type' => 'settings.updated',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode(['group' => $group]),
            'created_at' => $now,
        ]);

        return ApiResponse::success(['message' => 'Settings updated.']);
    }
}
