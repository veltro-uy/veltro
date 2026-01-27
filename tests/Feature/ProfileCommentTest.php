<?php

use App\Models\ProfileComment;
use App\Models\User;
use App\Notifications\ProfileCommentNotification;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();
});

test('user can comment on another users profile', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $response = $this->actingAs($user1)->postJson("/api/users/{$user2->id}/comments", [
        'comment' => 'Great player!',
    ]);

    $response->assertStatus(201)
        ->assertJsonStructure([
            'message',
            'comment' => [
                'id',
                'user_id',
                'profile_user_id',
                'comment',
                'created_at',
                'author',
            ],
        ]);

    $this->assertDatabaseHas('profile_comments', [
        'user_id' => $user1->id,
        'profile_user_id' => $user2->id,
        'comment' => 'Great player!',
    ]);

    Notification::assertSentTo($user2, ProfileCommentNotification::class);
});

test('user cannot comment on own profile', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->postJson("/api/users/{$user->id}/comments", [
        'comment' => 'I am great!',
    ]);

    $response->assertStatus(422)
        ->assertJson([
            'message' => 'No puedes comentar en tu propio perfil.',
        ]);
});

test('comments are paginated correctly', function () {
    $user = User::factory()->create();
    $commenter = User::factory()->create();

    // Create 25 comments
    for ($i = 0; $i < 25; $i++) {
        ProfileComment::create([
            'user_id' => $commenter->id,
            'profile_user_id' => $user->id,
            'comment' => "Comment {$i}",
        ]);
    }

    $response = $this->getJson("/api/users/{$user->id}/comments");

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'current_page',
            'last_page',
            'per_page',
            'total',
        ])
        ->assertJsonCount(20, 'data')
        ->assertJson([
            'total' => 25,
            'per_page' => 20,
            'current_page' => 1,
            'last_page' => 2,
        ]);
});

test('profile owner can delete any comment on their profile', function () {
    $profileOwner = User::factory()->create();
    $commenter = User::factory()->create();

    $comment = ProfileComment::create([
        'user_id' => $commenter->id,
        'profile_user_id' => $profileOwner->id,
        'comment' => 'Test comment',
    ]);

    $response = $this->actingAs($profileOwner)->deleteJson("/api/comments/{$comment->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('profile_comments', [
        'id' => $comment->id,
    ]);
});

test('comment author can delete their own comment', function () {
    $author = User::factory()->create();
    $profileOwner = User::factory()->create();

    $comment = ProfileComment::create([
        'user_id' => $author->id,
        'profile_user_id' => $profileOwner->id,
        'comment' => 'Test comment',
    ]);

    $response = $this->actingAs($author)->deleteJson("/api/comments/{$comment->id}");

    $response->assertStatus(200);

    $this->assertDatabaseMissing('profile_comments', [
        'id' => $comment->id,
    ]);
});

test('user cannot delete others comments unless profile owner', function () {
    $author = User::factory()->create();
    $profileOwner = User::factory()->create();
    $otherUser = User::factory()->create();

    $comment = ProfileComment::create([
        'user_id' => $author->id,
        'profile_user_id' => $profileOwner->id,
        'comment' => 'Test comment',
    ]);

    $response = $this->actingAs($otherUser)->deleteJson("/api/comments/{$comment->id}");

    $response->assertStatus(403);

    $this->assertDatabaseHas('profile_comments', [
        'id' => $comment->id,
    ]);
});

test('guest cannot create comment', function () {
    $user = User::factory()->create();

    $response = $this->postJson("/api/users/{$user->id}/comments", [
        'comment' => 'Test comment',
    ]);

    $response->assertStatus(401);
});

test('comment validation max 1000 chars', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $longComment = str_repeat('a', 1001);

    $response = $this->actingAs($user1)->postJson("/api/users/{$user2->id}/comments", [
        'comment' => $longComment,
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['comment']);
});

test('comment is required', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $response = $this->actingAs($user1)->postJson("/api/users/{$user2->id}/comments", [
        'comment' => '',
    ]);

    $response->assertStatus(422)
        ->assertJsonValidationErrors(['comment']);
});

test('comments are ordered by newest first', function () {
    $user = User::factory()->create();
    $commenter = User::factory()->create();

    $comment1 = ProfileComment::create([
        'user_id' => $commenter->id,
        'profile_user_id' => $user->id,
        'comment' => 'First comment',
        'created_at' => now()->subHours(2),
    ]);

    $comment2 = ProfileComment::create([
        'user_id' => $commenter->id,
        'profile_user_id' => $user->id,
        'comment' => 'Second comment',
        'created_at' => now()->subHour(),
    ]);

    $comment3 = ProfileComment::create([
        'user_id' => $commenter->id,
        'profile_user_id' => $user->id,
        'comment' => 'Third comment',
        'created_at' => now(),
    ]);

    $response = $this->getJson("/api/users/{$user->id}/comments");

    $response->assertStatus(200);

    $data = $response->json('data');
    expect($data[0]['id'])->toBe($comment3->id)
        ->and($data[1]['id'])->toBe($comment2->id)
        ->and($data[2]['id'])->toBe($comment1->id);
});
