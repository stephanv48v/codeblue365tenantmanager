<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('role_permissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['role_id', 'permission_id']);
        });

        Schema::create('user_roles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'role_id']);
        });

        Schema::create('gdap_relationships', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('managed_tenant_id')->constrained('managed_tenants')->cascadeOnDelete();
            $table->string('status')->default('unknown')->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->json('role_assignments')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();
        });

        Schema::create('tenant_integrations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('managed_tenant_id')->constrained('managed_tenants')->cascadeOnDelete();
            $table->foreignId('integration_id')->constrained('integrations')->cascadeOnDelete();
            $table->string('status')->default('not_configured')->index();
            $table->timestamp('last_validated_at')->nullable();
            $table->json('validation_payload')->nullable();
            $table->timestamps();
            $table->unique(['managed_tenant_id', 'integration_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_integrations');
        Schema::dropIfExists('gdap_relationships');
        Schema::dropIfExists('user_roles');
        Schema::dropIfExists('role_permissions');
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('roles');
    }
};
