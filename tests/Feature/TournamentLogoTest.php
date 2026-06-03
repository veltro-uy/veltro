<?php

use App\Models\Tournament;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

test('user can create a tournament with a logo', function () {
    $disk = config('filesystems.default');
    Storage::fake($disk);

    $user = User::factory()->create(['email_verified_at' => now()]);
    $this->actingAs($user);

    $response = $this->post('/tournaments', [
        'name' => 'Logo Tournament',
        'description' => 'A tournament with a logo',
        'visibility' => 'public',
        'variant' => 'football_11',
        'max_teams' => 8,
        'min_teams' => 4,
        'starts_at' => now()->addDays(7)->toDateTimeString(),
        'logo' => UploadedFile::fake()->image('logo.png', 600, 600),
    ]);

    $response->assertRedirect();

    $tournament = Tournament::firstWhere('name', 'Logo Tournament');
    expect($tournament)->not->toBeNull()
        ->and($tournament->logo_path)->not->toBeNull();

    Storage::disk($disk)->assertExists($tournament->logo_path);
});
