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
        Schema::table('matches', function (Blueprint $table) {
            $table->foreignId('tournament_id')->nullable()->after('away_team_id')->constrained('tournaments')->onDelete('cascade');
            $table->foreignId('tournament_round_id')->nullable()->after('tournament_id')->constrained('tournament_rounds')->onDelete('set null');
            $table->integer('bracket_position')->nullable()->after('tournament_round_id');

            // Indexes
            $table->index('tournament_id');
            $table->index('tournament_round_id');
            $table->index('bracket_position');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropForeign(['tournament_id']);
            $table->dropForeign(['tournament_round_id']);
            $table->dropIndex(['tournament_id']);
            $table->dropIndex(['tournament_round_id']);
            $table->dropIndex(['bracket_position']);
            $table->dropColumn(['tournament_id', 'tournament_round_id', 'bracket_position']);
        });
    }
};
