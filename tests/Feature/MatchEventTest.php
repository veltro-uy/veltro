<?php

declare(strict_types=1);

use App\Models\FootballMatch;
use App\Models\MatchEvent;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    // Home team
    $this->homeCaptain = User::factory()->create();
    $this->homePlayer = User::factory()->create();
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
    TeamMember::create([
        'user_id' => $this->homePlayer->id,
        'team_id' => $this->homeTeam->id,
        'role' => 'player',
        'status' => 'active',
    ]);

    // Away team
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

    // Confirmed match in the past so events can be recorded
    $this->match = FootballMatch::create([
        'home_team_id' => $this->homeTeam->id,
        'away_team_id' => $this->awayTeam->id,
        'variant' => 'football_11',
        'scheduled_at' => now()->subHour(),
        'location' => 'Test Field',
        'match_type' => 'friendly',
        'status' => 'confirmed',
        'confirmed_at' => now()->subDays(1),
        'home_score' => 0,
        'away_score' => 0,
        'created_by' => $this->homeCaptain->id,
    ]);
});

// ============================================================
// Event Recording
// ============================================================

test('home leader can record a goal event', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'user_id' => $this->homePlayer->id,
            'event_type' => 'goal',
            'minute' => 23,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('match_events', [
        'match_id' => $this->match->id,
        'team_id' => $this->homeTeam->id,
        'user_id' => $this->homePlayer->id,
        'event_type' => 'goal',
        'minute' => 23,
    ]);
});

test('recording a home goal auto-increments home_score', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ])
        ->assertRedirect();

    expect($this->match->fresh()->home_score)->toBe(1);
    expect($this->match->fresh()->away_score)->toBe(0);
});

test('recording an away goal auto-increments away_score', function () {
    $this->actingAs($this->awayCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->awayTeam->id,
            'event_type' => 'goal',
        ])
        ->assertRedirect();

    expect($this->match->fresh()->away_score)->toBe(1);
    expect($this->match->fresh()->home_score)->toBe(0);
});

test('multiple goals accumulate on the score', function () {
    foreach (range(1, 3) as $i) {
        $this->actingAs($this->homeCaptain)
            ->post(route('match-events.store'), [
                'match_id' => $this->match->id,
                'team_id' => $this->homeTeam->id,
                'event_type' => 'goal',
            ]);
    }

    $this->actingAs($this->awayCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->awayTeam->id,
            'event_type' => 'goal',
        ]);

    $fresh = $this->match->fresh();
    expect($fresh->home_score)->toBe(3);
    expect($fresh->away_score)->toBe(1);
});

test('recording a goal on a confirmed past match auto-starts it', function () {
    expect($this->match->status)->toBe('confirmed');
    expect($this->match->started_at)->toBeNull();

    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ])
        ->assertRedirect();

    $fresh = $this->match->fresh();
    expect($fresh->status)->toBe('in_progress');
    expect($fresh->started_at)->not->toBeNull();
});

test('recording a goal on a confirmed future match does NOT auto-start', function () {
    $this->match->update(['scheduled_at' => now()->addDays(2)]);

    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ])
        ->assertRedirect();

    $fresh = $this->match->fresh();
    expect($fresh->status)->toBe('confirmed');
    expect($fresh->started_at)->toBeNull();
});

test('recording a non-goal event does not affect score', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'user_id' => $this->homePlayer->id,
            'event_type' => 'yellow_card',
        ])
        ->assertRedirect();

    $fresh = $this->match->fresh();
    expect($fresh->home_score)->toBe(0);
    expect($fresh->away_score)->toBe(0);
});

test('all valid event types are accepted', function (string $eventType) {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'user_id' => $this->homePlayer->id,
            'event_type' => $eventType,
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('match_events', [
        'match_id' => $this->match->id,
        'event_type' => $eventType,
    ]);
})->with(['goal', 'assist', 'yellow_card', 'red_card', 'substitution_in', 'substitution_out']);

test('event store validates required fields', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [])
        ->assertSessionHasErrors(['match_id', 'team_id', 'event_type']);
});

test('event store rejects invalid event_type', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'corner_kick',
        ])
        ->assertSessionHasErrors('event_type');
});

test('event minute must be between 0 and 120', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
            'minute' => 150,
        ])
        ->assertSessionHasErrors('minute');
});

test('event user_id is optional', function () {
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('match_events', [
        'match_id' => $this->match->id,
        'event_type' => 'goal',
        'user_id' => null,
    ]);
});

test('non-leader cannot record events', function () {
    $this->actingAs($this->homePlayer)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ])
        ->assertSessionHas('error');

    $this->assertDatabaseMissing('match_events', [
        'match_id' => $this->match->id,
        'event_type' => 'goal',
    ]);
});

test('outsider cannot record events', function () {
    $this->actingAs($this->outsider)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ])
        ->assertSessionHas('error');

    $this->assertDatabaseMissing('match_events', [
        'match_id' => $this->match->id,
        'event_type' => 'goal',
    ]);
});

// ============================================================
// Event Deletion
// ============================================================

test('home leader can delete an event', function () {
    $event = MatchEvent::create([
        'match_id' => $this->match->id,
        'team_id' => $this->homeTeam->id,
        'event_type' => 'yellow_card',
        'minute' => 30,
    ]);

    $this->actingAs($this->homeCaptain)
        ->delete(route('match-events.destroy', $event->id))
        ->assertRedirect();

    $this->assertDatabaseMissing('match_events', ['id' => $event->id]);
});

test('deleting a home goal auto-decrements home_score', function () {
    $this->match->update(['home_score' => 2]);
    $event = MatchEvent::create([
        'match_id' => $this->match->id,
        'team_id' => $this->homeTeam->id,
        'event_type' => 'goal',
    ]);

    $this->actingAs($this->homeCaptain)
        ->delete(route('match-events.destroy', $event->id))
        ->assertRedirect();

    expect($this->match->fresh()->home_score)->toBe(1);
});

test('deleting an away goal auto-decrements away_score', function () {
    $this->match->update(['away_score' => 3]);
    $event = MatchEvent::create([
        'match_id' => $this->match->id,
        'team_id' => $this->awayTeam->id,
        'event_type' => 'goal',
    ]);

    $this->actingAs($this->awayCaptain)
        ->delete(route('match-events.destroy', $event->id))
        ->assertRedirect();

    expect($this->match->fresh()->away_score)->toBe(2);
});

test('deleting a non-goal event does not affect score', function () {
    $this->match->update(['home_score' => 2]);
    $event = MatchEvent::create([
        'match_id' => $this->match->id,
        'team_id' => $this->homeTeam->id,
        'event_type' => 'red_card',
    ]);

    $this->actingAs($this->homeCaptain)
        ->delete(route('match-events.destroy', $event->id))
        ->assertRedirect();

    expect($this->match->fresh()->home_score)->toBe(2);
});

test('deleting a goal does not push score below zero', function () {
    // home_score is 0 but a stray goal event exists
    $event = MatchEvent::create([
        'match_id' => $this->match->id,
        'team_id' => $this->homeTeam->id,
        'event_type' => 'goal',
    ]);

    $this->actingAs($this->homeCaptain)
        ->delete(route('match-events.destroy', $event->id))
        ->assertRedirect();

    expect($this->match->fresh()->home_score)->toBe(0);
});

test('non-leader cannot delete events', function () {
    $event = MatchEvent::create([
        'match_id' => $this->match->id,
        'team_id' => $this->homeTeam->id,
        'event_type' => 'goal',
    ]);

    $this->actingAs($this->homePlayer)
        ->delete(route('match-events.destroy', $event->id))
        ->assertRedirect();

    // Service throws → flashes error and event remains
    $this->assertDatabaseHas('match_events', ['id' => $event->id]);
});

test('away leader cannot delete a home team event', function () {
    $event = MatchEvent::create([
        'match_id' => $this->match->id,
        'team_id' => $this->homeTeam->id,
        'event_type' => 'goal',
    ]);

    $this->actingAs($this->awayCaptain)
        ->delete(route('match-events.destroy', $event->id))
        ->assertRedirect();

    $this->assertDatabaseHas('match_events', ['id' => $event->id]);
});

// ============================================================
// Full Lifecycle
// ============================================================

test('record and delete cycle keeps the score in sync', function () {
    // 2 home goals
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ]);
    $this->actingAs($this->homeCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->homeTeam->id,
            'event_type' => 'goal',
        ]);

    // 1 away goal
    $this->actingAs($this->awayCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->awayTeam->id,
            'event_type' => 'goal',
        ]);

    expect($this->match->fresh()->home_score)->toBe(2);
    expect($this->match->fresh()->away_score)->toBe(1);

    // Delete one home goal
    $homeGoal = MatchEvent::where('match_id', $this->match->id)
        ->where('team_id', $this->homeTeam->id)
        ->where('event_type', 'goal')
        ->first();

    $this->actingAs($this->homeCaptain)
        ->delete(route('match-events.destroy', $homeGoal->id));

    // Add another away goal
    $this->actingAs($this->awayCaptain)
        ->post(route('match-events.store'), [
            'match_id' => $this->match->id,
            'team_id' => $this->awayTeam->id,
            'event_type' => 'goal',
        ]);

    $fresh = $this->match->fresh();
    expect($fresh->home_score)->toBe(1);
    expect($fresh->away_score)->toBe(2);
});

test('guest cannot record match events', function () {
    $this->post(route('match-events.store'), [
        'match_id' => $this->match->id,
        'team_id' => $this->homeTeam->id,
        'event_type' => 'goal',
    ])->assertRedirect(route('login'));
});
