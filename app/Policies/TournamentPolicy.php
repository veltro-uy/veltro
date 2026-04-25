<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Team;
use App\Models\Tournament;
use App\Models\User;

final class TournamentPolicy
{
    /**
     * Determine whether the user can view any tournaments.
     */
    public function viewAny(?User $user): bool
    {
        // Anyone can view public tournaments
        return true;
    }

    /**
     * Determine whether the user can view the tournament.
     */
    public function view(?User $user, Tournament $tournament): bool
    {
        // Public tournaments can be viewed by anyone
        if ($tournament->visibility === 'public') {
            return true;
        }

        // For invite-only tournaments, user must be authenticated
        if (! $user) {
            return false;
        }

        // Organizer can always view
        if ($tournament->isOrganizer($user->id)) {
            return true;
        }

        // Check if user's team is registered
        $userTeamIds = $user->teams()->pluck('teams.id')->toArray();
        $isRegistered = $tournament->tournamentTeams()
            ->whereIn('team_id', $userTeamIds)
            ->exists();

        return $isRegistered;
    }

    /**
     * Determine whether the user can create tournaments.
     */
    public function create(User $user): bool
    {
        // The 'verified' middleware already ensures email is verified
        // Any authenticated and verified user can create tournaments
        return true;
    }

    /**
     * Determine whether the user can update the tournament.
     */
    public function update(User $user, Tournament $tournament): bool
    {
        // Policy only checks if user is the organizer
        // Business logic (status checks) handled in service layer
        return $tournament->isOrganizer($user->id);
    }

    /**
     * Determine whether the user can delete the tournament.
     */
    public function delete(User $user, Tournament $tournament): bool
    {
        // Policy only checks if user is the organizer
        // Business logic (draft status, no registrations) handled in service layer
        return $tournament->isOrganizer($user->id);
    }

    /**
     * Determine whether the user can start the tournament.
     */
    public function start(User $user, Tournament $tournament): bool
    {
        // Only organizer can start, and tournament must be in correct status
        // Business logic validation (power of 2, min teams) is handled in service
        return $tournament->isOrganizer($user->id)
            && ($tournament->status === 'registration_open' || $tournament->status === 'draft');
    }

    /**
     * Determine whether the user can cancel the tournament.
     */
    public function cancel(User $user, Tournament $tournament): bool
    {
        // Only organizer can cancel
        if (! $tournament->isOrganizer($user->id)) {
            return false;
        }

        // Cannot cancel completed tournaments
        return ! $tournament->isCompleted();
    }

    /**
     * Determine whether the user can schedule (set date/time/location for) tournament matches.
     */
    public function scheduleMatches(User $user, Tournament $tournament): bool
    {
        return $tournament->isOrganizer($user->id)
            && ! in_array($tournament->status, ['completed', 'cancelled'], true);
    }

    /**
     * Determine whether the user can register a team for the tournament.
     */
    public function register(User $user, Tournament $tournament, Team $team): bool
    {
        // Policy only checks if user HAS PERMISSION (is team leader)
        // Business logic (deadline, duplicate, full) is handled in service layer
        return $team->isLeader($user->id);
    }

    /**
     * Determine whether the user can approve team registrations.
     */
    public function approveTeam(User $user, Tournament $tournament): bool
    {
        // Only organizer can approve teams
        return $tournament->isOrganizer($user->id);
    }

    /**
     * Determine whether the user can reject team registrations.
     */
    public function rejectTeam(User $user, Tournament $tournament): bool
    {
        // Only organizer can reject teams
        return $tournament->isOrganizer($user->id);
    }
}
