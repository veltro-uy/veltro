<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tournament_teams', function (Blueprint $table) {
            $table->foreignId('tournament_group_id')
                ->nullable()
                ->after('seed')
                ->constrained('tournament_groups')
                ->nullOnDelete();

            $table->index('tournament_group_id');
        });
    }

    public function down(): void
    {
        Schema::table('tournament_teams', function (Blueprint $table) {
            $table->dropForeign(['tournament_group_id']);
            $table->dropIndex(['tournament_group_id']);
            $table->dropColumn('tournament_group_id');
        });
    }
};
