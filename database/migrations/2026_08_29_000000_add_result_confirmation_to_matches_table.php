<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->foreignId('result_submitted_by_team_id')
                ->nullable()
                ->after('completed_at')
                ->constrained('teams')
                ->nullOnDelete();
            $table->timestamp('result_submitted_at')->nullable()->after('result_submitted_by_team_id');
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('result_submitted_by_team_id');
            $table->dropColumn('result_submitted_at');
        });
    }
};
