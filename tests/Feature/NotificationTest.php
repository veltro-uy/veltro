<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    $this->user = User::factory()->create([
        'email_verified_at' => now(),
    ]);
});

test('user can view their notifications', function () {
    $this->actingAs($this->user)
        ->get('/notifications')
        ->assertOk()
        ->assertJsonStructure([
            'current_page',
            'data' => [
                '*' => [
                    'id',
                    'type',
                    'data',
                    'read_at',
                    'created_at',
                ],
            ],
            'total',
        ]);
});

test('user can get unread notification count', function () {
    // Create a notification for the user
    $this->user->notifications()->create([
        'id' => \Illuminate\Support\Str::uuid(),
        'type' => 'App\Notifications\MatchRequestReceivedNotification',
        'data' => [
            'type' => 'match_request_received',
            'title' => 'Test Notification',
            'message' => 'This is a test',
            'action_url' => '/matches/1',
            'icon' => 'Trophy',
            'related_model' => ['match_id' => 1],
            'created_at' => now()->toISOString(),
        ],
        'read_at' => null,
    ]);

    $this->actingAs($this->user)
        ->get('/notifications/unread-count')
        ->assertOk()
        ->assertJson(['count' => 1]);
});

test('user can mark notification as read', function () {
    $notification = $this->user->notifications()->create([
        'id' => \Illuminate\Support\Str::uuid(),
        'type' => 'App\Notifications\MatchRequestReceivedNotification',
        'data' => [
            'type' => 'match_request_received',
            'title' => 'Test Notification',
            'message' => 'This is a test',
            'action_url' => '/matches/1',
            'icon' => 'Trophy',
            'related_model' => ['match_id' => 1],
            'created_at' => now()->toISOString(),
        ],
        'read_at' => null,
    ]);

    $this->actingAs($this->user)
        ->post("/notifications/{$notification->id}/read")
        ->assertOk();

    expect($notification->fresh()->read_at)->not->toBeNull();
});

test('user can mark all notifications as read', function () {
    // Create multiple unread notifications
    for ($i = 0; $i < 3; $i++) {
        $this->user->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'App\Notifications\MatchRequestReceivedNotification',
            'data' => [
                'type' => 'match_request_received',
                'title' => "Test Notification {$i}",
                'message' => 'This is a test',
                'action_url' => '/matches/1',
                'icon' => 'Trophy',
                'related_model' => ['match_id' => 1],
                'created_at' => now()->toISOString(),
            ],
            'read_at' => null,
        ]);
    }

    $this->actingAs($this->user)
        ->post('/notifications/mark-all-read')
        ->assertOk();

    expect($this->user->unreadNotifications()->count())->toBe(0);
});

test('user can delete a notification', function () {
    $notification = $this->user->notifications()->create([
        'id' => \Illuminate\Support\Str::uuid(),
        'type' => 'App\Notifications\MatchRequestReceivedNotification',
        'data' => [
            'type' => 'match_request_received',
            'title' => 'Test Notification',
            'message' => 'This is a test',
            'action_url' => '/matches/1',
            'icon' => 'Trophy',
            'related_model' => ['match_id' => 1],
            'created_at' => now()->toISOString(),
        ],
        'read_at' => null,
    ]);

    $this->actingAs($this->user)
        ->delete("/notifications/{$notification->id}")
        ->assertOk();

    expect($this->user->notifications()->count())->toBe(0);
});

test('user can clear read notifications', function () {
    // Create read and unread notifications
    $this->user->notifications()->create([
        'id' => \Illuminate\Support\Str::uuid(),
        'type' => 'App\Notifications\MatchRequestReceivedNotification',
        'data' => [
            'type' => 'match_request_received',
            'title' => 'Read Notification',
            'message' => 'This is a test',
            'action_url' => '/matches/1',
            'icon' => 'Trophy',
            'related_model' => ['match_id' => 1],
            'created_at' => now()->toISOString(),
        ],
        'read_at' => now(),
    ]);

    $this->user->notifications()->create([
        'id' => \Illuminate\Support\Str::uuid(),
        'type' => 'App\Notifications\MatchRequestReceivedNotification',
        'data' => [
            'type' => 'match_request_received',
            'title' => 'Unread Notification',
            'message' => 'This is a test',
            'action_url' => '/matches/1',
            'icon' => 'Trophy',
            'related_model' => ['match_id' => 1],
            'created_at' => now()->toISOString(),
        ],
        'read_at' => null,
    ]);

    $this->actingAs($this->user)
        ->post('/notifications/clear-read')
        ->assertOk();

    expect($this->user->notifications()->count())->toBe(1)
        ->and($this->user->unreadNotifications()->count())->toBe(1);
});

test('user cannot view other users notifications', function () {
    $otherUser = User::factory()->create(['email_verified_at' => now()]);

    $otherUser->notifications()->create([
        'id' => \Illuminate\Support\Str::uuid(),
        'type' => 'App\Notifications\MatchRequestReceivedNotification',
        'data' => [
            'type' => 'match_request_received',
            'title' => 'Test Notification',
            'message' => 'This is a test',
            'action_url' => '/matches/1',
            'icon' => 'Trophy',
            'related_model' => ['match_id' => 1],
            'created_at' => now()->toISOString(),
        ],
        'read_at' => null,
    ]);

    $this->actingAs($this->user)
        ->get('/notifications')
        ->assertOk()
        ->assertJsonPath('total', 0);
});

test('unauthenticated user cannot access notifications', function () {
    $this->get('/notifications')
        ->assertRedirect('/login');
});
