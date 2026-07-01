<?php

use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentGroup;
use App\Models\TournamentTeam;
use App\Models\User;
use App\Services\MatchService;
use App\Services\TournamentService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Build a group_stage_knockout tournament with `groupCount * groupSize`
 * approved teams. Returns the tournament with eager-loaded groups.
 */
function makeGroupTournament(int $groupCount, int $groupSize, User $organizer): Tournament
{
    $maxTeams = $groupCount * $groupSize;
    $tournament = Tournament::factory()->create([
        'organizer_id' => $organizer->id,
        'status' => 'registration_open',
        'variant' => 'football_11',
        'format' => 'group_stage_knockout',
        'phase' => 'not_started',
        'group_count' => $groupCount,
        'group_size' => $groupSize,
        'max_teams' => $maxTeams,
        'min_teams' => $maxTeams,
    ]);

    // Auto-create groups (mirrors what the service does on real creation).
    for ($i = 0; $i < $groupCount; $i++) {
        TournamentGroup::create([
            'tournament_id' => $tournament->id,
            'name' => chr(ord('A') + $i),
            'position' => $i,
        ]);
    }

    for ($i = 0; $i < $maxTeams; $i++) {
        $team = Team::factory()->create(['variant' => 'football_11']);
        TournamentTeam::factory()->create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => 'approved',
            'seed' => $i + 1,
            'registered_by' => $organizer->id,
        ]);
    }

    return $tournament->fresh(['groups']);
}

test('creating a group_stage_knockout tournament auto-creates groups', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $response = $this->post('/tournaments', [
        'name' => 'Mundialito',
        'visibility' => 'public',
        'variant' => 'football_11',
        'format' => 'group_stage_knockout',
        'group_count' => 4,
        'group_size' => 4,
        'min_teams' => 16,
        'starts_at' => now()->addDays(3)->toDateTimeString(),
    ]);

    $response->assertRedirect();
    $tournament = Tournament::where('name', 'Mundialito')->first();
    expect($tournament->format)->toBe('group_stage_knockout')
        ->and($tournament->group_count)->toBe(4)
        ->and($tournament->group_size)->toBe(4)
        ->and($tournament->max_teams)->toBe(16)
        ->and($tournament->groups()->count())->toBe(4);

    $names = $tournament->groups()->orderBy('position')->pluck('name')->all();
    expect($names)->toBe(['A', 'B', 'C', 'D']);
});

test('cannot start group_stage_knockout until every team is assigned to a group', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeGroupTournament(2, 4, $organizer); // 8 teams, 2 groups

    // Assign only 4 teams (one full group, one empty)
    $teams = $tournament->tournamentTeams()->orderBy('id')->get();
    $groupA = $tournament->groups->first();
    foreach ($teams->take(4) as $tt) {
        $tt->update(['tournament_group_id' => $groupA->id]);
    }

    $this->actingAs($organizer);
    $response = $this->post("/tournaments/{$tournament->id}/start");
    $response->assertSessionHasErrors();

    expect($tournament->fresh()->status)->toBe('registration_open');
});

test('group draw endpoint enforces capacity', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeGroupTournament(2, 4, $organizer); // 8 teams, 2 groups of 4
    $teams = $tournament->tournamentTeams()->orderBy('id')->get();
    $groupA = $tournament->groups->first();

    $this->actingAs($organizer);

    // Try to put 5 teams into a 4-team group
    $assignments = $teams->take(5)->map(fn ($tt) => [
        'tournament_team_id' => $tt->id,
        'tournament_group_id' => $groupA->id,
    ])->all();

    $response = $this->post("/tournaments/{$tournament->id}/groups/draw", [
        'assignments' => $assignments,
    ]);

    $response->assertSessionHasErrors();

    // No assignments persisted.
    expect($tournament->fresh()->tournamentTeams()->whereNotNull('tournament_group_id')->count())->toBe(0);
});

test('starting a group_stage_knockout generates round-robin matches across all groups', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeGroupTournament(2, 4, $organizer); // 8 teams, 2 groups of 4 → 6 matches/group, 3 matchdays

    // Manually distribute teams: first 4 → group A, last 4 → group B
    $teams = $tournament->tournamentTeams()->orderBy('id')->get();
    $groupA = $tournament->groups->where('position', 0)->first();
    $groupB = $tournament->groups->where('position', 1)->first();
    foreach ($teams->take(4) as $tt) {
        $tt->update(['tournament_group_id' => $groupA->id]);
    }
    foreach ($teams->skip(4) as $tt) {
        $tt->update(['tournament_group_id' => $groupB->id]);
    }

    app(TournamentService::class)->startTournament($tournament);

    $tournament = $tournament->fresh();
    expect($tournament->status)->toBe('in_progress')
        ->and($tournament->phase)->toBe('group_stage');

    // Each group has n*(n-1)/2 = 6 matches
    expect($tournament->matches()->where('tournament_group_id', $groupA->id)->count())->toBe(6);
    expect($tournament->matches()->where('tournament_group_id', $groupB->id)->count())->toBe(6);

    // 3 shared matchdays, each with 4 matches (2 per group × 2 groups)
    expect($tournament->rounds()->count())->toBe(3);
    for ($md = 1; $md <= 3; $md++) {
        expect($tournament->matches()->where('matchday', $md)->count())->toBe(4);
    }
});

test('completing all group matches transitions to knockout with cross-bracket pairings', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeGroupTournament(2, 4, $organizer);

    // Distribute teams into groups deterministically by seed
    $teams = $tournament->tournamentTeams()->orderBy('seed')->get();
    $groupA = $tournament->groups->where('position', 0)->first();
    $groupB = $tournament->groups->where('position', 1)->first();
    foreach ($teams->take(4) as $tt) {
        $tt->update(['tournament_group_id' => $groupA->id]);
    }
    foreach ($teams->skip(4) as $tt) {
        $tt->update(['tournament_group_id' => $groupB->id]);
    }

    app(TournamentService::class)->startTournament($tournament);

    // Complete every group match. Use scoring that produces a clean ordering:
    // home team always wins by 2-0. Inside each group the team that plays home
    // most often wins; we just verify the transition fires, not the exact order.
    $tournament->fresh()->matches()->whereNotNull('tournament_group_id')->get()->each(function ($match) {
        $match->update([
            'status' => 'in_progress',
            'started_at' => now()->subHours(2),
            'scheduled_at' => now()->subHours(3),
            'home_score' => 2,
            'away_score' => 0,
        ]);
        app(MatchService::class)->completeMatch($match->fresh());
    });

    $tournament = $tournament->fresh();

    // Phase advanced to knockout
    expect($tournament->phase)->toBe('knockout');

    // 4-team bracket = 2 rounds (Semifinal, Final). Group stage had 3 rounds, so
    // bracket rounds continue at 4 and 5.
    $bracketRounds = $tournament->rounds()->where('round_number', '>=', 4)->orderBy('round_number')->get();
    expect($bracketRounds)->toHaveCount(2);
    expect($bracketRounds[0]->name)->toBe('Semifinal');
    expect($bracketRounds[1]->name)->toBe('Final');

    // First bracket round (semifinals) should have 2 matches with both teams set
    $semifinals = $tournament->matches()->where('tournament_round_id', $bracketRounds[0]->id)->get();
    expect($semifinals)->toHaveCount(2);
    foreach ($semifinals as $sf) {
        expect($sf->home_team_id)->not->toBeNull();
        expect($sf->away_team_id)->not->toBeNull();
        expect($sf->status)->toBe('confirmed');
    }
});

test('completing group matches with all groups incomplete does not transition', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeGroupTournament(2, 4, $organizer);

    $teams = $tournament->tournamentTeams()->orderBy('seed')->get();
    foreach ($teams->take(4) as $tt) {
        $tt->update(['tournament_group_id' => $tournament->groups->where('position', 0)->first()->id]);
    }
    foreach ($teams->skip(4) as $tt) {
        $tt->update(['tournament_group_id' => $tournament->groups->where('position', 1)->first()->id]);
    }

    app(TournamentService::class)->startTournament($tournament);

    // Complete only the FIRST group match
    $first = $tournament->fresh()->matches()->whereNotNull('tournament_group_id')->orderBy('id')->first();
    $first->update([
        'status' => 'in_progress',
        'started_at' => now()->subHours(2),
        'scheduled_at' => now()->subHours(3),
        'home_score' => 1,
        'away_score' => 0,
    ]);
    app(MatchService::class)->completeMatch($first->fresh());

    expect($tournament->fresh()->phase)->toBe('group_stage');
});

test('group standings appear in show endpoint props', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeGroupTournament(2, 4, $organizer);

    // Don't start; just request the page.
    $this->actingAs($organizer);

    // groupStandings is a deferred prop, absent on the initial page load...
    $response = $this->get("/tournaments/{$tournament->id}");
    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('tournaments/show')
        ->missing('groupStandings')
    );

    // ...and delivered by the follow-up deferred (partial) request.
    $version = app(\App\Http\Middleware\HandleInertiaRequests::class)->version(request());
    $deferred = $this->get("/tournaments/{$tournament->id}", [
        'X-Inertia' => 'true',
        'X-Inertia-Version' => $version,
        'X-Inertia-Partial-Component' => 'tournaments/show',
        'X-Inertia-Partial-Data' => 'groupStandings',
    ]);
    $deferred->assertOk();
    $deferred->assertJsonPath('component', 'tournaments/show');
    $deferred->assertJsonCount(2, 'props.groupStandings');
});

test('non-organizer cannot draw groups', function () {
    $organizer = User::factory()->create(['email_verified_at' => now()]);
    $stranger = User::factory()->create(['email_verified_at' => now()]);
    $tournament = makeGroupTournament(2, 4, $organizer);

    $this->actingAs($stranger);
    $response = $this->post("/tournaments/{$tournament->id}/groups/draw", [
        'assignments' => [],
    ]);

    $response->assertForbidden();
});
