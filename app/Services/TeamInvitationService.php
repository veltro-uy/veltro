<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\TeamInvitation;
use App\Models\TeamMember;
use App\Models\User;
use App\Notifications\TeamInvitationAcceptedNotification;
use Illuminate\Support\Facades\DB;

final class TeamInvitationService
{
    /**
     * Accept a team invitation for the given user.
     *
     * Idempotent: if the user is already a member the invitation is left
     * untouched and the call succeeds. Returns false only when the team is
     * full and the user could not be added.
     */
    public function acceptInvitation(TeamInvitation $invitation, User $user): bool
    {
        // Already a member: nothing to do, treat as success.
        $isMember = $invitation->team->teamMembers()
            ->where('user_id', $user->id)
            ->exists();

        if ($isMember) {
            return true;
        }

        // Respect team capacity.
        if ($invitation->team->isFull()) {
            return false;
        }

        DB::transaction(function () use ($invitation, $user) {
            TeamMember::create([
                'team_id' => $invitation->team_id,
                'user_id' => $user->id,
                'role' => $invitation->role,
                'status' => 'active',
            ]);

            $invitation->update([
                'status' => 'accepted',
                'accepted_by' => $user->id,
                'accepted_at' => now(),
            ]);
        });

        // Notify the inviter that their invitation was accepted
        $inviter = $invitation->inviter;
        if ($inviter) {
            $inviter->notify(new TeamInvitationAcceptedNotification($invitation, $user));
        }

        return true;
    }
}
