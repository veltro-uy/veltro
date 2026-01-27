<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\JoinRequest;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

final class TeamService
{
    /**
     * Create a new team.
     */
    public function createTeam(User $user, array $data): Team
    {
        return DB::transaction(function () use ($user, $data) {
            // Set default max_members based on variant if not provided
            if (! isset($data['max_members'])) {
                $data['max_members'] = match ($data['variant']) {
                    'football_11' => 25,
                    'football_7' => 15,
                    'football_5' => 10,
                    'futsal' => 12,
                    default => 25,
                };
            }

            $team = Team::create([
                ...$data,
                'created_by' => $user->id,
            ]);

            // Add creator as captain
            TeamMember::create([
                'user_id' => $user->id,
                'team_id' => $team->id,
                'role' => 'captain',
                'status' => 'active',
            ]);

            return $team->load(['teamMembers.user', 'creator']);
        });
    }

    /**
     * Update team information.
     */
    public function updateTeam(Team $team, array $data): Team
    {
        $team->update($data);

        return $team->load(['teamMembers.user', 'creator']);
    }

    /**
     * Delete a team.
     */
    public function deleteTeam(Team $team): bool
    {
        return DB::transaction(function () use ($team) {
            // Delete all team members
            $team->teamMembers()->delete();

            // Delete all join requests
            $team->joinRequests()->delete();

            // Delete the team
            return $team->delete();
        });
    }

    /**
     * Add a member to the team.
     */
    public function addMember(Team $team, int $userId, string $role = 'player'): TeamMember
    {
        return TeamMember::create([
            'user_id' => $userId,
            'team_id' => $team->id,
            'role' => $role,
            'status' => 'active',
        ]);
    }

    /**
     * Remove a member from the team.
     */
    public function removeMember(Team $team, int $userId): bool
    {
        return $team->teamMembers()
            ->where('user_id', $userId)
            ->delete() > 0;
    }

    /**
     * Update member role.
     */
    public function updateMemberRole(Team $team, int $userId, string $role): ?TeamMember
    {
        $member = $team->teamMembers()
            ->where('user_id', $userId)
            ->first();

        if ($member) {
            $member->update(['role' => $role]);

            return $member->fresh();
        }

        return null;
    }

    /**
     * Update member position.
     */
    public function updateMemberPosition(Team $team, int $userId, ?string $position): ?TeamMember
    {
        $member = $team->teamMembers()
            ->where('user_id', $userId)
            ->first();

        if ($member) {
            $member->update(['position' => $position]);

            return $member->fresh();
        }

        return null;
    }

    /**
     * Transfer team captaincy.
     */
    public function transferCaptaincy(Team $team, int $currentCaptainId, int $newCaptainId): bool
    {
        return DB::transaction(function () use ($team, $currentCaptainId, $newCaptainId) {
            // Demote current captain to player
            $team->teamMembers()
                ->where('user_id', $currentCaptainId)
                ->update(['role' => 'player']);

            // Promote new captain
            $team->teamMembers()
                ->where('user_id', $newCaptainId)
                ->update(['role' => 'captain']);

            return true;
        });
    }

    /**
     * Create a join request.
     */
    public function createJoinRequest(int $userId, int $teamId, ?string $message = null): JoinRequest
    {
        $team = Team::findOrFail($teamId);

        // Check if team is full
        if ($team->isFull()) {
            throw new \Exception('This team is currently at maximum capacity');
        }

        // Clean up old accepted/rejected join requests for this user/team before creating a new one
        JoinRequest::where('user_id', $userId)
            ->where('team_id', $teamId)
            ->whereIn('status', ['accepted', 'rejected'])
            ->delete();

        return JoinRequest::create([
            'user_id' => $userId,
            'team_id' => $teamId,
            'status' => 'pending',
            'message' => $message,
        ]);
    }

    /**
     * Accept a join request.
     */
    public function acceptJoinRequest(JoinRequest $joinRequest, int $reviewerId): TeamMember
    {
        return DB::transaction(function () use ($joinRequest, $reviewerId) {
            // Check if team is full
            if ($joinRequest->team->isFull()) {
                throw new \Exception('Team is at maximum capacity');
            }

            // Update join request
            $joinRequest->update([
                'status' => 'accepted',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
            ]);

            // Add user as team member
            return $this->addMember(
                $joinRequest->team,
                $joinRequest->user_id,
                'player'
            );
        });
    }

    /**
     * Reject a join request.
     */
    public function rejectJoinRequest(JoinRequest $joinRequest, int $reviewerId): JoinRequest
    {
        return DB::transaction(function () use ($joinRequest, $reviewerId) {
            $joinRequest->update([
                'status' => 'rejected',
                'reviewed_by' => $reviewerId,
                'reviewed_at' => now(),
            ]);

            return $joinRequest->fresh();
        });
    }

    /**
     * Get user's teams.
     */
    public function getUserTeams(int $userId): Collection
    {
        return Team::whereHas('teamMembers', function ($query) use ($userId) {
            $query->where('user_id', $userId)
                ->where('status', 'active');
        })
            ->with(['teamMembers.user', 'creator'])
            ->get();
    }

    /**
     * Get teams that the user is not part of.
     */
    public function getTeamsNotJoined(int $userId): Collection
    {
        return Team::whereDoesntHave('teamMembers', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })
            ->with(['teamMembers.user', 'creator'])
            ->latest()
            ->get();
    }

    /**
     * Search teams.
     */
    public function searchTeams(array $filters): Collection
    {
        $query = Team::query()->with(['teamMembers.user', 'creator']);

        if (! empty($filters['name'])) {
            $query->where('name', 'like', '%'.$filters['name'].'%');
        }

        if (! empty($filters['variant'])) {
            $query->where('variant', $filters['variant']);
        }

        return $query->get();
    }

    /**
     * Get team with full details.
     */
    public function getTeamWithDetails(int $teamId): ?Team
    {
        return Team::with([
            'teamMembers.user',
            'creator',
            'pendingJoinRequests.user',
        ])->find($teamId);
    }

    /**
     * Check if user can manage team.
     */
    public function canManageTeam(Team $team, int $userId): bool
    {
        return $team->isLeader($userId);
    }

    /**
     * Get pending join requests for teams managed by user.
     */
    public function getPendingJoinRequestsForUser(int $userId): Collection
    {
        return JoinRequest::whereHas('team', function ($query) use ($userId) {
            $query->whereHas('teamMembers', function ($q) use ($userId) {
                $q->where('user_id', $userId)
                    ->whereIn('role', ['captain', 'co_captain'])
                    ->where('status', 'active');
            });
        })
            ->where('status', 'pending')
            ->with(['user', 'team'])
            ->get();
    }
}
