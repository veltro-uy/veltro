<?php

test('registration screen can be rendered', function () {
    $response = $this->get(route('register'));

    $response->assertStatus(200);
});

test('new users can register', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    // Get the user that was created
    $user = \App\Models\User::where('email', 'test@example.com')->first();

    // Verify the user exists
    expect($user)->not->toBeNull();

    // Verify the user's email so they can access the matches page
    $user->email_verified_at = now();
    $user->save();

    // Authenticate as the user (Fortify may not auto-login when email verification is enabled)
    $this->actingAs($user);

    $this->assertAuthenticated();

    // Check that we can access the matches page
    $response = $this->get(route('matches.index'));
    $response->assertOk();
});
