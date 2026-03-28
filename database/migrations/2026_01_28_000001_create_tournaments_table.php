<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tournaments', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('logo_url')->nullable();
            $table->string('logo_path')->nullable();
            $table->foreignId('organizer_id')->constrained('users')->onDelete('cascade');
            $table->enum('visibility', ['public', 'invite_only'])->default('public');
            $table->enum('status', ['draft', 'registration_open', 'in_progress', 'completed', 'cancelled'])->default('draft');
            $table->enum('variant', ['football_11', 'football_7', 'football_5', 'futsal']);
            $table->integer('max_teams')->default(8);
            $table->integer('min_teams')->default(4);
            $table->timestamp('registration_deadline')->nullable();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('organizer_id');
            $table->index('status');
            $table->index('visibility');
            $table->index('variant');
            $table->index('starts_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournaments');
    }
};
