<?php

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
        Schema::create('matches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('home_team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('away_team_id')->nullable()->constrained('teams')->onDelete('cascade');
            $table->enum('variant', ['football_11', 'football_7', 'football_5', 'futsal']);
            $table->dateTime('scheduled_at');
            $table->string('location');
            $table->string('location_coords')->nullable();
            $table->enum('match_type', ['friendly', 'competitive'])->default('friendly');
            $table->enum('status', ['available', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])->default('available');
            $table->integer('home_score')->nullable();
            $table->integer('away_score')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('variant');
            $table->index('scheduled_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('matches');
    }
};
