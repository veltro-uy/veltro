<?php

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laravel\Fortify\Features;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

beforeEach(function () {
    // Mock the Socialite Google driver
    $this->mockSocialiteUser = (new SocialiteUser)
        ->map([
            'id' => '1234567890',
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'avatar' => 'https://example.com/avatar.jpg',
        ])
        ->setToken('mock-token');
});

test('google oauth login works for users without two factor authentication', function () {
    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($this->mockSocialiteUser);

    $response = $this->get(route('google.callback'));

    $this->assertAuthenticated();
    $response->assertRedirect('/matches');

    // Verify user was created
    $user = User::where('email', 'john@example.com')->first();
    expect($user)->not->toBeNull()
        ->and($user->google_id)->toBe('1234567890')
        ->and($user->name)->toBe('John Doe');
});

test('google oauth login redirects to two factor challenge when user has 2fa enabled', function () {
    if (! Features::canManageTwoFactorAuthentication()) {
        $this->markTestSkipped('Two-factor authentication is not enabled.');
    }

    Features::twoFactorAuthentication([
        'confirm' => true,
        'confirmPassword' => true,
    ]);

    // Create a user with 2FA enabled
    $user = User::factory()->create([
        'email' => 'john@example.com',
        'google_id' => '1234567890',
    ]);

    $user->forceFill([
        'two_factor_secret' => encrypt('test-secret'),
        'two_factor_recovery_codes' => encrypt(json_encode(['code1', 'code2'])),
        'two_factor_confirmed_at' => now(),
    ])->save();

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($this->mockSocialiteUser);

    $response = $this->get(route('google.callback'));

    // Should NOT be authenticated yet
    $this->assertGuest();

    // Should be redirected to two-factor challenge
    $response->assertRedirect(route('two-factor.login'));

    // Session should have the login.id
    $response->assertSessionHas('login.id', $user->id);
});

test('google oauth login updates existing user with google credentials', function () {
    // Create existing user without Google ID
    $user = User::factory()->withoutTwoFactor()->create([
        'email' => 'john@example.com',
        'google_id' => null,
    ]);

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($this->mockSocialiteUser);

    $response = $this->get(route('google.callback'));

    $this->assertAuthenticated();
    $response->assertRedirect('/matches');

    // Verify user was updated with Google credentials
    $user->refresh();
    expect($user->google_id)->toBe('1234567890')
        ->and($user->google_avatar_url)->toBe('https://example.com/avatar.jpg');
});

test('google oauth login finds user by google_id', function () {
    // Create user with Google ID
    $user = User::factory()->withoutTwoFactor()->create([
        'email' => 'different@example.com',
        'google_id' => '1234567890',
    ]);

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($this->mockSocialiteUser);

    $response = $this->get(route('google.callback'));

    $this->assertAuthenticated();

    // Should authenticate as the existing user (matched by google_id)
    expect(Auth::user()->id)->toBe($user->id)
        ->and(Auth::user()->email)->toBe('different@example.com');
});
