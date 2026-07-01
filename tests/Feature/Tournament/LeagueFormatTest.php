<?php

use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use App\Services\MatchService;
use App\Services\TournamentService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeLeagueTournament(int $teamCount, User $organizer): Tournament
{
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
        'format' => 'league',
        'phase' => 'not_started',
        'max_teams' => $teamCount,
        'min_teams' => 2,
    ]);

    for ($i = 0; $i < $teamCount; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'seed' => $i + 1,
            'registered_by' => $organizer->id,
        ]);
    }

    return $tournament->fresh();
}

test('user can create a league tournament with a non-power-of-2 team count', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $response = $this->post('/tournaments', [
        'name' => 'Liga de Prueba',
        'visibility' => 'public',
        'variant' => 'football_11',
        'format' => 'league',
        'max_teams' => 6,
        'min_teams' => 2,
        'starts_at' => now()->addDays(3)->toDateTimeString(),
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('tournaments', [
        'name' => 'Liga de Prueba',
        'format' => 'league',
        'phase' => 'not_started',
        'max_teams' => 6,
    ]);
});

test('league tournament requires max_teams between 2 and 64', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $response = $this->post('/tournaments', [
        'name' => 'Liga',
        'visibility' => 'public',
        'variant' => 'football_11',
        'format' => 'league',
        'max_teams' => 1,
        'min_teams' => 2,
    ]);

    $response->assertSessionHasErrors('max_teams');
});

test('starting a league with fewer than min_teams fails', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'format' => 'league',
        'phase' => 'not_started',
        'max_teams' => 6,
        'min_teams' => 4,
    ]);

    // Only register 2 teams
    for ($i = 0; $i < 2; $i++) {
        $team = Team::factory()->create(['variant' => $tournament->variant]);
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

    $this->assertDatabaseHas('tournaments', [
        'id' => $tournament->id,
        'status' => 'registration_open',
    ]);
});

test('starting a league generates a full round-robin schedule', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeLeagueTournament(6, $organizer);

    $this->actingAs($organizer);
    $this->post("/tournaments/{$tournament->id}/start")->assertRedirect();

    $tournament = $tournament->fresh();
    expect($tournament->status)->toBe('in_progress')
        ->and($tournament->phase)->toBe('league');

    // n*(n-1)/2 = 15 matches across n-1 = 5 matchdays
    expect($tournament->matches()->count())->toBe(15);
    expect($tournament->rounds()->count())->toBe(5);

    // Each matchday has exactly 3 matches (6 teams / 2)
    for ($md = 1; $md <= 5; $md++) {
        expect($tournament->matches()->where('matchday', $md)->count())->toBe(3);
    }

    // Every team plays every other team exactly once.
    $teamIds = $tournament->approvedTeams()->pluck('team_id')->all();
    foreach ($teamIds as $teamId) {
        $opponents = $tournament->matches()
            ->where(function ($q) use ($teamId) {
                $q->where('home_team_id', $teamId)->orWhere('away_team_id', $teamId);
            })
            ->get()
            ->map(fn ($m) => $m->home_team_id === $teamId ? $m->away_team_id : $m->home_team_id)
            ->unique()
            ->sort()
            ->values()
            ->all();

        $expected = collect($teamIds)->reject(fn ($id) => $id === $teamId)->sort()->values()->all();
        expect($opponents)->toBe($expected, "team {$teamId} should play every other team exactly once");
    }
});

test('league matches accept draws without throwing', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeLeagueTournament(4, $organizer);
    app(TournamentService::class)->startTournament($tournament);

    $match = $tournament->fresh()->matches()->first();
    $match->update([
        'status' => 'in_progress',
        'started_at' => now()->subMinutes(90),
        'scheduled_at' => now()->subHours(2),
        'home_score' => 1,
        'away_score' => 1,
    ]);

    app(MatchService::class)->completeMatch($match->fresh());

    expect($match->fresh()->status)->toBe('completed');
});

test('completing the last league match marks the tournament completed', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeLeagueTournament(4, $organizer);
    app(TournamentService::class)->startTournament($tournament);

    $matches = $tournament->fresh()->matches;
    expect($matches)->toHaveCount(6); // 4 teams → 6 matches

    foreach ($matches as $i => $match) {
        $match->update([
            'status' => 'in_progress',
            'started_at' => now()->subMinutes(90),
            'scheduled_at' => now()->subHours(2),
            'home_score' => 2,
            'away_score' => $i,
        ]);
        app(MatchService::class)->completeMatch($match->fresh());
    }

    $tournament = $tournament->fresh();
    expect($tournament->status)->toBe('completed')
        ->and($tournament->phase)->toBe('completed')
        ->and($tournament->ends_at)->not->toBeNull();
});

test('tournament show endpoint includes standings for league format', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeLeagueTournament(4, $organizer);
    app(TournamentService::class)->startTournament($tournament);

    // Complete two matches with deterministic results.
    $tournament->fresh()->matches->each(function ($match, $i) {
        if ($i >= 2) {
            return;
        }
        $match->update([
            'status' => 'in_progress',
            'started_at' => now()->subMinutes(90),
            'scheduled_at' => now()->subHours(2),
            'home_score' => 3,
            'away_score' => 0,
        ]);
        app(MatchService::class)->completeMatch($match->fresh());
    });

    $this->actingAs($organizer);

    // standings is a deferred prop, so it is absent on the initial page load...
    $response = $this->get("/tournaments/{$tournament->id}");
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tournaments/show')
        ->missing('standings')
    );

    // ...and is delivered by the follow-up deferred (partial) request.
    $version = app(\App\Http\Middleware\HandleInertiaRequests::class)->version(request());
    $deferred = $this->get("/tournaments/{$tournament->id}", [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $version,
        'X-Inertia-Partial-Component' => 'tournaments/show',
        'X-Inertia-Partial-Data' => 'standings',
    ]);
    $deferred->assertOk();
    $deferred->assertJsonPath('component', 'tournaments/show');
    $deferred->assertJsonCount(4, 'props.standings');
    $deferred->assertJsonPath('props.standings.0.position', 1);
});

test('single-elimination regression: existing flow still works', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
        'max_teams' => 4,
        'min_teams' => 4,
    ]);

    for ($i = 0; $i < 4; $i++) {
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
    $this->post("/tournaments/{$tournament->id}/start")->assertRedirect();

    $tournament = $tournament->fresh();
    expect($tournament->status)->toBe('in_progress')
        ->and($tournament->phase)->toBe('knockout')
        ->and($tournament->format)->toBe('single_elimination');

    // 4 teams → 2 rounds (Semifinal, Final), 3 matches total (2 in first round + 1 placeholder)
    expect($tournament->rounds()->count())->toBe(2);
    expect($tournament->matches()->count())->toBe(3);
});
