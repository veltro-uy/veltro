<?php

declare(strict_types=1);

use App\Models\Team;
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
        'description' => 'A test team',
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

// ============================================================
// Team CRUD
// ============================================================

test('authenticated user can view teams index', function () {
    $this->actingAs($this->captain)
        ->get(route('teams.index'))
        ->assertSuccessful();
});

test('authenticated user can view create team form', function () {
    $this->actingAs($this->captain)
        ->get(route('teams.create'))
        ->assertSuccessful();
});

test('authenticated user can create a team', function () {
    $this->actingAs($this->outsider)
        ->post(route('teams.store'), [
            'name' => 'New FC',
            'variant' => 'football_7',
            'description' => 'A brand new team',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('teams', [
        'name' => 'New FC',
        'variant' => 'football_7',
        'created_by' => $this->outsider->id,
    ]);

    $team = Team::where('name', 'New FC')->first();
    $this->assertDatabaseHas('team_members', [
        'team_id' => $team->id,
        'user_id' => $this->outsider->id,
        'role' => 'captain',
        'status' => 'active',
    ]);
});

test('team creation requires a name', function () {
    $this->actingAs($this->outsider)
        ->post(route('teams.store'), [
            'variant' => 'football_11',
        ])
        ->assertSessionHasErrors('name');
});

test('team creation requires a valid variant', function () {
    $this->actingAs($this->outsider)
        ->post(route('teams.store'), [
            'name' => 'Bad FC',
            'variant' => 'cricket',
        ])
        ->assertSessionHasErrors('variant');
});

test('team creation accepts all valid variants', function (string $variant) {
    $this->actingAs($this->outsider)
        ->post(route('teams.store'), [
            'name' => 'Variant FC '.$variant,
            'variant' => $variant,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('teams', ['variant' => $variant]);
})->with(['football_11', 'football_7', 'football_5', 'futsal']);

test('team description cannot exceed 1000 characters', function () {
    $this->actingAs($this->outsider)
        ->post(route('teams.store'), [
            'name' => 'Long FC',
            'variant' => 'football_11',
            'description' => str_repeat('a', 1001),
        ])
        ->assertSessionHasErrors('description');
});

test('authenticated user can view a team', function () {
    $this->actingAs($this->captain)
        ->get(route('teams.show', $this->team->id))
        ->assertSuccessful();
});

test('viewing nonexistent team returns 404', function () {
    $this->actingAs($this->captain)
        ->get(route('teams.show', 99999))
        ->assertNotFound();
});

test('captain can update team', function () {
    $this->actingAs($this->captain)
        ->put(route('teams.update', $this->team->id), [
            'name' => 'Updated FC',
            'variant' => 'football_11',
            'description' => 'Updated description',
        ])
        ->assertRedirect(route('teams.show', $this->team->id));

    $this->assertDatabaseHas('teams', [
        'id' => $this->team->id,
        'name' => 'Updated FC',
    ]);
});

test('co-captain can update team', function () {
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);

    $this->actingAs($this->player)
        ->put(route('teams.update', $this->team->id), [
            'name' => 'Co-Captain Update',
            'variant' => 'football_11',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('teams', [
        'id' => $this->team->id,
        'name' => 'Co-Captain Update',
    ]);
});

test('regular player cannot update team', function () {
    $this->actingAs($this->player)
        ->put(route('teams.update', $this->team->id), [
            'name' => 'Hacked FC',
            'variant' => 'football_11',
        ])
        ->assertForbidden();
});

test('non-member cannot update team', function () {
    $this->actingAs($this->outsider)
        ->put(route('teams.update', $this->team->id), [
            'name' => 'Hacked FC',
            'variant' => 'football_11',
        ])
        ->assertForbidden();
});

test('captain can delete team', function () {
    $this->actingAs($this->captain)
        ->delete(route('teams.destroy', $this->team->id))
        ->assertRedirect(route('teams.index'));

    $this->assertDatabaseMissing('teams', ['id' => $this->team->id]);
});

test('co-captain cannot delete team', function () {
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);

    $this->actingAs($this->player)
        ->delete(route('teams.destroy', $this->team->id))
        ->assertForbidden();

    $this->assertDatabaseHas('teams', ['id' => $this->team->id]);
});

test('regular player cannot delete team', function () {
    $this->actingAs($this->player)
        ->delete(route('teams.destroy', $this->team->id))
        ->assertForbidden();
});

test('authenticated user can search teams', function () {
    $this->actingAs($this->outsider)
        ->get(route('teams.search', ['name' => 'Test']))
        ->assertSuccessful();
});

test('guest cannot access teams index', function () {
    $this->get(route('teams.index'))
        ->assertRedirect(route('login'));
});

// ============================================================
// Member Management
// ============================================================

test('player can leave team', function () {
    $this->actingAs($this->player)
        ->post(route('teams.leave', $this->team->id))
        ->assertRedirect(route('teams.index'));

    $this->assertDatabaseMissing('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
    ]);
});

test('captain cannot leave team', function () {
    $this->actingAs($this->captain)
        ->post(route('teams.leave', $this->team->id))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->captain->id,
        'role' => 'captain',
    ]);
});

test('non-member cannot leave team', function () {
    $this->actingAs($this->outsider)
        ->post(route('teams.leave', $this->team->id))
        ->assertSessionHas('error');
});

test('leader can remove a player from team', function () {
    $this->actingAs($this->captain)
        ->delete(route('teams.members.remove', [$this->team->id, $this->player->id]))
        ->assertRedirect();

    $this->assertDatabaseMissing('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
    ]);
});

test('leader cannot remove the captain', function () {
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);

    $this->actingAs($this->player)
        ->delete(route('teams.members.remove', [$this->team->id, $this->captain->id]))
        ->assertSessionHas('error');

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->captain->id,
        'role' => 'captain',
    ]);
});

test('regular player cannot remove members', function () {
    $other = User::factory()->create();
    TeamMember::create([
        'user_id' => $other->id,
        'team_id' => $this->team->id,
        'role' => 'player',
        'status' => 'active',
    ]);

    $this->actingAs($this->player)
        ->delete(route('teams.members.remove', [$this->team->id, $other->id]))
        ->assertForbidden();
});

test('captain can update member role to co_captain', function () {
    $this->actingAs($this->captain)
        ->put(route('teams.members.update-role', [$this->team->id, $this->player->id]), [
            'role' => 'co_captain',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'role' => 'co_captain',
    ]);
});

test('captain can demote co_captain to player', function () {
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);

    $this->actingAs($this->captain)
        ->put(route('teams.members.update-role', [$this->team->id, $this->player->id]), [
            'role' => 'player',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'role' => 'player',
    ]);
});

test('role update rejects invalid role values', function () {
    $this->actingAs($this->captain)
        ->put(route('teams.members.update-role', [$this->team->id, $this->player->id]), [
            'role' => 'captain',
        ])
        ->assertSessionHasErrors('role');
});

test('co-captain cannot update member roles', function () {
    $other = User::factory()->create();
    TeamMember::create([
        'user_id' => $other->id,
        'team_id' => $this->team->id,
        'role' => 'player',
        'status' => 'active',
    ]);
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);

    $this->actingAs($this->player)
        ->put(route('teams.members.update-role', [$this->team->id, $other->id]), [
            'role' => 'co_captain',
        ])
        ->assertForbidden();
});

test('leader can update member position', function () {
    $this->actingAs($this->captain)
        ->put(route('teams.members.update-position', [$this->team->id, $this->player->id]), [
            'position' => 'goalkeeper',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'position' => 'goalkeeper',
    ]);
});

test('leader can clear member position to null', function () {
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['position' => 'goalkeeper']);

    $this->actingAs($this->captain)
        ->put(route('teams.members.update-position', [$this->team->id, $this->player->id]), [
            'position' => null,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'position' => null,
    ]);
});

test('position update rejects invalid position', function () {
    $this->actingAs($this->captain)
        ->put(route('teams.members.update-position', [$this->team->id, $this->player->id]), [
            'position' => 'striker',
        ])
        ->assertSessionHasErrors('position');
});

test('regular player cannot update positions', function () {
    $this->actingAs($this->player)
        ->put(route('teams.members.update-position', [$this->team->id, $this->captain->id]), [
            'position' => 'forward',
        ])
        ->assertForbidden();
});

test('captain can transfer captaincy to a member', function () {
    $this->actingAs($this->captain)
        ->post(route('teams.transfer-captaincy', $this->team->id), [
            'new_captain_id' => $this->player->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->captain->id,
        'role' => 'player',
    ]);
    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'role' => 'captain',
    ]);
});

test('captain cannot transfer captaincy to non-member', function () {
    $this->actingAs($this->captain)
        ->post(route('teams.transfer-captaincy', $this->team->id), [
            'new_captain_id' => $this->outsider->id,
        ])
        ->assertSessionHas('error');

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->captain->id,
        'role' => 'captain',
    ]);
});

test('co-captain cannot transfer captaincy', function () {
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);

    $this->actingAs($this->player)
        ->post(route('teams.transfer-captaincy', $this->team->id), [
            'new_captain_id' => $this->player->id,
        ])
        ->assertForbidden();
});

test('transfer captaincy requires valid user id', function () {
    $this->actingAs($this->captain)
        ->post(route('teams.transfer-captaincy', $this->team->id), [
            'new_captain_id' => 99999,
        ])
        ->assertSessionHasErrors('new_captain_id');
});
