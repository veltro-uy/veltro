<?php

declare(strict_types=1);

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->captain = User::factory()->create();
    $this->player = User::factory()->create();
    $this->outsider = User::factory()->create();

    $this->team = Team::create([
        'name' => 'Test Team',
        'variant' => 'football_11',
        'created_by' => $this->captain->id,
        'max_members' => 25,
    ]);

    TeamMember::create([
        'user_id' => $this->captain->id,
        'team_id' => $this->team->id,
        'role' => 'captain',
        'status' => 'active',
    ]);

    TeamMember::create([
        'user_id' => $this->player->id,
        'team_id' => $this->team->id,
        'role' => 'player',
        'status' => 'active',
    ]);
});

function makeInvitation(array $overrides = []): TeamInvitation
{
    return TeamInvitation::create(array_merge([
        'team_id' => test()->team->id,
        'invited_by' => test()->captain->id,
        'email' => 'invitee@example.com',
        'token' => TeamInvitation::generateToken(),
        'role' => 'player',
        'status' => 'pending',
        'expires_at' => now()->addDays(7),
    ], $overrides));
}

// ============================================================
// Show page exposes pendingInvitations
// ============================================================

test('captain sees pending invitations on team show page', function () {
    $invitation = makeInvitation();

    $this->actingAs($this->captain)
        ->get(route('teams.show', $this->team->id))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->component('teams/show')
            ->where('canManage', true)
            ->has('pendingInvitations', 1)
            ->where('pendingInvitations.0.id', $invitation->id)
            ->where('pendingInvitations.0.status', 'pending')
        );
});

test('co-captain sees pending invitations on team show page', function () {
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);
    makeInvitation();

    $this->actingAs($this->player)
        ->get(route('teams.show', $this->team->id))
        ->assertInertia(fn ($page) => $page
            ->where('canManage', true)
            ->has('pendingInvitations', 1)
        );
});

test('regular player does not see pending invitations', function () {
    makeInvitation();

    $this->actingAs($this->player)
        ->get(route('teams.show', $this->team->id))
        ->assertInertia(fn ($page) => $page
            ->where('canManage', false)
            ->has('pendingInvitations', 0)
        );
});

test('non-member does not see pending invitations', function () {
    makeInvitation();

    $this->actingAs($this->outsider)
        ->get(route('teams.show', $this->team->id))
        ->assertInertia(fn ($page) => $page
            ->where('canManage', false)
            ->has('pendingInvitations', 0)
        );
});

test('show page surfaces pending, expired, and revoked invitations to leaders', function () {
    makeInvitation(['status' => 'pending']);
    makeInvitation(['status' => 'revoked']);
    makeInvitation(['status' => 'expired', 'expires_at' => now()->subDay()]);
    makeInvitation(['status' => 'accepted', 'accepted_at' => now()]);

    $this->actingAs($this->captain)
        ->get(route('teams.show', $this->team->id))
        ->assertInertia(fn ($page) => $page
            ->has('pendingInvitations', 3)
        );
});

test('expired pending invitations are auto-marked when leader views the page', function () {
    $invitation = makeInvitation(['expires_at' => now()->subDay()]);

    expect($invitation->status)->toBe('pending');

    $this->actingAs($this->captain)
        ->get(route('teams.show', $this->team->id));

    expect($invitation->fresh()->status)->toBe('expired');
});

// ============================================================
// Revoke flow
// ============================================================

test('captain can revoke a pending invitation', function () {
    $invitation = makeInvitation();

    $this->actingAs($this->captain)
        ->post(route('team-invitations.revoke', $invitation->id))
        ->assertRedirect();

    expect($invitation->fresh()->status)->toBe('revoked');
});

test('co-captain can revoke a pending invitation', function () {
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);
    $invitation = makeInvitation();

    $this->actingAs($this->player)
        ->post(route('team-invitations.revoke', $invitation->id))
        ->assertRedirect();

    expect($invitation->fresh()->status)->toBe('revoked');
});

test('regular player cannot revoke an invitation', function () {
    $invitation = makeInvitation();

    $this->actingAs($this->player)
        ->post(route('team-invitations.revoke', $invitation->id))
        ->assertForbidden();

    expect($invitation->fresh()->status)->toBe('pending');
});

test('non-member cannot revoke an invitation', function () {
    $invitation = makeInvitation();

    $this->actingAs($this->outsider)
        ->post(route('team-invitations.revoke', $invitation->id))
        ->assertForbidden();

    expect($invitation->fresh()->status)->toBe('pending');
});
