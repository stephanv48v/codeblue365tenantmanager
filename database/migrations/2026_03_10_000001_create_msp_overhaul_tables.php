<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conditional_access_policies', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('policy_id');
            $table->string('display_name');
            $table->string('state')->default('enabled');
            $table->json('conditions')->nullable();
            $table->json('grant_controls')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'policy_id']);
        });

        Schema::create('risky_users', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('user_id');
            $table->string('user_principal_name')->nullable();
            $table->string('display_name')->nullable();
            $table->string('risk_level')->default('none');
            $table->string('risk_state')->default('none');
            $table->string('risk_detail')->nullable();
            $table->timestamp('risk_last_updated_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'user_id']);
        });

        Schema::create('secure_scores', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->decimal('current_score', 8, 2);
            $table->decimal('max_score', 8, 2);
            $table->json('category_scores')->nullable();
            $table->timestamp('fetched_at');
            $table->timestamps();
            $table->index(['tenant_id', 'fetched_at']);
        });

        Schema::create('service_health_events', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('event_id');
            $table->string('service');
            $table->string('title');
            $table->string('classification')->default('advisory');
            $table->string('status')->default('investigating');
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_health_events');
        Schema::dropIfExists('secure_scores');
        Schema::dropIfExists('risky_users');
        Schema::dropIfExists('conditional_access_policies');
    }
};
