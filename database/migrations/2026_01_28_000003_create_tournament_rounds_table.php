<?php

declare(strict_types=1);

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
        Schema::create('tournament_rounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tournament_id')->constrained('tournaments')->onDelete('cascade');
            $table->integer('round_number');
            $table->string('name');
            $table->timestamp('starts_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('tournament_id');
            $table->index('round_number');
            $table->unique(['tournament_id', 'round_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tournament_rounds');
    }
};
