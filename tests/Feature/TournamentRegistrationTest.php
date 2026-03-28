<?php

use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('team captain can register team', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'public',
        'variant' => 'football_11',
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tournament_teams', [
        'tournament_id' => $tournament->id,
        'team_id' => $team->id,
        'status' => 'approved', // Auto-approved for public tournaments
    ]);
});

test('cannot register team twice', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'public',
        'variant' => 'football_11',
    ]);

    // First registration
    $tournament->tournamentTeams()->create([
        'team_id' => $team->id,
        'status' => 'approved',
        'registered_by' => $user->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertSessionHasErrors();
});

test('cannot register after deadline', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'public',
        'variant' => 'football_11',
        'registration_deadline' => now()->subDay(), // Past deadline
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertSessionHasErrors();
});

test('cannot register when tournament full', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'public',
        'variant' => 'football_11',
        'max_teams' => 4,
    ]);

    // Fill tournament
    for ($i = 0; $i < 4; $i++) {
        $otherTeam = Team::factory()->create(['variant' => 'football_11']);
        $tournament->tournamentTeams()->create([
            'team_id' => $otherTeam->id,
            'status' => 'approved',
            'registered_by' => $user->id,
            'registered_at' => now(),
        ]);
    }

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertSessionHasErrors();
});

test('organizer can approve registration', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'visibility' => 'invite_only',
    ]);

    $registration = TournamentTeam::factory()->create([
        'tournament_id' => $tournament->id,
        'status' => 'pending',
    ]);

    $this->actingAs($organizer);

    $response = $this->post("/tournament-registrations/{$registration->id}/approve");

    $response->assertRedirect();
    $this->assertDatabaseHas('tournament_teams', [
        'id' => $registration->id,
        'status' => 'approved',
    ]);
});

test('organizer can reject registration', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'visibility' => 'invite_only',
    ]);

    $registration = TournamentTeam::factory()->create([
        'tournament_id' => $tournament->id,
        'status' => 'pending',
    ]);

    $this->actingAs($organizer);

    $response = $this->post("/tournament-registrations/{$registration->id}/reject");

    $response->assertRedirect();
    $this->assertDatabaseHas('tournament_teams', [
        'id' => $registration->id,
        'status' => 'rejected',
    ]);
});

test('team captain can withdraw registration', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'variant' => 'football_11',
    ]);

    $registration = TournamentTeam::factory()->create([
        'tournament_id' => $tournament->id,
        'team_id' => $team->id,
        'status' => 'approved',
        'registered_by' => $user->id,
    ]);

    $this->actingAs($user);

    $response = $this->delete("/tournament-registrations/{$registration->id}");

    $response->assertRedirect();
    $this->assertDatabaseHas('tournament_teams', [
        'id' => $registration->id,
        'status' => 'withdrawn',
    ]);
});

test('registration requires matching variant', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_7']); // Different variant
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'public',
        'variant' => 'football_11', // Different variant
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertSessionHasErrors();
});

test('non-captain cannot register team', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'player', // Not a captain
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'public',
        'variant' => 'football_11',
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertForbidden();
});

test('non-organizer cannot approve registration', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $otherUser = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
    ]);

    $registration = TournamentTeam::factory()->create([
        'tournament_id' => $tournament->id,
        'status' => 'pending',
    ]);

    $this->actingAs($otherUser);

    $response = $this->post("/tournament-registrations/{$registration->id}/approve");

    $response->assertForbidden();
});

test('invite_only registration creates pending status', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'invite_only',
        'variant' => 'football_11',
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tournament_teams', [
        'tournament_id' => $tournament->id,
        'team_id' => $team->id,
        'status' => 'pending',
    ]);
});

test('re-registration after withdrawal succeeds', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'public',
        'variant' => 'football_11',
    ]);

    // Create withdrawn registration
    $tournament->tournamentTeams()->create([
        'team_id' => $team->id,
        'status' => 'withdrawn',
        'registered_by' => $user->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tournament_teams', [
        'tournament_id' => $tournament->id,
        'team_id' => $team->id,
        'status' => 'approved',
    ]);
});

test('re-registration after rejection succeeds', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $team = Team::factory()->create(['variant' => 'football_11']);
    $team->teamMembers()->create([
        'user_id' => $user->id,
        'role' => 'captain',
        'status' => 'active',
        'joined_at' => now(),
    ]);

    $tournament = Tournament::factory()->create([
        'status' => 'registration_open',
        'visibility' => 'invite_only',
        'variant' => 'football_11',
    ]);

    // Create rejected registration
    $tournament->tournamentTeams()->create([
        'team_id' => $team->id,
        'status' => 'rejected',
        'registered_by' => $user->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/register", [
        'team_id' => $team->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tournament_teams', [
        'tournament_id' => $tournament->id,
        'team_id' => $team->id,
        'status' => 'pending', // invite_only -> pending
    ]);
});
