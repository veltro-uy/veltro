<?php

use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;

test('profile page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
});

test('profile information can be updated', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Test User');
    expect($user->email)->toBe('test@example.com');
    expect($user->email_verified_at)->toBeNull();
});

test('email verification status is unchanged when the email address is unchanged', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => 'Test User',
            'email' => $user->email,
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($user->refresh()->email_verified_at)->not->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->delete(route('profile.destroy'), [
            'password' => 'password',
        ]);

    $response
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('home'));

    $this->assertGuest();
    expect($user->fresh())->toBeNull();
});

test('correct password must be provided to delete account', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'), [
            'password' => 'wrong-password',
        ]);

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});

test('oauth users without password cannot delete account', function () {
    // Create OAuth user without password
    $user = User::factory()->create([
        'password' => null,
        'google_id' => 'google_123456',
    ]);

    $response = $this
        ->actingAs($user)
        ->from(route('profile.edit'))
        ->delete(route('profile.destroy'));

    $response
        ->assertSessionHasErrors('password')
        ->assertRedirect(route('profile.edit'));

    expect($user->fresh())->not->toBeNull();
});

test('profile page shows correct hasPassword prop for oauth users', function () {
    // Create OAuth user without password
    $user = User::factory()->create([
        'password' => null,
        'google_id' => 'google_123456',
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/profile')
        ->where('hasPassword', false)
    );
});

test('profile page shows correct hasPassword prop for users with password', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('profile.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/profile')
        ->where('hasPassword', true)
    );
});

test('user can update bio', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'bio' => 'This is my new bio',
        ]);

    $response->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->bio)->toBe('This is my new bio');
});

test('user can update location', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'location' => 'Montevideo, Uruguay',
        ]);

    $response->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->location)->toBe('Montevideo, Uruguay');
});

test('user can update date of birth', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'date_of_birth' => '1990-01-01',
        ]);

    $response->assertSessionHasNoErrors();

    $user->refresh();
    expect($user->date_of_birth->format('Y-m-d'))->toBe('1990-01-01');
});

test('bio cannot exceed 500 characters', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'bio' => str_repeat('a', 501),
        ]);

    $response->assertSessionHasErrors('bio');
});

test('location cannot exceed 100 characters', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'location' => str_repeat('a', 101),
        ]);

    $response->assertSessionHasErrors('location');
});

test('date of birth must be in the past', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'date_of_birth' => now()->addDay()->format('Y-m-d'),
        ]);

    $response->assertSessionHasErrors('date_of_birth');
});

test('a grandfathered leader without a phone number can still update their profile', function () {
    $captain = User::factory()->withoutPhoneNumber()->create();
    $team = Team::create([
        'name' => 'Grandfathered FC',
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

    $this->actingAs($captain)
        ->patch(route('profile.update'), [
            'name' => 'Nuevo Nombre',
            'email' => $captain->email,
            'phone_number' => '',
            'bio' => 'Sigo siendo capitán',
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('profile.edit'));

    expect($captain->refresh()->name)->toBe('Nuevo Nombre');
});

test('a leader cannot clear their phone number', function () {
    $captain = User::factory()->create(['phone_number' => '099123456']);
    $team = Team::create([
        'name' => 'Reachable FC',
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

    $this->actingAs($captain)
        ->patch(route('profile.update'), [
            'name' => $captain->name,
            'email' => $captain->email,
            'phone_number' => '',
        ])
        ->assertSessionHasErrors('phone_number');

    expect($captain->refresh()->phone_number)->toBe('099123456');
});

test('a co_captain cannot clear their phone number', function () {
    $captain = User::factory()->create();
    $coCaptain = User::factory()->create(['phone_number' => '099555444']);
    $team = Team::create([
        'name' => 'Vice FC',
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
    TeamMember::create([
        'user_id' => $coCaptain->id,
        'team_id' => $team->id,
        'role' => 'co_captain',
        'status' => 'active',
    ]);

    $this->actingAs($coCaptain)
        ->patch(route('profile.update'), [
            'name' => $coCaptain->name,
            'email' => $coCaptain->email,
            'phone_number' => '',
        ])
        ->assertSessionHasErrors('phone_number');

    expect($coCaptain->refresh()->phone_number)->toBe('099555444');
});

test('a non-leader can clear their phone number', function () {
    $captain = User::factory()->create();
    $player = User::factory()->create(['phone_number' => '099777666']);
    $team = Team::create([
        'name' => 'Plain FC',
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
    TeamMember::create([
        'user_id' => $player->id,
        'team_id' => $team->id,
        'role' => 'player',
        'status' => 'active',
    ]);

    $this->actingAs($player)
        ->patch(route('profile.update'), [
            'name' => $player->name,
            'email' => $player->email,
            'phone_number' => '',
        ])
        ->assertSessionHasNoErrors();

    expect($player->refresh()->phone_number)->toBeNull();
});
