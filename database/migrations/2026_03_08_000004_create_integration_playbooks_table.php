<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('integration_playbooks', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('integration_slug')->index();
            $table->string('version')->default('1.0.0');
            $table->string('owner')->nullable();
            $table->jsonb('prerequisites')->nullable();
            $table->jsonb('steps')->nullable();
            $table->jsonb('permissions')->nullable();
            $table->jsonb('gdap_requirements')->nullable();
            $table->jsonb('consent_requirements')->nullable();
            $table->jsonb('troubleshooting')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integration_playbooks');
    }
};
