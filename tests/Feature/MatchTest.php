<?php

declare(strict_types=1);

use App\Models\FootballMatch;
use App\Models\MatchRequest;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Home team setup
    $this->homeCaptain = User::factory()->create();
    $this->homeTeam = Team::create([
        'name' => 'Home FC',
        'variant' => 'football_11',
        'created_by' => $this->homeCaptain->id,
        'max_members' => 25,
    ]);
    TeamMember::create([
        'user_id' => $this->homeCaptain->id,
        'team_id' => $this->homeTeam->id,
        'role' => 'captain',
        'status' => 'active',
    ]);

    // Away team setup
    $this->awayCaptain = User::factory()->create();
    $this->awayTeam = Team::create([
        'name' => 'Away FC',
        'variant' => 'football_11',
        'created_by' => $this->awayCaptain->id,
        'max_members' => 25,
    ]);
    TeamMember::create([
        'user_id' => $this->awayCaptain->id,
        'team_id' => $this->awayTeam->id,
        'role' => 'captain',
        'status' => 'active',
    ]);

    $this->outsider = User::factory()->create();
});

// Helper to create a match
function createMatch(array $overrides = []): FootballMatch
{
    return FootballMatch::create(array_merge([
        'home_team_id' => test()->homeTeam->id,
        'variant' => 'football_11',
        'scheduled_at' => now()->addDays(3),
        'location' => 'Test Field',
        'match_type' => 'friendly',
        'status' => 'available',
        'created_by' => test()->homeCaptain->id,
    ], $overrides));
}

// ============================================================
// Match Creation
// ============================================================

test('team leader can create a match', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('matches.store'), [
            'team_id' => $this->homeTeam->id,
            'scheduled_at' => now()->addDays(5)->toDateTimeString(),
            'location' => 'Stadium A',
            'match_type' => 'friendly',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('matches', [
        'home_team_id' => $this->homeTeam->id,
        'status' => 'available',
        'location' => 'Stadium A',
    ]);
});

test('non-leader cannot create a match', function () {
    $this->actingAs($this->outsider)
        ->post(route('matches.store'), [
            'team_id' => $this->homeTeam->id,
            'scheduled_at' => now()->addDays(5)->toDateTimeString(),
            'location' => 'Stadium A',
            'match_type' => 'friendly',
        ])
        ->assertSessionHas('error');

    $this->assertDatabaseMissing('matches', [
        'home_team_id' => $this->homeTeam->id,
        'location' => 'Stadium A',
    ]);
});

test('match creation requires future scheduled_at', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('matches.store'), [
            'team_id' => $this->homeTeam->id,
            'scheduled_at' => now()->subDay()->toDateTimeString(),
            'location' => 'Stadium A',
            'match_type' => 'friendly',
        ])
        ->assertSessionHasErrors('scheduled_at');
});

test('match creation validates required fields', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('matches.store'), [])
        ->assertSessionHasErrors(['team_id', 'scheduled_at', 'location', 'match_type']);
});

test('match creation rejects invalid match_type', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('matches.store'), [
            'team_id' => $this->homeTeam->id,
            'scheduled_at' => now()->addDays(5)->toDateTimeString(),
            'location' => 'Stadium A',
            'match_type' => 'exhibition',
        ])
        ->assertSessionHasErrors('match_type');
});

test('authenticated user can view matches index', function () {
    $this->actingAs($this->homeCaptain)
        ->get(route('matches.index'))
        ->assertSuccessful();
});

test('authenticated user can view a match', function () {
    $match = createMatch();

    $this->actingAs($this->homeCaptain)
        ->get(route('matches.show', $match->id))
        ->assertSuccessful();
});

// ============================================================
// Match Update
// ============================================================

test('home team leader can update match', function () {
    $match = createMatch();

    $this->actingAs($this->homeCaptain)
        ->put(route('matches.update', $match->id), [
            'scheduled_at' => now()->addDays(7)->toDateTimeString(),
            'location' => 'New Field',
            'match_type' => 'competitive',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'location' => 'New Field',
        'match_type' => 'competitive',
    ]);
});

test('away team leader cannot update match', function () {
    $match = createMatch(['away_team_id' => $this->awayTeam->id, 'status' => 'confirmed']);

    $this->actingAs($this->awayCaptain)
        ->put(route('matches.update', $match->id), [
            'scheduled_at' => now()->addDays(7)->toDateTimeString(),
            'location' => 'Hijacked Field',
            'match_type' => 'friendly',
        ])
        ->assertForbidden();
});

test('non-leader cannot update match', function () {
    $match = createMatch();

    $this->actingAs($this->outsider)
        ->put(route('matches.update', $match->id), [
            'scheduled_at' => now()->addDays(7)->toDateTimeString(),
            'location' => 'Hijacked Field',
            'match_type' => 'friendly',
        ])
        ->assertForbidden();
});

test('cannot edit a match that has started', function () {
    $match = createMatch([
        'status' => 'in_progress',
        'started_at' => now(),
        'scheduled_at' => now()->subHour(),
    ]);

    $this->actingAs($this->homeCaptain)
        ->get(route('matches.edit', $match->id))
        ->assertRedirect(route('matches.show', $match->id));
});

// ============================================================
// Match Cancellation
// ============================================================

test('home team leader can cancel an available match', function () {
    $match = createMatch();

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.cancel', $match->id))
        ->assertRedirect(route('matches.index'));

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'status' => 'cancelled',
    ]);
});

test('non-home-leader cannot cancel match', function () {
    $match = createMatch(['away_team_id' => $this->awayTeam->id, 'status' => 'confirmed']);

    $this->actingAs($this->awayCaptain)
        ->post(route('matches.cancel', $match->id))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'status' => 'confirmed',
    ]);
});

test('cannot cancel a match that has started', function () {
    $match = createMatch([
        'status' => 'in_progress',
        'started_at' => now(),
        'scheduled_at' => now()->subHour(),
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.cancel', $match->id))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'status' => 'in_progress',
    ]);
});

// ============================================================
// Match Requests
// ============================================================

test('away team leader can send a match request', function () {
    $match = createMatch();

    $this->actingAs($this->awayCaptain)
        ->post(route('match-requests.create'), [
            'match_id' => $match->id,
            'team_id' => $this->awayTeam->id,
            'message' => 'We would like to play',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('match_requests', [
        'match_id' => $match->id,
        'requesting_team_id' => $this->awayTeam->id,
        'status' => 'pending',
    ]);
});

test('non-leader cannot send a match request', function () {
    $match = createMatch();

    $this->actingAs($this->outsider)
        ->post(route('match-requests.create'), [
            'match_id' => $match->id,
            'team_id' => $this->awayTeam->id,
        ])
        ->assertSessionHas('error');
});

test('cannot send request for non-available match', function () {
    $match = createMatch(['status' => 'confirmed', 'away_team_id' => $this->awayTeam->id]);

    // Create another team to attempt the request
    $thirdCaptain = User::factory()->create();
    $thirdTeam = Team::create([
        'name' => 'Third FC',
        'variant' => 'football_11',
        'created_by' => $thirdCaptain->id,
        'max_members' => 25,
    ]);
    TeamMember::create([
        'user_id' => $thirdCaptain->id,
        'team_id' => $thirdTeam->id,
        'role' => 'captain',
        'status' => 'active',
    ]);

    $this->actingAs($thirdCaptain)
        ->post(route('match-requests.create'), [
            'match_id' => $match->id,
            'team_id' => $thirdTeam->id,
        ])
        ->assertSessionHas('error');
});

test('cannot send duplicate pending request', function () {
    $match = createMatch();

    MatchRequest::create([
        'match_id' => $match->id,
        'requesting_team_id' => $this->awayTeam->id,
        'status' => 'pending',
    ]);

    $this->actingAs($this->awayCaptain)
        ->post(route('match-requests.create'), [
            'match_id' => $match->id,
            'team_id' => $this->awayTeam->id,
        ])
        ->assertSessionHas('error');

    expect(MatchRequest::where('match_id', $match->id)->count())->toBe(1);
});

test('team variant must match match variant', function () {
    $match = createMatch();

    // Create a futsal team trying to request a football_11 match
    $futsalCaptain = User::factory()->create();
    $futsalTeam = Team::create([
        'name' => 'Futsal FC',
        'variant' => 'futsal',
        'created_by' => $futsalCaptain->id,
        'max_members' => 12,
    ]);
    TeamMember::create([
        'user_id' => $futsalCaptain->id,
        'team_id' => $futsalTeam->id,
        'role' => 'captain',
        'status' => 'active',
    ]);

    $this->actingAs($futsalCaptain)
        ->post(route('match-requests.create'), [
            'match_id' => $match->id,
            'team_id' => $futsalTeam->id,
        ])
        ->assertSessionHas('error');

    $this->assertDatabaseMissing('match_requests', [
        'match_id' => $match->id,
        'requesting_team_id' => $futsalTeam->id,
    ]);
});

test('home team leader can accept a match request', function () {
    $match = createMatch();
    $request = MatchRequest::create([
        'match_id' => $match->id,
        'requesting_team_id' => $this->awayTeam->id,
        'status' => 'pending',
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('match-requests.accept', $request->id))
        ->assertRedirect();

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'away_team_id' => $this->awayTeam->id,
        'status' => 'confirmed',
    ]);
    $this->assertDatabaseHas('match_requests', [
        'id' => $request->id,
        'status' => 'accepted',
    ]);
});

test('accepting one request rejects other pending requests', function () {
    $match = createMatch();
    $accepted = MatchRequest::create([
        'match_id' => $match->id,
        'requesting_team_id' => $this->awayTeam->id,
        'status' => 'pending',
    ]);

    // Create a second team with another pending request
    $otherCaptain = User::factory()->create();
    $otherTeam = Team::create([
        'name' => 'Other FC',
        'variant' => 'football_11',
        'created_by' => $otherCaptain->id,
        'max_members' => 25,
    ]);
    TeamMember::create([
        'user_id' => $otherCaptain->id,
        'team_id' => $otherTeam->id,
        'role' => 'captain',
        'status' => 'active',
    ]);
    $otherRequest = MatchRequest::create([
        'match_id' => $match->id,
        'requesting_team_id' => $otherTeam->id,
        'status' => 'pending',
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('match-requests.accept', $accepted->id))
        ->assertRedirect();

    $this->assertDatabaseHas('match_requests', [
        'id' => $otherRequest->id,
        'status' => 'rejected',
    ]);
});

test('non-home-leader cannot accept a match request', function () {
    $match = createMatch();
    $request = MatchRequest::create([
        'match_id' => $match->id,
        'requesting_team_id' => $this->awayTeam->id,
        'status' => 'pending',
    ]);

    $this->actingAs($this->awayCaptain)
        ->post(route('match-requests.accept', $request->id))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('match_requests', [
        'id' => $request->id,
        'status' => 'pending',
    ]);
});

test('home team leader can reject a match request', function () {
    $match = createMatch();
    $request = MatchRequest::create([
        'match_id' => $match->id,
        'requesting_team_id' => $this->awayTeam->id,
        'status' => 'pending',
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('match-requests.reject', $request->id))
        ->assertRedirect();

    $this->assertDatabaseHas('match_requests', [
        'id' => $request->id,
        'status' => 'rejected',
    ]);
    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'status' => 'available',
    ]);
});

test('non-home-leader cannot reject a match request', function () {
    $match = createMatch();
    $request = MatchRequest::create([
        'match_id' => $match->id,
        'requesting_team_id' => $this->awayTeam->id,
        'status' => 'pending',
    ]);

    $this->actingAs($this->outsider)
        ->post(route('match-requests.reject', $request->id))
        ->assertSessionHas('error');
});

// ============================================================
// Score Update
// ============================================================

test('team leader can update score for a past match', function () {
    $match = createMatch([
        'status' => 'confirmed',
        'away_team_id' => $this->awayTeam->id,
        'scheduled_at' => now()->subHour(),
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.update-score', $match->id), [
            'home_score' => 2,
            'away_score' => 1,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'home_score' => 2,
        'away_score' => 1,
    ]);
});

test('cannot update score before match scheduled time', function () {
    $match = createMatch([
        'status' => 'confirmed',
        'away_team_id' => $this->awayTeam->id,
        'scheduled_at' => now()->addDays(2),
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.update-score', $match->id), [
            'home_score' => 2,
            'away_score' => 1,
        ])
        ->assertSessionHas('error');

    $this->assertDatabaseMissing('matches', [
        'id' => $match->id,
        'home_score' => 2,
    ]);
});

test('non-leader cannot update score', function () {
    $match = createMatch([
        'status' => 'confirmed',
        'away_team_id' => $this->awayTeam->id,
        'scheduled_at' => now()->subHour(),
    ]);

    $this->actingAs($this->outsider)
        ->post(route('matches.update-score', $match->id), [
            'home_score' => 2,
            'away_score' => 1,
        ])
        ->assertForbidden();
});

test('score update validates integer values', function () {
    $match = createMatch([
        'status' => 'confirmed',
        'away_team_id' => $this->awayTeam->id,
        'scheduled_at' => now()->subHour(),
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.update-score', $match->id), [
            'home_score' => 'abc',
            'away_score' => 1,
        ])
        ->assertSessionHasErrors('home_score');
});

// ============================================================
// Match Completion
// ============================================================

test('team leader can complete an in-progress match', function () {
    $match = createMatch([
        'status' => 'in_progress',
        'away_team_id' => $this->awayTeam->id,
        'scheduled_at' => now()->subHour(),
        'started_at' => now()->subHour(),
        'home_score' => 2,
        'away_score' => 1,
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.complete', $match->id))
        ->assertRedirect();

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'status' => 'completed',
    ]);
    expect($match->fresh()->completed_at)->not->toBeNull();
});

test('cannot complete a match before scheduled time', function () {
    $match = createMatch([
        'status' => 'in_progress',
        'away_team_id' => $this->awayTeam->id,
        'scheduled_at' => now()->addHours(2),
        'started_at' => now(),
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.complete', $match->id))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'status' => 'in_progress',
    ]);
});

test('cannot complete a confirmed match that is not in progress', function () {
    $match = createMatch([
        'status' => 'confirmed',
        'away_team_id' => $this->awayTeam->id,
        'scheduled_at' => now()->subHour(),
    ]);

    $this->actingAs($this->homeCaptain)
        ->post(route('matches.complete', $match->id))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('matches', [
        'id' => $match->id,
        'status' => 'confirmed',
    ]);
});

test('non-leader cannot complete match', function () {
    $match = createMatch([
        'status' => 'in_progress',
        'away_team_id' => $this->awayTeam->id,
        'scheduled_at' => now()->subHour(),
        'started_at' => now()->subHour(),
    ]);

    $this->actingAs($this->outsider)
        ->post(route('matches.complete', $match->id))
        ->assertForbidden();
});

test('guest cannot access matches index', function () {
    $this->get(route('matches.index'))
        ->assertRedirect(route('login'));
});
