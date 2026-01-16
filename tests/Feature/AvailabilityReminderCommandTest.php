<?php

use App\Models\FootballMatch;
use App\Models\MatchAvailability;
use App\Models\Team;
use App\Models\User;
use App\Notifications\AvailabilityReminderNotification;
use Illuminate\Support\Facades\Notification;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    Notification::fake();

    $this->captain = User::factory()->create();
    $this->team = Team::create([
        'name' => 'Test Team',
        'variant' => 'football_11',
        'created_by' => $this->captain->id,
    ]);
    $this->team->teamMembers()->create(['user_id' => $this->captain->id, 'role' => 'captain']);

    $this->opponent = Team::create([
        'name' => 'Opponent Team',
        'variant' => 'football_11',
        'created_by' => $this->captain->id,
    ]);
});

test('command sends reminders for matches exactly 48 hours away', function () {
    // Create a match 48 hours from now
    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addHours(48),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    // Create pending availability for captain
    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    // Run the command
    $this->artisan('availability:send-reminders')->assertSuccessful();

    // Assert notification was sent
    Notification::assertSentTo($this->captain, AvailabilityReminderNotification::class);
});

test('command does not send reminders for matches not 48 hours away', function () {
    // Create a match 50 hours from now (outside the window)
    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addHours(50),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    $this->artisan('availability:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
});

test('command does not send reminders to users who already confirmed', function () {
    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addHours(48),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    // Create availability with confirmed status
    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'status' => 'available',
        'confirmed_at' => now(),
    ]);

    $this->artisan('availability:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
});

test('command does not send duplicate reminders', function () {
    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addHours(48),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    // Create availability with reminded_at already set
    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
        'reminded_at' => now()->subHour(),
    ]);

    $this->artisan('availability:send-reminders')->assertSuccessful();

    Notification::assertNothingSent();
});

test('command sends reminders to multiple pending players', function () {
    $player1 = User::factory()->create();
    $player2 = User::factory()->create();
    $player3 = User::factory()->create();

    $this->team->teamMembers()->create(['user_id' => $player1->id, 'role' => 'player']);
    $this->team->teamMembers()->create(['user_id' => $player2->id, 'role' => 'player']);
    $this->team->teamMembers()->create(['user_id' => $player3->id, 'role' => 'player']);

    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addHours(48),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    // Create pending availability for all players
    foreach ([$player1, $player2, $player3] as $player) {
        MatchAvailability::create([
            'match_id' => $match->id,
            'user_id' => $player->id,
            'team_id' => $this->team->id,
            'status' => 'pending',
        ]);
    }

    $this->artisan('availability:send-reminders')->assertSuccessful();

    // Assert all three players got notified
    Notification::assertSentTo([$player1, $player2, $player3], AvailabilityReminderNotification::class);
});

test('command updates reminded_at timestamp after sending', function () {
    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addHours(48),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    $availability = MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
        'reminded_at' => null,
    ]);

    $this->artisan('availability:send-reminders')->assertSuccessful();

    expect($availability->fresh()->reminded_at)->not->toBeNull();
});

test('command sends reminders to both home and away teams', function () {
    $awayPlayer = User::factory()->create();
    $this->opponent->teamMembers()->create(['user_id' => $awayPlayer->id, 'role' => 'player']);

    $match = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addHours(48),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'confirmed',
        'created_by' => $this->captain->id,
    ]);

    // Create pending availability for both teams
    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $awayPlayer->id,
        'team_id' => $this->opponent->id,
        'status' => 'pending',
    ]);

    $this->artisan('availability:send-reminders')->assertSuccessful();

    Notification::assertSentTo([$this->captain, $awayPlayer], AvailabilityReminderNotification::class);
});

test('command only processes confirmed and available matches', function () {
    $pendingMatch = FootballMatch::create([
        'home_team_id' => $this->team->id,
        'away_team_id' => $this->opponent->id,
        'scheduled_at' => now()->addHours(48),
        'location' => 'Test Field',
        'variant' => 'football_11',
        'status' => 'pending',
        'created_by' => $this->captain->id,
    ]);

    MatchAvailability::create([
        'match_id' => $pendingMatch->id,
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'status' => 'pending',
    ]);

    $this->artisan('availability:send-reminders')->assertSuccessful();

    // Should not send reminders for pending matches
    Notification::assertNothingSent();
});
