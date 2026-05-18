<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->foreignId('tournament_group_id')
                ->nullable()
                ->after('tournament_round_id')
                ->constrained('tournament_groups')
                ->nullOnDelete();

            $table->unsignedSmallInteger('matchday')->nullable()->after('bracket_position');

            $table->index('tournament_group_id');
            $table->index(['tournament_id', 'matchday']);
        });
    }

    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropForeign(['tournament_group_id']);
            $table->dropIndex(['tournament_group_id']);
            $table->dropIndex(['tournament_id', 'matchday']);
            $table->dropColumn(['tournament_group_id', 'matchday']);
        });
    }
};
