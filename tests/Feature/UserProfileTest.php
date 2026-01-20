<?php

use App\Models\Team;
use App\Models\User;

test('user profile can be viewed by anyone', function () {
    $user = User::factory()->create([
        'name' => 'Test User',
        'bio' => 'Test bio',
        'location' => 'Montevideo',
        'date_of_birth' => '1990-01-01',
    ]);

    $response = $this->getJson("/api/users/{$user->id}");

    $response->assertStatus(200)
        ->assertJson([
            'user' => [
                'id' => $user->id,
                'name' => 'Test User',
                'bio' => 'Test bio',
                'location' => 'Montevideo',
            ],
        ])
        ->assertJsonStructure([
            'user' => [
                'id',
                'name',
                'email',
                'bio',
                'location',
                'date_of_birth',
                'age',
                'avatar_url',
            ],
            'statistics' => [
                'teams_count',
                'matches_played',
                'member_since',
            ],
            'teams',
        ]);
});

test('user profile returns correct statistics', function () {
    $user = User::factory()->create();

    // Create teams for the user
    $team1 = Team::create([
        'name' => 'Team 1',
        'variant' => 'futbol_11',
        'created_by' => $user->id,
    ]);

    $team2 = Team::create([
        'name' => 'Team 2',
        'variant' => 'futbol_11',
        'created_by' => $user->id,
    ]);

    $user->teams()->attach($team1->id, [
        'role' => 'player',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $user->teams()->attach($team2->id, [
        'role' => 'player',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $response = $this->getJson("/api/users/{$user->id}");

    $response->assertStatus(200)
        ->assertJson([
            'statistics' => [
                'teams_count' => 2,
            ],
        ]);
});

test('user profile returns only active teams', function () {
    $user = User::factory()->create();

    $activeTeam = Team::create([
        'name' => 'Active Team',
        'variant' => 'futbol_11',
        'created_by' => $user->id,
    ]);

    $inactiveTeam = Team::create([
        'name' => 'Inactive Team',
        'variant' => 'futbol_11',
        'created_by' => $user->id,
    ]);

    $user->teams()->attach($activeTeam->id, [
        'role' => 'player',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $user->teams()->attach($inactiveTeam->id, [
        'role' => 'player',
        'status' => 'inactive',
        'joined_at' => now(),
    ]);

    $response = $this->getJson("/api/users/{$user->id}");

    $response->assertStatus(200)
        ->assertJsonCount(1, 'teams')
        ->assertJsonFragment(['name' => 'Active Team'])
        ->assertJsonMissing(['name' => 'Inactive Team']);
});

test('nonexistent user returns 404', function () {
    $response = $this->getJson('/api/users/99999');

    $response->assertStatus(404);
});
