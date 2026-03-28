<?php

namespace Database\Factories;

use App\Models\Team;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\TournamentTeam>
 */
class TournamentTeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tournament_id' => Tournament::factory(),
            'team_id' => Team::factory(),
            'status' => 'pending',
            'seed' => null,
            'registered_by' => User::factory(),
            'registered_at' => now(),
            'approved_at' => null,
        ];
    }
}
