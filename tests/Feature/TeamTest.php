<?php

declare(strict_types=1);

use App\Models\JoinRequest;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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

test('team creation accepts a logo', function () {
    $disk = config('filesystems.default');
    Storage::fake($disk);

    $this->actingAs($this->outsider)
        ->post(route('teams.store'), [
            'name' => 'Crest FC',
            'variant' => 'football_7',
            'logo' => UploadedFile::fake()->image('crest.png', 600, 600),
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $team = Team::where('name', 'Crest FC')->first();
    expect($team->logo_path)->not->toBeNull();
    Storage::disk($disk)->assertExists($team->logo_path);
});

test('team creation rejects injection-looking names', function () {
    $this->actingAs($this->outsider)
        ->post(route('teams.store'), [
            'name' => "' OR '1'='1",
            'variant' => 'football_11',
        ])
        ->assertSessionHasErrors('name');
});

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
        ->get(route('teams.show', $this->team))
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
        ->assertRedirect(route('teams.show', $this->team));

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

test('captain can update team with a logo', function () {
    $disk = config('filesystems.default');
    Storage::fake($disk);

    $this->actingAs($this->captain)
        ->put(route('teams.update', $this->team->id), [
            'name' => 'Logo FC',
            'variant' => 'football_11',
            'logo' => UploadedFile::fake()->image('logo.png', 600, 600),
        ])
        ->assertRedirect(route('teams.show', $this->team));

    $this->team->refresh();
    expect($this->team->logo_path)->not->toBeNull();
    Storage::disk($disk)->assertExists($this->team->logo_path);
});

test('captain can remove team logo via update', function () {
    $disk = config('filesystems.default');
    Storage::fake($disk);

    // Seed an existing logo
    Storage::disk($disk)->put("logos/{$this->team->id}/old.png", 'fake');
    $this->team->update(['logo_path' => "logos/{$this->team->id}/old.png"]);

    $this->actingAs($this->captain)
        ->put(route('teams.update', $this->team->id), [
            'name' => 'No Logo FC',
            'variant' => 'football_11',
            'remove_logo' => '1',
        ])
        ->assertRedirect();

    $this->team->refresh();
    expect($this->team->logo_path)->toBeNull();
    Storage::disk($disk)->assertMissing("logos/{$this->team->id}/old.png");
});

test('team update rejects a non-image logo', function () {
    Storage::fake(config('filesystems.default'));

    $this->actingAs($this->captain)
        ->put(route('teams.update', $this->team->id), [
            'name' => 'Bad Logo FC',
            'variant' => 'football_11',
            'logo' => UploadedFile::fake()->create('document.pdf', 100, 'application/pdf'),
        ])
        ->assertSessionHasErrors('logo');
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

// ============================================================
// Discovery & Search Pagination
// ============================================================

test('discover teams are paginated', function () {
    // beforeEach already creates one discoverable team (Test Team)
    Team::factory()->count(15)->create();

    $this->actingAs($this->outsider)
        ->get(route('teams.index'))
        ->assertInertia(fn ($page) => $page
            ->component('teams/index')
            ->has('discoverTeams.data', 12)
            ->where('discoverTeams.total', 16)
            ->where('discoverTeams.last_page', 2)
        );
});

test('discover teams can be filtered by search server-side', function () {
    Team::factory()->create(['name' => 'Zalgiris Unique FC']);
    Team::factory()->count(5)->create();

    $this->actingAs($this->outsider)
        ->get(route('teams.index', ['search' => 'Zalgiris']))
        ->assertInertia(fn ($page) => $page
            ->component('teams/index')
            ->has('discoverTeams.data', 1)
            ->where('discoverTeams.total', 1)
            ->where('filters.search', 'Zalgiris')
        );
});

test('discover teams can be filtered by variant server-side', function () {
    Team::factory()->count(3)->create(['variant' => 'futsal']);
    Team::factory()->count(4)->create(['variant' => 'football_7']);

    $this->actingAs($this->outsider)
        ->get(route('teams.index', ['variant' => 'futsal']))
        ->assertInertia(fn ($page) => $page
            ->where('discoverTeams.total', 3)
            ->where('filters.variant', 'futsal')
        );
});

test('my teams are returned as a full array, not paginated', function () {
    $this->actingAs($this->captain)
        ->get(route('teams.index'))
        ->assertInertia(fn ($page) => $page
            ->component('teams/index')
            ->has('myTeams', 1)
            ->has('discoverTeams.data')
        );
});

test('team search results are paginated with filters preserved across pages', function () {
    for ($i = 0; $i < 15; $i++) {
        Team::factory()->create(['name' => "Searchclub {$i}"]);
    }

    // Page 1
    $this->actingAs($this->outsider)
        ->get(route('teams.search', ['name' => 'Searchclub']))
        ->assertInertia(fn ($page) => $page
            ->component('teams/search')
            ->has('teams.data', 12)
            ->where('teams.total', 15)
            ->where('teams.last_page', 2)
        );

    // Page 2 keeps the name filter applied
    $this->actingAs($this->outsider)
        ->get(route('teams.search', ['name' => 'Searchclub', 'page' => 2]))
        ->assertInertia(fn ($page) => $page
            ->has('teams.data', 3)
            ->where('teams.current_page', 2)
            ->where('filters.name', 'Searchclub')
        );
});

// ============================================================
// Phone number requirement for leadership roles
// ============================================================

test('user without a phone number cannot create a team', function () {
    $noPhone = User::factory()->withoutPhoneNumber()->create();

    $this->actingAs($noPhone)
        ->post(route('teams.store'), [
            'name' => 'Phoneless FC',
            'variant' => 'football_7',
        ])
        ->assertRedirect()
        ->assertSessionHas('error');

    $this->assertDatabaseMissing('teams', ['name' => 'Phoneless FC']);
    $this->assertDatabaseMissing('team_members', ['user_id' => $noPhone->id]);
});

test('user with a phone number can create a team', function () {
    $withPhone = User::factory()->create(['phone_number' => '099123456']);

    $this->actingAs($withPhone)
        ->post(route('teams.store'), [
            'name' => 'Reachable FC',
            'variant' => 'football_7',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $team = Team::where('name', 'Reachable FC')->first();

    expect($team)->not->toBeNull();
    $this->assertDatabaseHas('team_members', [
        'team_id' => $team->id,
        'user_id' => $withPhone->id,
        'role' => 'captain',
    ]);
});

test('captaincy cannot be transferred to a member without a phone number', function () {
    $this->player->update(['phone_number' => null]);

    $this->actingAs($this->captain)
        ->post(route('teams.transfer-captaincy', $this->team->id), [
            'new_captain_id' => $this->player->id,
        ])
        ->assertSessionHas('error');

    // Roster untouched: the outgoing captain still holds the role.
    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->captain->id,
        'role' => 'captain',
    ]);
    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'role' => 'player',
    ]);
});

test('captaincy can be transferred to a member with a phone number', function () {
    $this->player->update(['phone_number' => '099888777']);

    $this->actingAs($this->captain)
        ->post(route('teams.transfer-captaincy', $this->team->id), [
            'new_captain_id' => $this->player->id,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'role' => 'captain',
    ]);
    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->captain->id,
        'role' => 'player',
    ]);
});

test('member without a phone number cannot be promoted to co_captain', function () {
    $this->player->update(['phone_number' => null]);

    $this->actingAs($this->captain)
        ->put(route('teams.members.update-role', [$this->team->id, $this->player->id]), [
            'role' => 'co_captain',
        ])
        ->assertSessionHas('error');

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'role' => 'player',
    ]);
});

test('co_captain without a phone number can still be demoted to player', function () {
    $this->player->update(['phone_number' => null]);
    TeamMember::where('team_id', $this->team->id)
        ->where('user_id', $this->player->id)
        ->update(['role' => 'co_captain']);

    $this->actingAs($this->captain)
        ->put(route('teams.members.update-role', [$this->team->id, $this->player->id]), [
            'role' => 'player',
        ])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('team_members', [
        'team_id' => $this->team->id,
        'user_id' => $this->player->id,
        'role' => 'player',
    ]);
});

test('canLeadTeam reflects the presence of a phone number', function () {
    expect(User::factory()->create(['phone_number' => '099111222'])->canLeadTeam())->toBeTrue()
        ->and(User::factory()->withoutPhoneNumber()->create()->canLeadTeam())->toBeFalse();
});

test('leadsAnyTeam only counts captain and co_captain roles', function () {
    expect($this->captain->leadsAnyTeam())->toBeTrue()
        ->and($this->player->leadsAnyTeam())->toBeFalse()
        ->and($this->outsider->leadsAnyTeam())->toBeFalse();
});

test('team page does not expose member contact details to visitors', function () {
    $this->player->update([
        'phone_number' => '+598 99 123 456',
        'date_of_birth' => '1990-01-01',
    ]);

    // The team page is viewable by any authenticated user, member or not.
    $this->actingAs($this->outsider)
        ->get(route('teams.show', $this->team))
        ->assertOk()
        ->assertInertia(function ($page) {
            $members = collect($page->toArray()['props']['team']['team_members']);

            expect($members)->not->toBeEmpty();

            $members->each(function (array $member) {
                expect($member['user'])
                    ->not->toHaveKey('email')
                    ->not->toHaveKey('phone_number')
                    ->not->toHaveKey('date_of_birth')
                    // The roster UI gets a boolean instead.
                    ->toHaveKey('has_phone_number');
            });
        });
});

test('team page does not expose pending join requests to non-leaders', function () {
    JoinRequest::create([
        'team_id' => $this->team->id,
        'user_id' => $this->outsider->id,
        'message' => 'Private application message',
        'status' => 'pending',
    ]);

    $this->actingAs($this->player)
        ->get(route('teams.show', $this->team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->missing('team.pending_join_requests'));
});

test('a leader still sees their own phone number in shared auth props', function () {
    $this->actingAs($this->captain)
        ->get(route('teams.show', $this->team))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('auth.user.phone_number', $this->captain->phone_number));
});
