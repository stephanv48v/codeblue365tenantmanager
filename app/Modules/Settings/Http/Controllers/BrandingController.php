<?php

declare(strict_types=1);

namespace App\Modules\Settings\Http\Controllers;

use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BrandingController
{
    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        // Remove old logo if exists
        $existing = DB::table('settings')->where('key', 'branding.logo_path')->value('value');
        if ($existing) {
            $existingPath = json_decode($existing, true);
            if ($existingPath) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $existingPath));
            }
        }

        $extension = $request->file('logo')->extension();
        $path = $request->file('logo')->storeAs('branding', 'logo.' . $extension, 'public');

        $now = now();
        DB::table('settings')->updateOrInsert(
            ['key' => 'branding.logo_path'],
            [
                'value' => json_encode('/storage/' . $path),
                'group' => 'branding',
                'updated_at' => $now,
            ]
        );

        DB::table('audit_logs')->insert([
            'event_type' => 'branding.logo_uploaded',
            'actor_identifier' => $request->user()?->email,
            'payload' => json_encode(['path' => '/storage/' . $path]),
            'created_at' => $now,
        ]);

        return ApiResponse::success(['path' => '/storage/' . $path]);
    }

    public function deleteLogo(Request $request): JsonResponse
    {
        $setting = DB::table('settings')->where('key', 'branding.logo_path')->first();

        if ($setting) {
            $currentPath = json_decode($setting->value, true);
            if ($currentPath) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $currentPath));
            }

            $now = now();
            DB::table('settings')->where('key', 'branding.logo_path')
                ->update(['value' => json_encode(null), 'updated_at' => $now]);

            DB::table('audit_logs')->insert([
                'event_type' => 'branding.logo_removed',
                'actor_identifier' => $request->user()?->email,
                'payload' => json_encode(['removed_path' => $currentPath]),
                'created_at' => $now,
            ]);
        }

        return ApiResponse::success(['message' => 'Logo removed.']);
    }
}
