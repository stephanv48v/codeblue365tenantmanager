<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('copilot_usage', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('user_principal_name');
            $table->string('display_name');
            $table->date('last_activity_date')->nullable();
            $table->date('last_activity_teams')->nullable();
            $table->date('last_activity_word')->nullable();
            $table->date('last_activity_excel')->nullable();
            $table->date('last_activity_powerpoint')->nullable();
            $table->date('last_activity_outlook')->nullable();
            $table->date('last_activity_onenote')->nullable();
            $table->date('last_activity_copilot_chat')->nullable();
            $table->boolean('copilot_license_assigned')->default(false);
            $table->timestamps();
            $table->unique(['tenant_id', 'user_principal_name']);
        });

        Schema::create('copilot_agents', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('agent_id');
            $table->string('display_name');
            $table->text('description')->nullable();
            $table->string('agent_type')->default('declarative');
            $table->string('status')->default('active');
            $table->string('created_by')->nullable();
            $table->json('data_sources')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->integer('interaction_count')->default(0);
            $table->timestamps();
            $table->unique(['tenant_id', 'agent_id']);
        });

        Schema::create('sharepoint_sites', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('site_id');
            $table->string('site_url');
            $table->string('display_name');
            $table->bigInteger('storage_used_bytes')->default(0);
            $table->bigInteger('storage_allocated_bytes')->default(0);
            $table->integer('file_count')->default(0);
            $table->integer('active_file_count')->default(0);
            $table->date('last_activity_date')->nullable();
            $table->integer('page_view_count')->default(0);
            $table->string('external_sharing')->default('disabled');
            $table->boolean('is_public')->default(false);
            $table->string('owner_name')->nullable();
            $table->string('owner_email')->nullable();
            $table->string('sensitivity_label')->nullable();
            $table->string('site_template')->nullable();
            $table->boolean('has_guest_access')->default(false);
            $table->integer('permissioned_user_count')->default(0);
            $table->boolean('restricted_content_discovery')->default(false);
            $table->timestamps();
            $table->unique(['tenant_id', 'site_id']);
        });

        Schema::create('copilot_readiness', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->decimal('overall_score', 5, 2)->default(0);
            $table->decimal('data_exposure_score', 5, 2)->default(0);
            $table->decimal('access_governance_score', 5, 2)->default(0);
            $table->decimal('data_protection_score', 5, 2)->default(0);
            $table->decimal('ai_governance_score', 5, 2)->default(0);
            $table->integer('copilot_licensed_users')->default(0);
            $table->integer('copilot_active_users')->default(0);
            $table->integer('sites_with_everyone_access')->default(0);
            $table->integer('sites_with_external_sharing')->default(0);
            $table->integer('sites_with_guest_access')->default(0);
            $table->integer('public_sites_count')->default(0);
            $table->integer('sensitivity_labels_count')->default(0);
            $table->decimal('sensitivity_labels_applied_pct', 5, 2)->default(0);
            $table->decimal('m365_apps_on_current_channel_pct', 5, 2)->default(0);
            $table->json('details')->nullable();
            $table->timestamp('calculated_at');
            $table->timestamps();
            $table->index(['tenant_id', 'calculated_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('copilot_readiness');
        Schema::dropIfExists('sharepoint_sites');
        Schema::dropIfExists('copilot_agents');
        Schema::dropIfExists('copilot_usage');
    }
};
