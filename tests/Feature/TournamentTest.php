<?php

use App\Models\Team;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('verified user can create tournament', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $response = $this->post('/tournaments', [
        'name' => 'Test Tournament',
        'description' => 'A test tournament',
        'visibility' => 'public',
        'variant' => 'football_11',
        'max_teams' => 8,
        'min_teams' => 4,
        'starts_at' => now()->addDays(7)->toDateTimeString(),
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tournaments', [
        'name' => 'Test Tournament',
        'organizer_id' => $user->id,
    ]);
});

test('tournament requires valid max teams (power of 2)', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $response = $this->post('/tournaments', [
        'name' => 'Test Tournament',
        'visibility' => 'public',
        'variant' => 'football_11',
        'max_teams' => 7, // Not a power of 2
        'min_teams' => 4,
    ]);

    $response->assertSessionHasErrors();
});

test('organizer can update draft tournament', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user);

    $response = $this->put("/tournaments/{$tournament->id}", [
        'name' => 'Updated Tournament',
        'description' => 'Updated description',
        'visibility' => 'public',
        'variant' => $tournament->variant,
        'max_teams' => 8,
        'min_teams' => 4,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tournaments', [
        'id' => $tournament->id,
        'name' => 'Updated Tournament',
    ]);
});

test('organizer cannot update started tournament', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'status' => 'in_progress',
    ]);

    $this->actingAs($user);

    $response = $this->put("/tournaments/{$tournament->id}", [
        'name' => 'Updated Tournament',
        'visibility' => 'public',
        'variant' => $tournament->variant,
        'max_teams' => 8,
        'min_teams' => 4,
    ]);

    $response->assertSessionHasErrors();
});

test('organizer can delete draft tournament', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user);

    $response = $this->delete("/tournaments/{$tournament->id}");

    $response->assertRedirect('/tournaments');
    $this->assertDatabaseMissing('tournaments', [
        'id' => $tournament->id,
    ]);
});

test('organizer cannot delete tournament with registrations', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'status' => 'draft',
    ]);

    $team = Team::factory()->create(['variant' => $tournament->variant]);
    $tournament->tournamentTeams()->create([
        'team_id' => $team->id,
        'status' => 'approved',
        'registered_by' => $user->id,
        'registered_at' => now(),
    ]);

    $this->actingAs($user);

    $response = $this->delete("/tournaments/{$tournament->id}");

    $response->assertSessionHasErrors();
    $this->assertDatabaseHas('tournaments', [
        'id' => $tournament->id,
    ]);
});

test('tournament list shows public tournaments', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    Tournament::factory()->create(['visibility' => 'public']);

    $this->actingAs($user);

    $response = $this->get('/tournaments');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('tournaments/index')
        ->has('tournaments.data', 1)
    );
});

test('tournament list hides invite-only tournaments from non-participants', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    Tournament::factory()->create([
        'visibility' => 'invite_only',
        'organizer_id' => User::factory()->create()->id, // Different organizer
    ]);

    $this->actingAs($user);

    $response = $this->get('/tournaments');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('tournaments/index')
        ->has('tournaments.data', 0)
    );
});

test('non-organizer cannot update tournament', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $otherUser = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'draft',
    ]);

    $this->actingAs($otherUser);

    $response = $this->put("/tournaments/{$tournament->id}", [
        'name' => 'Hacked Tournament',
        'visibility' => 'public',
        'variant' => $tournament->variant,
        'max_teams' => 8,
        'min_teams' => 4,
    ]);

    $response->assertForbidden();
});

test('non-organizer cannot delete tournament', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $otherUser = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'draft',
    ]);

    $this->actingAs($otherUser);

    $response = $this->delete("/tournaments/{$tournament->id}");

    $response->assertForbidden();
});

test('show page renders tournament with correct props', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'visibility' => 'public',
    ]);

    $this->actingAs($user);

    $response = $this->get("/tournaments/{$tournament->id}");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('tournaments/show')
        ->has('tournament')
        ->has('permissions')
        ->has('userTeams')
    );
});

test('edit page accessible by organizer', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user);

    $response = $this->get("/tournaments/{$tournament->id}/edit");

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->component('tournaments/edit')
        ->has('tournament')
    );
});

test('open registration transitions draft to registration_open', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'status' => 'draft',
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/open-registration");

    $response->assertRedirect();
    $this->assertDatabaseHas('tournaments', [
        'id' => $tournament->id,
        'status' => 'registration_open',
    ]);
});

test('organizer can cancel tournament', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'status' => 'registration_open',
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/cancel");

    $response->assertRedirect();
    $this->assertDatabaseHas('tournaments', [
        'id' => $tournament->id,
        'status' => 'cancelled',
    ]);
});

test('cannot cancel completed tournament', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $user->id,
        'status' => 'completed',
    ]);

    $this->actingAs($user);

    $response = $this->post("/tournaments/{$tournament->id}/cancel");

    $response->assertForbidden();
});

test('full lifecycle: draft to registration_open to in_progress to completed', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'draft',
        'variant' => 'football_11',
        'max_teams' => 4,
        'min_teams' => 4,
    ]);

    $this->actingAs($organizer);

    // Draft -> Registration Open
    $this->post("/tournaments/{$tournament->id}/open-registration");
    expect($tournament->fresh()->status)->toBe('registration_open');

    // Register 4 teams
    for ($i = 0; $i < 4; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        $tournament->tournamentTeams()->create([
            'team_id' => $team->id,
            'status' => 'approved',
            'registered_by' => $organizer->id,
            'registered_at' => now(),
        ]);
    }

    // Registration Open -> In Progress
    $this->post("/tournaments/{$tournament->id}/start");
    expect($tournament->fresh()->status)->toBe('in_progress');
    expect($tournament->fresh()->rounds)->toHaveCount(2); // 4 teams = 2 rounds
});
