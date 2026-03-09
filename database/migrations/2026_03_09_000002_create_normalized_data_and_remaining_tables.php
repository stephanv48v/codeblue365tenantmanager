<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table): void {
            $table->id();
            $table->string('device_id')->index();
            $table->string('tenant_id')->index();
            $table->string('display_name')->nullable();
            $table->string('os')->nullable();
            $table->string('os_version')->nullable();
            $table->string('compliance_state')->default('unknown');
            $table->string('managed_by')->nullable();
            $table->timestamp('last_sync_at')->nullable();
            $table->timestamp('enrolled_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'device_id']);
        });

        Schema::create('users_normalized', function (Blueprint $table): void {
            $table->id();
            $table->string('entra_user_id')->index();
            $table->string('tenant_id')->index();
            $table->string('display_name')->nullable();
            $table->string('user_principal_name')->nullable();
            $table->string('mail')->nullable();
            $table->boolean('account_enabled')->default(true);
            $table->boolean('mfa_registered')->default(false);
            $table->timestamp('last_sign_in_at')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'entra_user_id']);
        });

        Schema::create('licenses', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('sku_id');
            $table->string('sku_name')->nullable();
            $table->unsignedInteger('total')->default(0);
            $table->unsignedInteger('assigned')->default(0);
            $table->unsignedInteger('available')->default(0);
            $table->timestamps();

            $table->unique(['tenant_id', 'sku_id']);
        });

        Schema::create('alerts', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('type')->index();
            $table->string('severity')->default('info');
            $table->string('title');
            $table->text('message')->nullable();
            $table->string('status')->default('open');
            $table->string('acknowledged_by')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamps();
        });

        Schema::create('recommendations', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->unsignedBigInteger('finding_id')->nullable();
            $table->string('priority')->default('medium');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('action_url')->nullable();
            $table->string('status')->default('open');
            $table->timestamps();

            $table->foreign('finding_id')->references('id')->on('findings')->nullOnDelete();
        });

        Schema::create('settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->json('value')->nullable();
            $table->string('group')->default('general');
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('recommendations');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('licenses');
        Schema::dropIfExists('users_normalized');
        Schema::dropIfExists('devices');
    }
};
