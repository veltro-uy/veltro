<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('password update page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('user-password.edit'));

    $response->assertStatus(200);
});

test('password can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-password.edit'));

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('correct password must be provided to update password', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasErrors('current_password')
        ->assertRedirect(route('user-password.edit'));
});

test('oauth users without password can create password without current password', function () {
    // Create OAuth user without password
    $user = User::factory()->create([
        'password' => null,
        'google_id' => 'google_123456',
    ]);

    expect($user->hasPassword())->toBeFalse();

    $response = $this
        ->actingAs($user)
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('user-password.edit'));

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
    expect($user->hasPassword())->toBeTrue();
});

test('oauth users are redirected to intended url after setting password', function () {
    // Create OAuth user without password
    $user = User::factory()->create([
        'password' => null,
        'google_id' => 'google_123456',
    ]);

    $intendedUrl = route('two-factor.show');

    $response = $this
        ->actingAs($user)
        ->withSession(['intended_url' => $intendedUrl])
        ->from(route('user-password.edit'))
        ->put(route('user-password.update'), [
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect($intendedUrl);

    expect(Hash::check('new-password', $user->refresh()->password))->toBeTrue();
});

test('password update page shows correct props for oauth users', function () {
    // Create OAuth user without password
    $user = User::factory()->create([
        'password' => null,
        'google_id' => 'google_123456',
    ]);

    $response = $this
        ->actingAs($user)
        ->withSession(['needs_password_setup' => true])
        ->get(route('user-password.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/password')
        ->where('hasPassword', false)
        ->where('needsPasswordSetup', true)
    );
});

test('password update page shows correct props for users with password', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('user-password.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/password')
        ->where('hasPassword', true)
        ->where('needsPasswordSetup', false)
    );
});