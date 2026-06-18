<?php

declare(strict_types=1);

use App\Models\FootballMatch;
use App\Models\MatchRequest;
use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\TeamMember;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use App\Notifications\CaptaincyTransferredNotification;
use App\Notifications\JoinRequestCreatedNotification;
use App\Notifications\MatchConfirmedNotification;
use App\Notifications\MatchRequestAcceptedNotification;
use App\Notifications\TeamInvitationAcceptedNotification;
use App\Notifications\TournamentRegistrationReviewedNotification;
use App\Services\MatchService;
use App\Services\TeamInvitationService;
use App\Services\TeamService;
use App\Services\Tournament\TournamentRegistrationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

/**
 * Create a team with the given user as active captain.
 */
function teamWithCaptain(User $captain): Team
{
    $team = Team::factory()->create(['created_by' => $captain->id]);

    TeamMember::create([
        'user_id' => $captain->id,
        'team_id' => $team->id,
        'role' => 'captain',
        'status' => 'active',
    ]);

    return $team;
}

// ============================================================
// 1. Join request created -> team leaders
// ============================================================

test('creating a join request notifies team leaders, not the requester', function () {
    Notification::fake();

    $captain = User::factory()->create();
    $team = teamWithCaptain($captain);
    $requester = User::factory()->create();

    app(TeamService::class)->createJoinRequest($requester->id, $team->id);

    Notification::assertSentTo($captain, JoinRequestCreatedNotification::class);
    Notification::assertNotSentTo($requester, JoinRequestCreatedNotification::class);
});

// ============================================================
// 2. Captaincy transferred -> new captain
// ============================================================

test('transferring captaincy notifies the new captain', function () {
    Notification::fake();

    $captain = User::factory()->create();
    $team = teamWithCaptain($captain);
    $player = User::factory()->create();

    TeamMember::create([
        'user_id' => $player->id,
        'team_id' => $team->id,
        'role' => 'player',
        'status' => 'active',
    ]);

    app(TeamService::class)->transferCaptaincy($team, $captain->id, $player->id);

    Notification::assertSentTo($player, CaptaincyTransferredNotification::class);
});

// ============================================================
// 3. Team invitation accepted -> inviter
// ============================================================

test('accepting an invitation notifies the inviter', function () {
    Notification::fake();

    $captain = User::factory()->create();
    $team = teamWithCaptain($captain);
    $invitee = User::factory()->create();

    $invitation = TeamInvitation::create([
        'team_id' => $team->id,
        'invited_by' => $captain->id,
        'email' => $invitee->email,
        'token' => TeamInvitation::generateToken(),
        'role' => 'player',
        'status' => 'pending',
        'expires_at' => now()->addDays(7),
    ]);

    app(TeamInvitationService::class)->acceptInvitation($invitation, $invitee);

    Notification::assertSentTo($captain, TeamInvitationAcceptedNotification::class);
});

test('accepting an invitation when already a member notifies no one', function () {
    Notification::fake();

    $captain = User::factory()->create();
    $team = teamWithCaptain($captain);
    $invitee = User::factory()->create();

    TeamMember::create([
        'user_id' => $invitee->id,
        'team_id' => $team->id,
        'role' => 'player',
        'status' => 'active',
    ]);

    $invitation = TeamInvitation::create([
        'team_id' => $team->id,
        'invited_by' => $captain->id,
        'email' => $invitee->email,
        'token' => TeamInvitation::generateToken(),
        'role' => 'player',
        'status' => 'pending',
        'expires_at' => now()->addDays(7),
    ]);

    app(TeamInvitationService::class)->acceptInvitation($invitation, $invitee);

    Notification::assertNotSentTo($captain, TeamInvitationAcceptedNotification::class);
});

// ============================================================
// 4. Match confirmed -> home team leaders (away team gets accepted)
// ============================================================

test('accepting a match request confirms the match for the home team', function () {
    Notification::fake();

    $homeCaptain = User::factory()->create();
    $awayCaptain = User::factory()->create();
    $homeTeam = teamWithCaptain($homeCaptain);
    $awayTeam = teamWithCaptain($awayCaptain);

    $match = FootballMatch::factory()->create([
        'home_team_id' => $homeTeam->id,
        'away_team_id' => null,
        'status' => 'available',
        'created_by' => $homeCaptain->id,
    ]);

    $request = MatchRequest::create([
        'match_id' => $match->id,
        'requesting_team_id' => $awayTeam->id,
        'status' => 'pending',
    ]);

    app(MatchService::class)->acceptMatchRequest($request, $homeCaptain->id);

    Notification::assertSentTo($homeCaptain, MatchConfirmedNotification::class);
    Notification::assertSentTo($awayCaptain, MatchRequestAcceptedNotification::class);
});

// ============================================================
// 5. Tournament registration reviewed -> registering team leaders
// ============================================================

test('approving a tournament registration notifies the team leaders', function () {
    Notification::fake();

    $captain = User::factory()->create();
    $team = teamWithCaptain($captain);
    $tournament = Tournament::factory()->create();

    $registration = TournamentTeam::factory()->create([
        'tournament_id' => $tournament->id,
        'team_id' => $team->id,
        'status' => 'pending',
    ]);

    app(TournamentRegistrationService::class)->approveTeam($registration);

    Notification::assertSentTo(
        $captain,
        TournamentRegistrationReviewedNotification::class,
        fn ($notification) => $notification->approved === true
    );
});

test('rejecting a tournament registration notifies the team leaders', function () {
    Notification::fake();

    $captain = User::factory()->create();
    $team = teamWithCaptain($captain);
    $tournament = Tournament::factory()->create();

    $registration = TournamentTeam::factory()->create([
        'tournament_id' => $tournament->id,
        'team_id' => $team->id,
        'status' => 'pending',
    ]);

    app(TournamentRegistrationService::class)->rejectTeam($registration);

    Notification::assertSentTo(
        $captain,
        TournamentRegistrationReviewedNotification::class,
        fn ($notification) => $notification->approved === false
    );
});
