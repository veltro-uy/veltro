<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->integer('max_members')->nullable()->after('description');
        });

        // Set default max_members based on variant for existing teams
        DB::table('teams')->where('variant', 'football_11')->update(['max_members' => 25]);
        DB::table('teams')->where('variant', 'football_7')->update(['max_members' => 15]);
        DB::table('teams')->where('variant', 'football_5')->update(['max_members' => 10]);
        DB::table('teams')->where('variant', 'futsal')->update(['max_members' => 12]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn('max_members');
        });
    }
};
