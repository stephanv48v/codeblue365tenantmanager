<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('findings', function (Blueprint $table): void {
            $table->string('rule_key')->default('legacy_finding')->after('tenant_id')->index();
            $table->string('status')->default('open')->after('severity')->index();
            $table->timestamp('resolved_at')->nullable()->after('last_detected_at');
        });
    }

    public function down(): void
    {
        Schema::table('findings', function (Blueprint $table): void {
            $table->dropColumn(['rule_key', 'status', 'resolved_at']);
        });
    }
};
