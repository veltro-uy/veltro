<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    // Fake the default filesystem disk
    Storage::fake(config('filesystems.default'));
});

test('authenticated user can upload avatar', function () {
    $user = User::factory()->create();
    $disk = config('filesystems.default');

    $file = UploadedFile::fake()->create('avatar.jpg', 1000, 'image/jpeg');

    $response = $this->actingAs($user)
        ->post('/settings/avatar', [
            'avatar' => $file,
        ]);

    $response->assertRedirect();

    // Check that the avatar_path was updated
    $user->refresh();
    expect($user->avatar_path)->not->toBeNull();

    // Check that file was stored
    Storage::disk($disk)->assertExists($user->avatar_path);
});

test('avatar upload validates file type', function () {
    $user = User::factory()->create();

    $file = UploadedFile::fake()->create('document.pdf', 1000);

    $response = $this->actingAs($user)
        ->post('/settings/avatar', [
            'avatar' => $file,
        ]);

    $response->assertSessionHasErrors('avatar');
});

test('avatar upload validates file size', function () {
    $user = User::factory()->create();

    // Create a file larger than 2MB
    $file = UploadedFile::fake()->create('avatar.jpg', 3000, 'image/jpeg');

    $response = $this->actingAs($user)
        ->post('/settings/avatar', [
            'avatar' => $file,
        ]);

    $response->assertSessionHasErrors('avatar');
});

test('old avatar is deleted when uploading new one', function () {
    $disk = config('filesystems.default');

    $user = User::factory()->create([
        'avatar_path' => 'avatars/old-avatar.jpg',
    ]);

    // Create the old avatar file
    Storage::disk($disk)->put('avatars/old-avatar.jpg', 'old content');

    $file = UploadedFile::fake()->create('new-avatar.jpg', 1000, 'image/jpeg');

    $response = $this->actingAs($user)
        ->post('/settings/avatar', [
            'avatar' => $file,
        ]);

    $response->assertRedirect();

    // Old file should be deleted
    Storage::disk($disk)->assertMissing('avatars/old-avatar.jpg');

    // New file should exist
    $user->refresh();
    Storage::disk($disk)->assertExists($user->avatar_path);
});

test('authenticated user can delete avatar', function () {
    $disk = config('filesystems.default');

    $user = User::factory()->create([
        'avatar_path' => 'avatars/test-avatar.jpg',
    ]);

    Storage::disk($disk)->put('avatars/test-avatar.jpg', 'content');

    $response = $this->actingAs($user)
        ->delete('/settings/avatar');

    $response->assertRedirect();

    // Avatar path should be null
    $user->refresh();
    expect($user->avatar_path)->toBeNull();

    // File should be deleted
    Storage::disk($disk)->assertMissing('avatars/test-avatar.jpg');
});

test('guests cannot upload avatar', function () {
    $file = UploadedFile::fake()->create('avatar.jpg', 1000, 'image/jpeg');

    $response = $this->post('/settings/avatar', [
        'avatar' => $file,
    ]);

    $response->assertRedirect('/login');
});

test('guests cannot delete avatar', function () {
    $response = $this->delete('/settings/avatar');

    $response->assertRedirect('/login');
});
