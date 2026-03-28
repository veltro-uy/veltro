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
        Schema::create('tournament_teams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained('tournaments')->onDelete('cascade');
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'rejected', 'withdrawn'])->default('pending');
            $table->integer('seed')->nullable();
            $table->foreignId('registered_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('registered_at');
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            // Unique constraint - a team can only register once per tournament
            $table->unique(['tournament_id', 'team_id']);

            // Indexes
            $table->index('tournament_id');
            $table->index('team_id');
            $table->index('status');
            $table->index('seed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_teams');
    }
};
