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
    $this->match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => null,
        'scheduled_at' => now()->addDays(3),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'available',
        'created_by' => $this->user->id,
    ]);
});

test('availability belongs to match', function () {
    $availability = MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'available',
    ]);

    expect($availability->match)->toBeInstanceOf(FootballMatch::class)
        ->and($availability->match->id)->toBe($this->match->id);
});

test('availability belongs to user', function () {
    $availability = MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'available',
    ]);

    expect($availability->user)->toBeInstanceOf(User::class)
        ->and($availability->user->id)->toBe($this->user->id);
});

test('availability belongs to team', function () {
    $availability = MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'available',
    ]);

    expect($availability->team)->toBeInstanceOf(Team::class)
        ->and($availability->team->id)->toBe($this->team->id);
});

test('available scope filters available players', function () {
    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'available',
    ]);

    $unavailableUser = User::factory()->create();
    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $unavailableUser->id,
        'team_id' => $this->team->id,
        'status' => 'unavailable',
    ]);

    $available = MatchAvailability::available()->get();

    expect($available)->toHaveCount(1)
        ->and($available->first()->user_id)->toBe($this->user->id);
});

test('maybe scope filters maybe players', function () {
    $maybeUser = User::factory()->create();
    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $maybeUser->id,
        'team_id' => $this->team->id,
        'status' => 'maybe',
    ]);

    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'available',
    ]);

    $maybe = MatchAvailability::maybe()->get();

    expect($maybe)->toHaveCount(1)
        ->and($maybe->first()->user_id)->toBe($maybeUser->id);
});

test('unavailable scope filters unavailable players', function () {
    $unavailableUser = User::factory()->create();
    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $unavailableUser->id,
        'team_id' => $this->team->id,
        'status' => 'unavailable',
    ]);

    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'available',
    ]);

    $unavailable = MatchAvailability::unavailable()->get();

    expect($unavailable)->toHaveCount(1)
        ->and($unavailable->first()->user_id)->toBe($unavailableUser->id);
});

test('pending scope filters pending players', function () {
    $pendingUser = User::factory()->create();
    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $pendingUser->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'available',
    ]);

    $pending = MatchAvailability::pending()->get();

    expect($pending)->toHaveCount(1)
        ->and($pending->first()->user_id)->toBe($pendingUser->id);
});

test('markAvailable sets status and confirmed_at', function () {
    $availability = MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    $availability->markAvailable();

    expect($availability->fresh())
        ->status->toBe('available')
        ->confirmed_at->not->toBeNull();
});

test('markMaybe sets status and confirmed_at', function () {
    $availability = MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    $availability->markMaybe();

    expect($availability->fresh())
        ->status->toBe('maybe')
        ->confirmed_at->not->toBeNull();
});

test('markUnavailable sets status and confirmed_at', function () {
    $availability = MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    $availability->markUnavailable();

    expect($availability->fresh())
        ->status->toBe('unavailable')
        ->confirmed_at->not->toBeNull();
});

test('match has many availability records', function () {
    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $this->user->id,
        'team_id' => $this->team->id,
        'status' => 'available',
    ]);

    $user2 = User::factory()->create();
    MatchAvailability::create([
        'match_id' => $this->match->id,
        'user_id' => $user2->id,
        'team_id' => $this->team->id,
        'status' => 'maybe',
    ]);

    expect($this->match->availability)->toHaveCount(2);
});

test('getAvailablePlayersCount returns correct count', function () {
    // Create 3 available players
    foreach (range(1, 3) as $i) {
        $user = User::factory()->create();
        MatchAvailability::create([
            'match_id' => $this->match->id,
            'user_id' => $user->id,
            'team_id' => $this->team->id,
            'status' => 'available',
        ]);
    }

    // Create 2 unavailable players
    foreach (range(1, 2) as $i) {
        $user = User::factory()->create();
        MatchAvailability::create([
            'match_id' => $this->match->id,
            'user_id' => $user->id,
            'team_id' => $this->team->id,
            'status' => 'unavailable',
        ]);
    }

    expect($this->match->getAvailablePlayersCount($this->team->id))->toBe(3);
});

test('hasEnoughConfirmedPlayers returns true when enough players available', function () {
    // Football 11 requires 11 players
    // Create 11 available players
    foreach (range(1, 11) as $i) {
        $user = User::factory()->create();
        MatchAvailability::create([
            'match_id' => $this->match->id,
            'user_id' => $user->id,
            'team_id' => $this->team->id,
            'status' => 'available',
        ]);
    }

    expect($this->match->hasEnoughConfirmedPlayers($this->team->id))->toBeTrue();
});

test('hasEnoughConfirmedPlayers returns false when not enough players', function () {
    // Football 11 requires 11 players
    // Create only 5 available players
    foreach (range(1, 5) as $i) {
        $user = User::factory()->create();
        MatchAvailability::create([
            'match_id' => $this->match->id,
            'user_id' => $user->id,
            'team_id' => $this->team->id,
            'status' => 'available',
        ]);
    }

    expect($this->match->hasEnoughConfirmedPlayers($this->team->id))->toBeFalse();
});

test('needsPlayerAlert returns true when below minimum', function () {
    // Create only 5 available players for football 11
    foreach (range(1, 5) as $i) {
        $user = User::factory()->create();
        MatchAvailability::create([
            'match_id' => $this->match->id,
            'user_id' => $user->id,
            'team_id' => $this->team->id,
            'status' => 'available',
        ]);
    }

    expect($this->match->needsPlayerAlert($this->team->id))->toBeTrue();
});

test('needsPlayerAlert returns false when enough players', function () {
    // Create 11 available players for football 11
    foreach (range(1, 11) as $i) {
        $user = User::factory()->create();
        MatchAvailability::create([
            'match_id' => $this->match->id,
            'user_id' => $user->id,
            'team_id' => $this->team->id,
            'status' => 'available',
        ]);
    }

    expect($this->match->needsPlayerAlert($this->team->id))->toBeFalse();
});

test('getMinimumPlayers returns correct value for different variants', function (string $variant, int $expectedMin) {
    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => null,
        'scheduled_at' => now()->addDays(3),
        'location' => 'Test Field',
        'variant' => $variant,
        'status' => 'available',
        'created_by' => $this->user->id,
    ]);

    expect($match->getMinimumPlayers())->toBe($expectedMin);
})->with([
    'football_11' => ['football_11', 11],
    'football_7' => ['football_7', 7],
    'football_5' => ['football_5', 5],
    'futsal' => ['futsal', 5],
]);
