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
        Schema::create('user_commendations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('to_user_id')->constrained('users')->onDelete('cascade');
            $table->enum('category', ['friendly', 'skilled', 'teamwork', 'leadership']);
            $table->timestamps();

            // Composite unique constraint: one commendation per category per player pair
            $table->unique(['from_user_id', 'to_user_id', 'category'], 'user_commendations_unique');

            // Indexes for fast queries
            $table->index('from_user_id');
            $table->index('to_user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_commendations');
    }
};
