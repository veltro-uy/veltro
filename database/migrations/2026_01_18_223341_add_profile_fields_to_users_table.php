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
        Schema::table('users', function (Blueprint $table) {
            $table->text('bio')->nullable()->after('phone_number');
            $table->string('location', 100)->nullable()->after('bio');
            $table->date('date_of_birth')->nullable()->after('location');
            $table->string('avatar_path')->nullable()->after('google_avatar_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['bio', 'location', 'date_of_birth', 'avatar_path']);
        });
    }
};
