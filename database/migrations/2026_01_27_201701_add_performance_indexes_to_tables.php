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
        // Add composite index on team_members for leader queries
        // This improves queries like: WHERE team_id = X AND role IN ('captain', 'co_captain') AND status = 'active'
        // Note: team_members already has (team_id, status) but not (team_id, role, status)
        Schema::table('team_members', function (Blueprint $table) {
            $table->index(['team_id', 'role', 'status'], 'team_members_team_role_status_index');
        });

        // Add composite indexes on matches for team match lookups
        // This improves queries filtering by teams and status
        // Note: matches already has individual indexes on home_team_id, away_team_id, and status
        // but composite indexes are more efficient for combined queries
        Schema::table('matches', function (Blueprint $table) {
            $table->index(['home_team_id', 'status'], 'matches_home_team_status_index');
            $table->index(['away_team_id', 'status'], 'matches_away_team_status_index');
        });

        // Add index on match_availability.status if it doesn't already exist
        // Some databases may already have this index from previous manual operations
        try {
            Schema::table('match_availability', function (Blueprint $table) {
                $table->index('status', 'match_availability_status_index');
            });
        } catch (\Exception $e) {
            // Index likely already exists, skip silently
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('team_members', function (Blueprint $table) {
            $table->dropIndex('team_members_team_role_status_index');
        });

        Schema::table('matches', function (Blueprint $table) {
            $table->dropIndex('matches_home_team_status_index');
            $table->dropIndex('matches_away_team_status_index');
        });

        try {
            Schema::table('match_availability', function (Blueprint $table) {
                $table->dropIndex('match_availability_status_index');
            });
        } catch (\Exception $e) {
            // Index may not exist, skip silently
        }
    }
};
