<?php

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use App\Services\TournamentService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function startTournamentWithMatches(User $organizer, int $teamCount = 4): Tournament
{
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
        'starts_at' => now()->addDays(3),
    ]);

    for ($i = 0; $i < $teamCount; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'registered_by' => $organizer->id,
        ]);
    }

    app(TournamentService::class)->startTournament($tournament);

    return $tournament->fresh();
}

test('bracket generation leaves matches unscheduled', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = startTournamentWithMatches($organizer);

    $matches = FootballMatch::where('tournament_id', $tournament->id)->get();

    expect($matches)->not->toBeEmpty();
    foreach ($matches as $match) {
        expect($match->scheduled_at)->toBeNull();
        expect($match->location)->toBeNull();
    }
});

test('organizer can schedule a tournament match', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = startTournamentWithMatches($organizer);
    $match = FootballMatch::where('tournament_id', $tournament->id)
        ->whereNotNull('home_team_id')
        ->first();

    $this->actingAs($organizer);

    $scheduledAt = now()->addDays(5)->setTime(18, 30);

    $response = $this->patch(
        "/tournaments/{$tournament->id}/matches/{$match->id}",
        [
            'scheduled_at' => $scheduledAt->toDateTimeString(),
            'location' => 'Cancha 3 — Complejo Norte',
        ],
    );

    $response->assertRedirect();

    $match->refresh();
    expect($match->scheduled_at->format('Y-m-d H:i'))
        ->toBe($scheduledAt->format('Y-m-d H:i'));
    expect($match->location)->toBe('Cancha 3 — Complejo Norte');
});

test('non-organizer cannot schedule a tournament match', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $intruder = User::factory()->create(['email_verified_at' => now()]);
    $tournament = startTournamentWithMatches($organizer);
    $match = FootballMatch::where('tournament_id', $tournament->id)
        ->whereNotNull('home_team_id')
        ->first();

    $this->actingAs($intruder);

    $response = $this->patch(
        "/tournaments/{$tournament->id}/matches/{$match->id}",
        [
            'scheduled_at' => now()->addDays(5)->toDateTimeString(),
            'location' => 'Hack',
        ],
    );

    $response->assertForbidden();
    expect($match->fresh()->scheduled_at)->toBeNull();
});

test('cannot schedule a match for a date in the past', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = startTournamentWithMatches($organizer);
    $match = FootballMatch::where('tournament_id', $tournament->id)
        ->whereNotNull('home_team_id')
        ->first();

    $this->actingAs($organizer);

    $response = $this->patch(
        "/tournaments/{$tournament->id}/matches/{$match->id}",
        [
            'scheduled_at' => now()->subDays(1)->toDateTimeString(),
            'location' => 'Cancha 1',
        ],
    );

    $response->assertSessionHasErrors('scheduled_at');
    expect($match->fresh()->scheduled_at)->toBeNull();
});

test('cannot edit a completed match', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = startTournamentWithMatches($organizer);
    $match = FootballMatch::where('tournament_id', $tournament->id)
        ->whereNotNull('home_team_id')
        ->first();
    $match->update(['status' => 'completed']);

    $this->actingAs($organizer);

    $response = $this->patch(
        "/tournaments/{$tournament->id}/matches/{$match->id}",
        [
            'scheduled_at' => now()->addDays(2)->toDateTimeString(),
            'location' => 'Otra cancha',
        ],
    );

    $response->assertForbidden();
});

test('match must belong to the given tournament', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournamentA = startTournamentWithMatches($organizer);
    $tournamentB = startTournamentWithMatches($organizer);

    $matchFromB = FootballMatch::where('tournament_id', $tournamentB->id)
        ->whereNotNull('home_team_id')
        ->first();

    $this->actingAs($organizer);

    $response = $this->patch(
        "/tournaments/{$tournamentA->id}/matches/{$matchFromB->id}",
        [
            'scheduled_at' => now()->addDays(2)->toDateTimeString(),
            'location' => 'Cancha 1',
        ],
    );

    $response->assertNotFound();
});
