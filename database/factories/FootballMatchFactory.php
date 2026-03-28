<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\FootballMatch>
 */
class FootballMatchFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'home_team_id' => Team::factory(),
            'away_team_id' => Team::factory(),
            'variant' => fake()->randomElement(['football_11', 'football_7', 'football_5', 'futsal']),
            'scheduled_at' => now()->addDays(7),
            'location' => fake()->address(),
            'match_type' => 'friendly',
            'status' => 'available',
            'created_by' => User::factory(),
        ];
    }
}
