<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('entra_object_id')->nullable()->unique();
            $table->string('entra_tenant_id')->nullable()->index();
            $table->timestamp('last_login_at')->nullable();
            $table->timestamps();
        });

        Schema::create('managed_tenants', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->unique();
            $table->string('customer_name')->index();
            $table->string('primary_domain');
            $table->string('gdap_status')->default('unknown');
            $table->timestamp('gdap_expiry_at')->nullable();
            $table->string('integration_status')->default('not_configured');
            $table->timestamp('last_sync_at')->nullable();
            $table->string('assigned_engineer')->nullable();
            $table->string('support_tier')->nullable();
            $table->timestamps();
        });

        Schema::create('tenant_domains', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('managed_tenant_id')->constrained('managed_tenants')->cascadeOnDelete();
            $table->string('domain');
            $table->timestamps();
            $table->unique(['managed_tenant_id', 'domain']);
        });

        Schema::create('integrations', function (Blueprint $table): void {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('status')->default('not_configured');
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('sync_runs', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('sync_job');
            $table->string('status')->default('pending');
            $table->unsignedInteger('records_processed')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();
        });

        Schema::create('scores', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->unsignedTinyInteger('identity_currency');
            $table->unsignedTinyInteger('device_currency');
            $table->unsignedTinyInteger('app_currency');
            $table->unsignedTinyInteger('security_posture');
            $table->unsignedTinyInteger('governance_readiness');
            $table->unsignedTinyInteger('integration_readiness');
            $table->decimal('composite_score', 5, 2);
            $table->timestamp('calculated_at');
            $table->timestamps();
        });

        Schema::create('findings', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('category')->index();
            $table->string('severity')->index();
            $table->text('description');
            $table->json('evidence')->nullable();
            $table->text('impact')->nullable();
            $table->text('recommended_remediation')->nullable();
            $table->timestamp('first_detected_at')->nullable();
            $table->timestamp('last_detected_at')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('event_type')->index();
            $table->string('actor_identifier')->nullable()->index();
            $table->json('payload')->nullable();
            $table->timestamp('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('findings');
        Schema::dropIfExists('scores');
        Schema::dropIfExists('sync_runs');
        Schema::dropIfExists('integrations');
        Schema::dropIfExists('tenant_domains');
        Schema::dropIfExists('managed_tenants');
        Schema::dropIfExists('users');
    }
};
