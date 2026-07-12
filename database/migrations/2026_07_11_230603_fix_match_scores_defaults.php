<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * The score columns were created nullable with no default, so a freshly
     * created match had NULL scores. Eloquent's increment() then produced
     * `column = column + 1` = NULL + 1 = NULL, leaving the scoreboard stuck at
     * "0 - 0" while individual goal events were still recorded. This gives the
     * columns a 0 default and backfills existing matches from their goal events.
     */
    public function up(): void
    {
        // Recompute scores from recorded goal events so already-broken matches
        // (NULL score but real goals) display the correct result.
        DB::statement(<<<'SQL'
            UPDATE matches SET
                home_score = (
                    SELECT COUNT(*) FROM match_events e
                    WHERE e.match_id = matches.id
                      AND e.team_id = matches.home_team_id
                      AND e.event_type = 'goal'
                ),
                away_score = (
                    SELECT COUNT(*) FROM match_events e
                    WHERE e.match_id = matches.id
                      AND e.team_id = matches.away_team_id
                      AND e.event_type = 'goal'
                )
        SQL);

        Schema::table('matches', function (Blueprint $table) {
            $table->integer('home_score')->nullable()->default(0)->change();
            $table->integer('away_score')->nullable()->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->integer('home_score')->nullable()->default(null)->change();
            $table->integer('away_score')->nullable()->default(null)->change();
        });
    }
};
