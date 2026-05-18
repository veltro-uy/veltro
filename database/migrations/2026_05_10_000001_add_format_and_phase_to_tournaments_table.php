<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->enum('format', ['single_elimination', 'league', 'group_stage_knockout'])
                ->default('single_elimination')
                ->after('variant');

            $table->enum('phase', ['not_started', 'league', 'group_stage', 'knockout', 'completed'])
                ->default('not_started')
                ->after('format');

            $table->unsignedSmallInteger('group_count')->nullable()->after('phase');
            $table->unsignedSmallInteger('group_size')->nullable()->after('group_count');

            $table->index('format');
        });

        // Backfill phase for existing tournaments based on status.
        DB::table('tournaments')->where('status', 'completed')->update(['phase' => 'completed']);
        DB::table('tournaments')->where('status', 'in_progress')->update(['phase' => 'knockout']);
    }

    public function down(): void
    {
        Schema::table('tournaments', function (Blueprint $table) {
            $table->dropIndex(['format']);
            $table->dropColumn(['format', 'phase', 'group_count', 'group_size']);
        });
    }
};
