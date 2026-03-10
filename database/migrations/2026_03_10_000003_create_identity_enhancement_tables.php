<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('authentication_method_stats', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->integer('total_users')->default(0);
            $table->integer('mfa_capable_users')->default(0);
            $table->integer('authenticator_app_count')->default(0);
            $table->integer('fido2_count')->default(0);
            $table->integer('windows_hello_count')->default(0);
            $table->integer('phone_sms_count')->default(0);
            $table->integer('phone_call_count')->default(0);
            $table->integer('email_otp_count')->default(0);
            $table->integer('password_only_count')->default(0);
            $table->integer('passwordless_count')->default(0);
            $table->integer('sspr_capable_count')->default(0);
            $table->integer('sspr_registered_count')->default(0);
            $table->timestamps();
            $table->unique(['tenant_id']);
        });

        Schema::create('directory_role_assignments', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('user_id');
            $table->string('user_principal_name')->nullable();
            $table->string('display_name')->nullable();
            $table->string('role_id');
            $table->string('role_display_name');
            $table->string('assignment_type')->default('direct');
            $table->string('status')->default('active');
            $table->timestamp('start_date')->nullable();
            $table->timestamp('end_date')->nullable();
            $table->boolean('is_built_in_role')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'user_id', 'role_id']);
        });

        Schema::create('guest_users', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('user_id');
            $table->string('display_name')->nullable();
            $table->string('user_principal_name')->nullable();
            $table->string('mail')->nullable();
            $table->string('user_type')->default('Guest');
            $table->string('external_user_state')->nullable();
            $table->string('creation_type')->default('Invitation');
            $table->string('company_name')->nullable();
            $table->string('domain')->nullable();
            $table->timestamp('created_datetime')->nullable();
            $table->timestamp('last_sign_in_at')->nullable();
            $table->boolean('account_enabled')->default(true);
            $table->timestamps();
            $table->unique(['tenant_id', 'user_id']);
        });

        Schema::create('sign_in_summaries', function (Blueprint $table): void {
            $table->id();
            $table->string('tenant_id')->index();
            $table->date('date');
            $table->integer('total_sign_ins')->default(0);
            $table->integer('successful_sign_ins')->default(0);
            $table->integer('failed_sign_ins')->default(0);
            $table->integer('interactive_sign_ins')->default(0);
            $table->integer('non_interactive_sign_ins')->default(0);
            $table->integer('mfa_prompted')->default(0);
            $table->integer('mfa_succeeded')->default(0);
            $table->integer('mfa_failed')->default(0);
            $table->string('top_failure_reason')->nullable();
            $table->integer('top_failure_count')->default(0);
            $table->integer('unique_users')->default(0);
            $table->json('by_location')->nullable();
            $table->json('by_app')->nullable();
            $table->timestamps();
            $table->unique(['tenant_id', 'date']);
        });

        Schema::table('users_normalized', function (Blueprint $table): void {
            $table->string('user_type')->default('Member')->after('account_enabled');
            $table->string('job_title')->nullable()->after('user_type');
            $table->string('department')->nullable()->after('job_title');
            $table->timestamp('created_at_entra')->nullable()->after('department');
        });
    }

    public function down(): void
    {
        Schema::table('users_normalized', function (Blueprint $table): void {
            $table->dropColumn(['user_type', 'job_title', 'department', 'created_at_entra']);
        });

        Schema::dropIfExists('sign_in_summaries');
        Schema::dropIfExists('guest_users');
        Schema::dropIfExists('directory_role_assignments');
        Schema::dropIfExists('authentication_method_stats');
    }
};
