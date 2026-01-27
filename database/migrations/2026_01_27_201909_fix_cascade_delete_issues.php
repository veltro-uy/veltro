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
        // Fix teams.created_by - make it nullable and change to SET NULL
        Schema::table('teams', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->change();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });

        // Fix user_commendations - preserve commendations when users are deleted
        Schema::table('user_commendations', function (Blueprint $table) {
            $table->dropForeign(['from_user_id']);
            $table->dropForeign(['to_user_id']);
        });

        Schema::table('user_commendations', function (Blueprint $table) {
            $table->foreignId('from_user_id')->nullable()->change();
            $table->foreignId('to_user_id')->nullable()->change();
            $table->foreign('from_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('to_user_id')->references('id')->on('users')->onDelete('set null');
        });

        // Fix profile_comments - preserve comments when users are deleted
        Schema::table('profile_comments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['profile_user_id']);
        });

        Schema::table('profile_comments', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->foreignId('profile_user_id')->nullable()->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('profile_user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert teams.created_by
        Schema::table('teams', function (Blueprint $table) {
            $table->dropForeign(['created_by']);
        });

        Schema::table('teams', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable(false)->change();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('cascade');
        });

        // Revert user_commendations
        Schema::table('user_commendations', function (Blueprint $table) {
            $table->dropForeign(['from_user_id']);
            $table->dropForeign(['to_user_id']);
        });

        Schema::table('user_commendations', function (Blueprint $table) {
            $table->foreignId('from_user_id')->nullable(false)->change();
            $table->foreignId('to_user_id')->nullable(false)->change();
            $table->foreign('from_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('to_user_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Revert profile_comments
        Schema::table('profile_comments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['profile_user_id']);
        });

        Schema::table('profile_comments', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable(false)->change();
            $table->foreignId('profile_user_id')->nullable(false)->change();
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('profile_user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
