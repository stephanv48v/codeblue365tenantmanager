<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $defaults = [
            ['key' => 'branding.company_name', 'value' => json_encode('CodeBlue 365'), 'group' => 'branding', 'description' => 'Company name displayed in sidebar and reports'],
            ['key' => 'branding.tagline', 'value' => json_encode('Tenant Manager'), 'group' => 'branding', 'description' => 'Subtitle/tagline for sidebar'],
            ['key' => 'branding.primary_color', 'value' => json_encode('#3b82f6'), 'group' => 'branding', 'description' => 'Primary brand color (hex)'],
            ['key' => 'branding.logo_path', 'value' => json_encode(null), 'group' => 'branding', 'description' => 'Path to uploaded company logo'],
            ['key' => 'branding.report_subtitle', 'value' => json_encode('Managed Services Platform'), 'group' => 'branding', 'description' => 'Default subtitle for PDF reports'],
        ];

        foreach ($defaults as $setting) {
            DB::table('settings')->insertOrIgnore(array_merge($setting, [
                'created_at' => $now,
                'updated_at' => $now,
            ]));
        }
    }

    public function down(): void
    {
        DB::table('settings')->where('group', 'branding')->delete();
    }
};
