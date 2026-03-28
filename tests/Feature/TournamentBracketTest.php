<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('organizer can start tournament with approved teams', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
        'max_teams' => 8,
    ]);

    // Register 8 teams (power of 2)
    for ($i = 0; $i < 8; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'registered_by' => $organizer->id,
        ]);
    }

    $this->actingAs($organizer);

    $response = $this->post("/tournaments/{$tournament->id}/start");

    $response->assertRedirect();
    $this->assertDatabaseHas('tournaments', [
        'id' => $tournament->id,
        'status' => 'in_progress',
    ]);
});

test('cannot start with non-power-of-2 teams', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
    ]);

    // Register 7 teams (not a power of 2)
    for ($i = 0; $i < 7; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'registered_by' => $organizer->id,
        ]);
    }

    $this->actingAs($organizer);

    $response = $this->post("/tournaments/{$tournament->id}/start");

    $response->assertSessionHasErrors();
});

test('bracket generation creates correct rounds', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
    ]);

    // Register 8 teams
    for ($i = 0; $i < 8; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'seed' => $i + 1,
            'registered_by' => $organizer->id,
        ]);
    }

    $this->actingAs($organizer);

    $this->post("/tournaments/{$tournament->id}/start");

    // 8 teams = 3 rounds (Quarterfinals, Semifinals, Final)
    $rounds = $tournament->fresh()->rounds;
    expect($rounds)->toHaveCount(3);
    expect($rounds[0]->round_number)->toBe(1);
    expect($rounds[1]->round_number)->toBe(2);
    expect($rounds[2]->round_number)->toBe(3);
    expect($rounds[2]->name)->toBe('Final');
});

test('bracket generation pairs teams correctly', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
    ]);

    // Register 4 teams for simpler test
    $teams = [];
    for ($i = 0; $i < 4; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        $teams[] = $team;
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'seed' => $i + 1,
            'registered_by' => $organizer->id,
        ]);
    }

    $this->actingAs($organizer);

    $this->post("/tournaments/{$tournament->id}/start");

    // Check first round has 2 matches
    $firstRound = $tournament->fresh()->rounds()->where('round_number', 1)->first();
    $matches = $firstRound->matches;
    expect($matches)->toHaveCount(2);

    // Check teams are paired correctly (seed 1 vs 2, seed 3 vs 4)
    expect($matches[0]->home_team_id)->toBe($teams[0]->id);
    expect($matches[0]->away_team_id)->toBe($teams[1]->id);
    expect($matches[1]->home_team_id)->toBe($teams[2]->id);
    expect($matches[1]->away_team_id)->toBe($teams[3]->id);
});

test('completing match advances winner', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'in_progress',
        'variant' => 'football_11',
    ]);

    $team1 = Team::factory()->create(['variant' => 'football_11']);
    $team2 = Team::factory()->create(['variant' => 'football_11']);

    // Create rounds
    $round1 = $tournament->rounds()->create([
        'round_number' => 1,
        'name' => 'Semifinal',
    ]);
    $round2 = $tournament->rounds()->create([
        'round_number' => 2,
        'name' => 'Final',
    ]);

    // Create first round match
    $match1 = FootballMatch::factory()->create([
        'tournament_id' => $tournament->id,
        'tournament_round_id' => $round1->id,
        'home_team_id' => $team1->id,
        'away_team_id' => $team2->id,
        'bracket_position' => 0,
        'status' => 'confirmed',
        'variant' => 'football_11',
    ]);

    // Create second round match (initially TBD)
    $finalMatch = FootballMatch::factory()->create([
        'tournament_id' => $tournament->id,
        'tournament_round_id' => $round2->id,
        'home_team_id' => null,
        'away_team_id' => null,
        'bracket_position' => 0,
        'status' => 'pending',
        'variant' => 'football_11',
    ]);

    // Complete first match with team1 winning
    $match1->update([
        'status' => 'completed',
        'home_score' => 3,
        'away_score' => 1,
        'completed_at' => now(),
    ]);

    // Manually advance winner (would be done by service in real scenario)
    $tournamentService = app(\App\Services\TournamentService::class);
    $tournamentService->advanceWinner($match1);

    // Check that winner advanced to final
    $finalMatch->refresh();
    expect($finalMatch->home_team_id)->toBe($team1->id);
});

test('final match completes tournament', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'in_progress',
        'variant' => 'football_11',
    ]);

    $team1 = Team::factory()->create(['variant' => 'football_11']);
    $team2 = Team::factory()->create(['variant' => 'football_11']);

    // Create final round
    $finalRound = $tournament->rounds()->create([
        'round_number' => 1,
        'name' => 'Final',
    ]);

    // Create final match
    $finalMatch = FootballMatch::factory()->create([
        'tournament_id' => $tournament->id,
        'tournament_round_id' => $finalRound->id,
        'home_team_id' => $team1->id,
        'away_team_id' => $team2->id,
        'bracket_position' => 0,
        'status' => 'confirmed',
        'variant' => 'football_11',
    ]);

    // Complete final match
    $finalMatch->update([
        'status' => 'completed',
        'home_score' => 2,
        'away_score' => 1,
        'completed_at' => now(),
    ]);

    // Advance winner (this should complete the tournament)
    $tournamentService = app(\App\Services\TournamentService::class);
    $tournamentService->advanceWinner($finalMatch);

    // Check tournament is completed
    $tournament->refresh();
    expect($tournament->status)->toBe('completed');
    expect($tournament->ends_at)->not->toBeNull();
});

test('cannot start tournament without minimum teams', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
        'min_teams' => 4,
    ]);

    // Register only 2 teams (below minimum)
    for ($i = 0; $i < 2; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'registered_by' => $organizer->id,
        ]);
    }

    $this->actingAs($organizer);

    $response = $this->post("/tournaments/{$tournament->id}/start");

    $response->assertSessionHasErrors();
});

test('non-organizer cannot start tournament', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $otherUser = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
    ]);

    // Register 4 teams
    for ($i = 0; $i < 4; $i++) {
        $team = Team::factory()->create(['variant' => $tournament->variant]);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'registered_by' => $organizer->id,
        ]);
    }

    $this->actingAs($otherUser);

    $response = $this->post("/tournaments/{$tournament->id}/start");

    $response->assertForbidden();
});

test('16-team bracket generates correct structure', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
        'max_teams' => 16,
    ]);

    for ($i = 0; $i < 16; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'seed' => $i + 1,
            'registered_by' => $organizer->id,
        ]);
    }

    $this->actingAs($organizer);

    $this->post("/tournaments/{$tournament->id}/start");

    $tournament->refresh();
    $rounds = $tournament->rounds()->orderBy('round_number')->get();

    // 16 teams = 4 rounds
    expect($rounds)->toHaveCount(4);
    expect($rounds[0]->name)->toBe('Octavos de Final');
    expect($rounds[1]->name)->toBe('Cuartos de Final');
    expect($rounds[2]->name)->toBe('Semifinal');
    expect($rounds[3]->name)->toBe('Final');

    // 8 first-round matches, 4 second, 2 third, 1 final
    expect($rounds[0]->matches)->toHaveCount(8);
    expect($rounds[1]->matches)->toHaveCount(4);
    expect($rounds[2]->matches)->toHaveCount(2);
    expect($rounds[3]->matches)->toHaveCount(1);
});

test('tournament match cannot be completed as draw', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'in_progress',
        'variant' => 'football_11',
    ]);

    $team1 = Team::factory()->create(['variant' => 'football_11']);
    $team2 = Team::factory()->create(['variant' => 'football_11']);

    $round = $tournament->rounds()->create([
        'round_number' => 1,
        'name' => 'Final',
    ]);

    $match = FootballMatch::factory()->create([
        'tournament_id' => $tournament->id,
        'tournament_round_id' => $round->id,
        'home_team_id' => $team1->id,
        'away_team_id' => $team2->id,
        'bracket_position' => 0,
        'status' => 'in_progress',
        'variant' => 'football_11',
        'home_score' => 2,
        'away_score' => 2, // Draw
        'scheduled_at' => now()->subHour(),
        'started_at' => now()->subHour(),
    ]);

    $matchService = app(\App\Services\MatchService::class);

    expect(fn () => $matchService->completeMatch($match))
        ->toThrow(\Exception::class, 'Tournament matches cannot end in a draw');
});

test('date validation rejects registration deadline after start date', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $response = $this->post('/tournaments', [
        'name' => 'Test Tournament',
        'visibility' => 'public',
        'variant' => 'football_11',
        'max_teams' => 8,
        'min_teams' => 4,
        'registration_deadline' => now()->addDays(10)->toDateTimeString(),
        'starts_at' => now()->addDays(5)->toDateTimeString(), // Before deadline
        'ends_at' => now()->addDays(15)->toDateTimeString(),
    ]);

    $response->assertSessionHasErrors('registration_deadline');
});
