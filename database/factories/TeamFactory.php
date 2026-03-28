<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Team>
 */
class TeamFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company().' FC',
            'variant' => fake()->randomElement(['football_11', 'football_7', 'football_5', 'futsal']),
            'description' => fake()->paragraph(),
            'created_by' => User::factory(),
            'max_members' => null,
        ];
    }
}
