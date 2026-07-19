<?php

declare(strict_types=1);

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->captain = User::factory()->create();
    $this->team = Team::create([
        'name' => 'Dashboard FC',
        'variant' => 'football_11',
        'created_by' => $this->captain->id,
        'max_members' => 25,
    ]);
    TeamMember::create([
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'role' => 'captain',
        'status' => 'active',
    ]);
});

test('base-role player sees upcoming team matches on dashboard', function () {
    $player = User::factory()->create();
    TeamMember::create([
        'user_id' => $player->id,
        'team_id' => $this->team->id,
        'role' => 'player',
        'status' => 'active',
    ]);

    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'variant' => 'football_11',
        'scheduled_at' => now()->addDays(3),
        'location' => 'Test Field',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    $this->actingAs($player)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('hasTeams', true)
            ->has('upcomingMatches', 1)
            ->where('upcomingMatches.0.id', $match->id)
        );
});

test('dashboard ignores non-active memberships', function () {
    $inactiveTeam = Team::create([
        'name' => 'Former FC',
        'variant' => 'football_11',
        'created_by' => $this->captain->id,
        'max_members' => 25,
    ]);
    $formerPlayer = User::factory()->create();
    TeamMember::create([
        'user_id' => $formerPlayer->id,
        'team_id' => $inactiveTeam->id,
        'role' => 'player',
        'status' => 'inactive',
    ]);

    FootballMatch::create([
        'home_team_id' => $inactiveTeam->id,
        'variant' => 'football_11',
        'scheduled_at' => now()->addDays(3),
        'location' => 'Test Field',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    $this->actingAs($formerPlayer)
        ->get(route('dashboard'))
        ->assertInertia(fn ($page) => $page
            ->component('dashboard')
            ->where('hasTeams', false)
            ->has('upcomingMatches', 0)
            ->has('myTeams', 0)
        );
});
