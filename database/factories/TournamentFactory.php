<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Tournament>
 */
class TournamentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(3, true).' Tournament',
            'description' => fake()->paragraph(),
            'organizer_id' => User::factory(),
            'visibility' => 'public',
            'status' => 'draft',
            'variant' => fake()->randomElement(['football_11', 'football_7', 'football_5', 'futsal']),
            'max_teams' => 8,
            'min_teams' => 4,
            'registration_deadline' => now()->addDays(7),
            'starts_at' => now()->addDays(14),
            'ends_at' => now()->addDays(21),
        ];
    }
}
