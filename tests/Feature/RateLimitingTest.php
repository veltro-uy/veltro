<?php

use App\Models\User;

test('home page is rate limited to 30 requests per minute', function () {
    // Make 30 requests - should succeed
    for ($i = 0; $i < 30; $i++) {
        $response = $this->get(route('home'));
        $response->assertOk();
    }

    // 31st request should be rate limited
    $response = $this->get(route('home'));
    $response->assertStatus(429);
});

test('google oauth redirect is rate limited to 10 requests per minute', function () {
    // Make 10 requests - should succeed
    for ($i = 0; $i < 10; $i++) {
        $response = $this->get(route('google.redirect'));
        // OAuth redirect will redirect to Google, so we check for redirect status
        $response->assertStatus(302);
    }

    // 11th request should be rate limited
    $response = $this->get(route('google.redirect'));
    $response->assertStatus(429);
});

test('google oauth callback is rate limited to 10 requests per minute', function () {
    // Make 10 requests - should succeed (will fail auth but not rate limit)
    for ($i = 0; $i < 10; $i++) {
        $response = $this->get(route('google.callback'));
        // Will redirect to login with error, but not rate limited
        expect($response->status())->not->toBe(429);
    }

    // 11th request should be rate limited
    $response = $this->get(route('google.callback'));
    $response->assertStatus(429);
});

test('dashboard is rate limited to 60 requests per minute', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    // Make 60 requests - should succeed
    for ($i = 0; $i < 60; $i++) {
        $response = $this->actingAs($user)->get(route('dashboard'));
        $response->assertOk();
    }

    // 61st request should be rate limited
    $response = $this->actingAs($user)->get(route('dashboard'));
    $response->assertStatus(429);
});

test('team routes are rate limited to 60 requests per minute', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    // Make 60 requests - should succeed
    for ($i = 0; $i < 60; $i++) {
        $response = $this->actingAs($user)->get(route('teams.index'));
        $response->assertOk();
    }

    // 61st request should be rate limited
    $response = $this->actingAs($user)->get(route('teams.index'));
    $response->assertStatus(429);
});

test('match routes are rate limited to 60 requests per minute', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    // Make 60 requests - should succeed
    for ($i = 0; $i < 60; $i++) {
        $response = $this->actingAs($user)->get(route('matches.index'));
        $response->assertOk();
    }

    // 61st request should be rate limited
    $response = $this->actingAs($user)->get(route('matches.index'));
    $response->assertStatus(429);
});

test('settings read routes are rate limited to 60 requests per minute', function () {
    $user = User::factory()->create();

    // Make 60 requests - should succeed
    for ($i = 0; $i < 60; $i++) {
        $response = $this->actingAs($user)->get(route('profile.edit'));
        $response->assertOk();
    }

    // 61st request should be rate limited
    $response = $this->actingAs($user)->get(route('profile.edit'));
    $response->assertStatus(429);
});

test('profile update is rate limited to 6 requests per minute', function () {
    $user = User::factory()->create();

    // Make 6 requests - should succeed
    for ($i = 0; $i < 6; $i++) {
        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);
        $response->assertRedirect();
    }

    // 7th request should be rate limited
    $response = $this->actingAs($user)->patch(route('profile.update'), [
        'name' => 'Test User',
        'email' => $user->email,
    ]);
    $response->assertStatus(429);
});

test('password update is rate limited to 6 requests per minute', function () {
    $user = User::factory()->create();

    // Make 6 requests - should succeed (will fail validation but not rate limit)
    for ($i = 0; $i < 6; $i++) {
        $response = $this->actingAs($user)->put(route('user-password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);
        // Will have validation errors but not rate limited
        expect($response->status())->not->toBe(429);
    }

    // 7th request should be rate limited
    $response = $this->actingAs($user)->put(route('user-password.update'), [
        'current_password' => 'wrong-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
    ]);
    $response->assertStatus(429);
});

test('profile deletion is rate limited to 6 requests per minute for same user', function () {
    $user = User::factory()->create();

    // Make 6 deletion attempts with wrong password - should fail validation but not rate limit
    for ($i = 0; $i < 6; $i++) {
        $response = $this->actingAs($user)->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);
        // Will have validation error but not rate limited
        expect($response->status())->not->toBe(429);
    }

    // 7th request should be rate limited
    $response = $this->actingAs($user)->delete(route('profile.destroy'), [
        'password' => 'wrong-password',
    ]);
    $response->assertStatus(429);
});

test('different routes have independent rate limiters', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    // Hit dashboard 60 times
    for ($i = 0; $i < 60; $i++) {
        $response = $this->actingAs($user)->get(route('dashboard'));
        $response->assertOk();
    }

    // Dashboard should be rate limited
    $response = $this->actingAs($user)->get(route('dashboard'));
    $response->assertStatus(429);

    // But teams should still work (different rate limiter)
    $response = $this->actingAs($user)->get(route('teams.index'));
    $response->assertOk();
});

test('settings read and write operations have different rate limits', function () {
    $user = User::factory()->create();

    // Hit profile edit 60 times (read limit)
    for ($i = 0; $i < 60; $i++) {
        $response = $this->actingAs($user)->get(route('profile.edit'));
        $response->assertOk();
    }

    // Profile edit should be rate limited
    $response = $this->actingAs($user)->get(route('profile.edit'));
    $response->assertStatus(429);

    // But profile update should still work (different, stricter rate limiter)
    $response = $this->actingAs($user)->patch(route('profile.update'), [
        'name' => 'Test User',
        'email' => $user->email,
    ]);
    $response->assertRedirect();
});
