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
        Schema::table('join_requests', function (Blueprint $table) {
            // Drop the old unique constraint that included status
            $table->dropUnique(['user_id', 'team_id', 'status']);

            // Add new unique constraint without status
            // This prevents users from creating multiple requests to the same team
            $table->unique(['user_id', 'team_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('join_requests', function (Blueprint $table) {
            // Revert to old constraint
            $table->dropUnique(['user_id', 'team_id']);
            $table->unique(['user_id', 'team_id', 'status']);
        });
    }
};
