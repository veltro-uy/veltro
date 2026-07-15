<?php

declare(strict_types=1);

use App\Models\FootballMatch;
use App\Models\MatchEvent;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\Tournament;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * Create a team whose captain is $captain, plus optional extra players.
 */
function tmmTeamWithCaptain(User $captain, int $players = 1): Team
{
    $team = Team::create([
        'name' => 'Team '.uniqid(),
        'variant' => 'football_11',
        'created_by' => $captain->id,
        'max_members' => 25,
    ]);

    TeamMember::create([
        'user_id' => $captain->id,
        'team_id' => $team->id,
        'role' => 'captain',
        'status' => 'active',
    ]);

    for ($i = 0; $i < $players; $i++) {
        TeamMember::create([
            'user_id' => User::factory()->create()->id,
            'team_id' => $team->id,
            'role' => 'player',
            'status' => 'active',
        ]);
    }

    return $team;
}

beforeEach(function () {
    $this->organizer = User::factory()->create(['email_verified_at' => now()]);
    $this->homeCaptain = User::factory()->create(['email_verified_at' => now()]);
    $this->awayCaptain = User::factory()->create(['email_verified_at' => now()]);
    $this->outsider = User::factory()->create(['email_verified_at' => now()]);

    $this->homeTeam = tmmTeamWithCaptain($this->homeCaptain, players: 12);
    $this->awayTeam = tmmTeamWithCaptain($this->awayCaptain, players: 12);

    $this->tournament = Tournament::factory()->create([
        'organizer_id' => $this->organizer->id,
        'status' => 'in_progress',
        'variant' => 'football_11',
    ]);

    // A confirmed tournament match kicking off in the past so results/events
    // can be recorded.
    $this->match = FootballMatch::create([
        'home_team_id' => $this->homeTeam->id,
        'away_team_id' => $this->awayTeam->id,
        'tournament_id' => $this->tournament->id,
        'variant' => 'football_11',
        'scheduled_at' => now()->subHour(),
        'location' => 'Cancha 1',
        'status' => 'confirmed',
        'confirmed_at' => now()->subDay(),
        'home_score' => 0,
        'away_score' => 0,
        'created_by' => $this->homeCaptain->id,
    ]);
});

// ── Organizer can manage everything ──────────────────────────────────────────

test('organizer can update the score of a tournament match', function () {
    $this->actingAs($this->organizer)
        ->post(route('matches.update-score', $this->match->id), [
            'home_score' => 2,
            'away_score' => 1,
        ])->assertRedirect();

    $this->match->refresh();
    expect($this->match->home_score)->toBe(2)
        ->and($this->match->away_score)->toBe(1);
});

test('organizer can record and delete a goal on a tournament match', function () {
    $this->actingAs($this->organizer)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ])->assertRedirect();

    $event = MatchEvent::where('match_id', $this->match->id)->firstOrFail();
    expect($this->match->fresh()->home_score)->toBe(1);

    $this->actingAs($this->organizer)
        ->delete(route('match-events.destroy', $event->id))
        ->assertRedirect();

    expect($this->match->fresh()->home_score)->toBe(0);
});

test('organizer can complete a tournament match', function () {
    $this->match->update(['status' => 'in_progress', 'home_score' => 3, 'away_score' => 1, 'started_at' => now()->subHour()]);

    $this->actingAs($this->organizer)
        ->post(route('matches.complete', $this->match->id))
        ->assertRedirect();

    expect($this->match->fresh()->status)->toBe('completed');
});

test('organizer can set the lineup for both teams', function () {
    // GET the lineup page and confirm both teams are offered.
    $this->actingAs($this->organizer)
        ->get(route('matches.lineup.edit', $this->match->id))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('teams', 2));

    foreach ([$this->homeTeam, $this->awayTeam] as $team) {
        $player = $team->teamMembers()->where('role', 'player')->first();

        $this->actingAs($this->organizer)
            ->post(route('matches.lineup.update', $this->match->id), [
                'team_id' => $team->id,
                'players' => [[
                    'user_id' => $player->user_id,
                    'position' => 'forward',
                    'is_starter' => true,
                    'is_substitute' => false,
                ]],
            ])->assertRedirect();

        expect($this->match->lineups()->where('team_id', $team->id)->count())->toBe(1);
    }
});

// ── Competing captains are locked out ────────────────────────────────────────

test('a competing team captain cannot update the tournament match score', function () {
    foreach ([$this->homeCaptain, $this->awayCaptain, $this->outsider] as $user) {
        $this->actingAs($user)
            ->post(route('matches.update-score', $this->match->id), [
                'home_score' => 9,
                'away_score' => 0,
            ])->assertForbidden();
    }

    expect($this->match->fresh()->home_score)->toBe(0);
});

test('a competing team captain cannot record goals on a tournament match', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ])->assertForbidden();

    expect(MatchEvent::where('match_id', $this->match->id)->count())->toBe(0);
});

test('a competing team captain cannot complete a tournament match', function () {
    $this->match->update(['status' => 'in_progress', 'started_at' => now()->subHour()]);

    $this->actingAs($this->awayCaptain)
        ->post(route('matches.complete', $this->match->id))
        ->assertForbidden();

    expect($this->match->fresh()->status)->toBe('in_progress');
});

test('a competing team captain cannot open the lineup editor for a tournament match', function () {
    $this->actingAs($this->homeCaptain)
        ->get(route('matches.lineup.edit', $this->match->id))
        ->assertForbidden();

    $player = $this->homeTeam->teamMembers()->where('role', 'player')->first();
    $this->actingAs($this->homeCaptain)
        ->post(route('matches.lineup.update', $this->match->id), [
            'team_id' => $this->homeTeam->id,
            'players' => [[
                'user_id' => $player->user_id,
                'position' => 'forward',
                'is_starter' => true,
                'is_substitute' => false,
            ]],
        ])->assertForbidden();
});

// ── Player-level and friendly-match behaviour is preserved ───────────────────

test('a team player can still confirm availability on a tournament match', function () {
    $player = $this->homeTeam->teamMembers()->where('role', 'player')->first();

    $this->actingAs(User::find($player->user_id))
        ->post(route('matches.availability.update', $this->match->id), [
            'status' => 'available',
        ])->assertRedirect();
});

test('friendly match results are still managed by the team captain', function () {
    $friendly = FootballMatch::create([
        'home_team_id' => $this->homeTeam->id,
        'away_team_id' => $this->awayTeam->id,
        'tournament_id' => null,
        'variant' => 'football_11',
        'scheduled_at' => now()->subHour(),
        'location' => 'Cancha 2',
        'status' => 'confirmed',
        'confirmed_at' => now()->subDay(),
        'home_score' => 0,
        'away_score' => 0,
        'created_by' => $this->homeCaptain->id,
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.update-score', $friendly->id), [
            'home_score' => 1,
            'away_score' => 0,
        ])->assertRedirect();

    expect($friendly->fresh()->home_score)->toBe(1);

    // ...and the organizer of an unrelated tournament has no say here.
    $this->actingAs($this->organizer)
        ->post(route('matches.update-score', $friendly->id), [
            'home_score' => 5,
            'away_score' => 5,
        ])->assertForbidden();
});
