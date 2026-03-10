<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compliance_frameworks', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('version')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });

        Schema::create('compliance_controls', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('framework_id');
            $table->string('control_ref');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category')->nullable();
            $table->timestamps();
            $table->foreign('framework_id')->references('id')->on('compliance_frameworks')->cascadeOnDelete();
            $table->index(['framework_id', 'control_ref']);
        });

        Schema::create('compliance_control_mappings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('control_id');
            $table->string('finding_rule_key')->index();
            $table->timestamps();
            $table->foreign('control_id')->references('id')->on('compliance_controls')->cascadeOnDelete();
            $table->unique(['control_id', 'finding_rule_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compliance_control_mappings');
        Schema::dropIfExists('compliance_controls');
        Schema::dropIfExists('compliance_frameworks');
    }
};
