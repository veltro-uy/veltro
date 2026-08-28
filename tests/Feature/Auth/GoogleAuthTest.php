<?php

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\TeamMember;
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
    $response->assertRedirect('/teams');

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
    $response->assertRedirect('/teams');

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

test('google oauth defers a co-captain invitation until phone onboarding', function () {
    $captain = User::factory()->create();
    $team = Team::create([
        'name' => 'OAuth Team',
        'variant' => 'football_11',
        'created_by' => $captain->id,
        'max_members' => 25,
    ]);
    TeamMember::create([
        'user_id' => $captain->id,
        'team_id' => $team->id,
        'role' => 'captain',
        'status' => 'active',
    ]);
    $invitation = TeamInvitation::create([
        'team_id' => $team->id,
        'invited_by' => $captain->id,
        'email' => 'john@example.com',
        'token' => TeamInvitation::generateToken(),
        'role' => 'co_captain',
        'status' => 'pending',
        'expires_at' => now()->addWeek(),
    ]);

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($this->mockSocialiteUser);

    $this->withSession(['invitation_token' => $invitation->token])
        ->get(route('google.callback'))
        ->assertRedirect(route('teams.invitation.show', $invitation->token))
        ->assertSessionHas('invitation_token', $invitation->token);

    $user = User::where('email', 'john@example.com')->firstOrFail();
    expect($team->hasMember($user->id))->toBeFalse()
        ->and($invitation->fresh()->status)->toBe('pending')
        ->and($user->hasVerifiedEmail())->toBeTrue();

    $onboarding = $this->get(route('onboarding.show'));
    $onboarding->assertOk();
    $onboarding->assertInertia(fn ($page) => $page->where('phoneRequired', true));
});

test('google oauth keeps invitation state through the two factor branch', function () {
    if (! Features::canManageTwoFactorAuthentication()) {
        $this->markTestSkipped('Two-factor authentication is not enabled.');
    }

    $user = User::factory()->withoutPhoneNumber()->create([
        'email' => 'john@example.com',
        'google_id' => '1234567890',
    ]);
    $captain = User::factory()->create();
    $team = Team::create([
        'name' => '2FA Team',
        'variant' => 'football_11',
        'created_by' => $captain->id,
        'max_members' => 25,
    ]);
    TeamMember::create([
        'user_id' => $captain->id,
        'team_id' => $team->id,
        'role' => 'captain',
        'status' => 'active',
    ]);
    $invitation = TeamInvitation::create([
        'team_id' => $team->id,
        'invited_by' => $captain->id,
        'email' => $user->email,
        'token' => TeamInvitation::generateToken(),
        'role' => 'co_captain',
        'status' => 'pending',
        'expires_at' => now()->addWeek(),
    ]);
    $intended = route('teams.invitation.show', $invitation->token);

    Socialite::shouldReceive('driver->user')
        ->once()
        ->andReturn($this->mockSocialiteUser);

    $this->withSession([
        'invitation_token' => $invitation->token,
        'url.intended' => $intended,
    ])->get(route('google.callback'))
        ->assertRedirect(route('two-factor.login'))
        ->assertSessionHas('invitation_token', $invitation->token)
        ->assertSessionHas('url.intended', $intended);

    expect($team->hasMember($user->id))->toBeFalse()
        ->and($invitation->fresh()->status)->toBe('pending');
});
