<?php

use App\Models\FootballMatch;
use App\Models\MatchAvailability;
use App\Models\Team;
use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->team = Team::create([
        'name' => 'Test Team',
        'variant' => 'football_11',
        'created_by' => $this->user->id,
    ]);
    $this->team->teamMembers()->create(['user_id' => $this->user->id, 'role' => 'captain']);

    $this->opponent = Team::create([
        'name' => 'Opponent Team',
        'variant' => 'football_11',
        'created_by' => $this->user->id,
    ]);

    $this->match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addDays(3),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'confirmed',
        'created_by' => $this->user->id,
    ]);
});

test('authenticated user can update their availability status', function () {
    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'available',
            'team_id' => $this->team->id,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(MatchAvailability::where('match_id', $this->match->id)
        ->where('user_id', $this->user->id)
        ->where('team_id', $this->team->id)
        ->first())
        ->status->toBe('available')
        ->confirmed_at->not->toBeNull();
});

test('user can change their availability status', function () {
    // Create initial availability
    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    // Update to available
    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'available',
            'team_id' => $this->team->id,
        ])
        ->assertRedirect();

    expect(MatchAvailability::where('match_id', $this->match->id)
        ->where('user_id', $this->user->id)
        ->first())
        ->status->toBe('available');
});

test('availability update requires valid status', function () {
    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'invalid-status',
            'team_id' => $this->team->id,
        ])
        ->assertSessionHasErrors('status');
});

test('availability update requires team_id', function () {
    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'available',
        ])
        ->assertSessionHasErrors('team_id');
});

test('user cannot update availability for team they are not member of', function () {
    $otherUser = User::factory()->create();
    $otherTeam = Team::create([
        'name' => 'Other Team',
        'variant' => 'football_11',
        'created_by' => $otherUser->id,
    ]);

    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'available',
            'team_id' => $otherTeam->id,
        ])
        ->assertForbidden();
});

test('user cannot update availability for team not playing in match', function () {
    $unrelatedTeam = Team::create([
        'name' => 'Unrelated Team',
        'variant' => 'football_11',
        'created_by' => $this->user->id,
    ]);
    $unrelatedTeam->teamMembers()->create(['user_id' => $this->user->id, 'role' => 'player']);

    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'available',
            'team_id' => $unrelatedTeam->id,
        ])
        ->assertForbidden();
});

test('guest cannot update availability', function () {
    $this->post(route('matches.availability.update', $this->match->id), [
        'status' => 'available',
        'team_id' => $this->team->id,
    ])->assertRedirect(route('login'));
});

test('team captain sees warning when not enough players are available', function () {
    // Create team members
    $players = User::factory()->count(5)->create();
    foreach ($players as $player) {
        $this->team->teamMembers()->create(['user_id' => $player->id, 'role' => 'player']);
    }

    // Mark most as unavailable (only 2 available including captain)
    foreach ($players->take(3) as $player) {
        MatchAvailability::create([
            'match_id' => $this->match->id,
            'user_id' => $player->id,
            'team_id' => $this->team->id,
            'status' => 'unavailable',
            'confirmed_at' => now(),
        ]);
    }

    // Captain marks themselves as available (2 total available, need 11)
    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'available',
            'team_id' => $this->team->id,
        ])
        ->assertSessionHas('warning');
});

test('confirmed_at is set when status is updated', function () {
    $availability = MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
        'confirmed_at' => null,
    ]);

    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'available',
            'team_id' => $this->team->id,
        ]);

    expect($availability->fresh()->confirmed_at)->not->toBeNull();
});

test('availability status accepts all valid options', function (string $status) {
    $this->actingAs($this->user)
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => $status,
            'team_id' => $this->team->id,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect(MatchAvailability::where('match_id', $this->match->id)
        ->where('user_id', $this->user->id)
        ->first())
        ->status->toBe($status);
})->with(['available', 'maybe', 'unavailable']);
