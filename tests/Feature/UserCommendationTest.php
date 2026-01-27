<?php

use App\Models\FootballMatch;
use App\Models\MatchAvailability;
use App\Models\Team;
use App\Models\User;
use App\Models\UserCommendation;
use App\Notifications\CommendationReceivedNotification;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();
});

test('user can commend another user they have played with', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    // Create a match where both users participated
    $team1 = Team::create([
        'name' => 'Team 1',
        'variant' => 'football_11',
        'created_by' => $user1->id,
    ]);

    $team2 = Team::create([
        'name' => 'Team 2',
        'variant' => 'football_11',
        'created_by' => $user2->id,
    ]);

    $match = FootballMatch::create([
        'home_team_id' => $team1->id,
        'away_team_id' => $team2->id,
        'variant' => 'football_11',
        'scheduled_at' => now()->addDay(),
        'location' => 'Stadium',
        'match_type' => 'friendly',
        'status' => 'confirmed',
        'created_by' => $user1->id,
    ]);

    // Both users have availability for the same match
    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $user1->id,
        'team_id' => $team1->id,
        'status' => 'available',
    ]);

    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $user2->id,
        'team_id' => $team2->id,
        'status' => 'available',
    ]);

    $response = $this->actingAs($user1)->postJson("/api/users/{$user2->id}/commendations", [
        'category' => 'friendly',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'commendation',
            'stats',
        ]);

    $this->assertDatabaseHas('user_commendations', [
        'from_user_id' => $user1->id,
        'to_user_id' => $user2->id,
        'category' => 'friendly',
    ]);

    Notification::assertSentTo($user2, CommendationReceivedNotification::class);
});

test('user cannot commend same user twice in same category', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    // Setup match availability
    $team = Team::create([
        'name' => 'Team',
        'variant' => 'football_11',
        'created_by' => $user1->id,
    ]);

    $match = FootballMatch::create([
        'home_team_id' => $team->id,
        'variant' => 'football_11',
        'scheduled_at' => now()->addDay(),
        'location' => 'Stadium',
        'match_type' => 'friendly',
        'status' => 'confirmed',
        'created_by' => $user1->id,
    ]);

    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $user1->id,
        'team_id' => $team->id,
        'status' => 'available',
    ]);

    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $user2->id,
        'team_id' => $team->id,
        'status' => 'available',
    ]);

    // First commendation
    UserCommendation::create([
        'from_user_id' => $user1->id,
        'to_user_id' => $user2->id,
        'category' => 'friendly',
    ]);

    // Try to commend again
    $response = $this->actingAs($user1)->postJson("/api/users/{$user2->id}/commendations", [
        'category' => 'friendly',
    ]);

    $response->assertStatus(422);
});

test('user can commend different categories', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    // Setup match availability
    $team = Team::create([
        'name' => 'Team',
        'variant' => 'football_11',
        'created_by' => $user1->id,
    ]);

    $match = FootballMatch::create([
        'home_team_id' => $team->id,
        'variant' => 'football_11',
        'scheduled_at' => now()->addDay(),
        'location' => 'Stadium',
        'match_type' => 'friendly',
        'status' => 'confirmed',
        'created_by' => $user1->id,
    ]);

    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $user1->id,
        'team_id' => $team->id,
        'status' => 'available',
    ]);

    MatchAvailability::create([
        'match_id' => $match->id,
        'user_id' => $user2->id,
        'team_id' => $team->id,
        'status' => 'available',
    ]);

    $response1 = $this->actingAs($user1)->postJson("/api/users/{$user2->id}/commendations", [
        'category' => 'friendly',
    ]);

    $response2 = $this->actingAs($user1)->postJson("/api/users/{$user2->id}/commendations", [
        'category' => 'skilled',
    ]);

    $response1->assertStatus(201);
    $response2->assertStatus(201);

    expect(UserCommendation::where('to_user_id', $user2->id)->count())->toBe(2);
});

test('user cannot commend self', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson("/api/users/{$user->id}/commendations", [
        'category' => 'friendly',
    ]);

    $response->assertStatus(422);
});

test('user cannot commend if havent played together', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $response = $this->actingAs($user1)->postJson("/api/users/{$user2->id}/commendations", [
        'category' => 'friendly',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'message' => 'Solo puedes reconocer a jugadores con los que hayas jugado.',
        ]);
});

test('user can remove commendation', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $commendation = UserCommendation::create([
        'from_user_id' => $user1->id,
        'to_user_id' => $user2->id,
        'category' => 'friendly',
    ]);

    $response = $this->actingAs($user1)->deleteJson("/api/users/{$user2->id}/commendations/friendly");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('user_commendations', [
        'id' => $commendation->id,
    ]);
});

test('commendation stats are calculated correctly', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    UserCommendation::create([
        'from_user_id' => $otherUser->id,
        'to_user_id' => $user->id,
        'category' => 'friendly',
    ]);

    UserCommendation::create([
        'from_user_id' => $otherUser->id,
        'to_user_id' => $user->id,
        'category' => 'skilled',
    ]);

    $stats = $user->getCommendationStats();

    expect($stats['friendly'])->toBe(1)
        ->and($stats['skilled'])->toBe(1)
        ->and($stats['teamwork'])->toBe(0)
        ->and($stats['leadership'])->toBe(0)
        ->and($stats['total'])->toBe(2);
});

test('guest cannot create commendation', function () {
    $user = User::factory()->create();

    $response = $this->postJson("/api/users/{$user->id}/commendations", [
        'category' => 'friendly',
    ]);

    $response->assertStatus(401);
});
