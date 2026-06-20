<?php

declare(strict_types=1);

namespace App\Services\Tournament;

use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Models\User;
use App\Notifications\TournamentRegistrationReviewedNotification;
use Illuminate\Support\Facades\Notification;

final class TournamentRegistrationService
{
    public function registerTeam(Tournament $tournament, Team $team, User $user): TournamentTeam
    {
        if (! $tournament->isRegistrationOpen()) {
            if ($tournament->registration_deadline && now()->isAfter($tournament->registration_deadline)) {
                throw new \RuntimeException('Registration deadline has passed');
            }

            throw new \RuntimeException('Tournament is not accepting registrations');
        }

        if (! $tournament->hasSpaceForTeams()) {
            throw new \RuntimeException('Tournament is full');
        }

        $existing = $tournament->tournamentTeams()
            ->where('team_id', $team->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existing) {
            throw new \RuntimeException('Team is already registered for this tournament');
        }

        if ($tournament->variant !== $team->variant) {
            throw new \InvalidArgumentException('Team variant must match tournament variant');
        }

        $previousRegistration = $tournament->tournamentTeams()
            ->where('team_id', $team->id)
            ->whereIn('status', ['rejected', 'withdrawn'])
            ->first();

        $status = $tournament->visibility === 'public' ? 'approved' : 'pending';
        $approvedAt = $tournament->visibility === 'public' ? now() : null;

        if ($previousRegistration) {
            $previousRegistration->update([
                'status' => $status,
                'registered_by' => $user->id,
                'registered_at' => now(),
                'approved_at' => $approvedAt,
            ]);

            return $previousRegistration;
        }

        return TournamentTeam::create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => $status,
            'registered_by' => $user->id,
            'registered_at' => now(),
            'approved_at' => $approvedAt,
        ]);
    }

    public function approveTeam(TournamentTeam $registration): void
    {
        if ($registration->isApproved()) {
            throw new \RuntimeException('Registration is already approved');
        }

        if (! $registration->tournament->hasSpaceForTeams()) {
            throw new \RuntimeException('Tournament is full');
        }

        $registration->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        $this->notifyRegistrationReviewed($registration, true);
    }

    public function rejectTeam(TournamentTeam $registration): void
    {
        if ($registration->isRejected()) {
            throw new \RuntimeException('Registration is already rejected');
        }

        $registration->update([
            'status' => 'rejected',
        ]);

        $this->notifyRegistrationReviewed($registration, false);
    }

    /**
     * Notify the registering team's leaders of the review decision.
     */
    private function notifyRegistrationReviewed(TournamentTeam $registration, bool $approved): void
    {
        $leaders = $registration->team->getLeaders()->get()->pluck('user');
        Notification::send(
            $leaders,
            new TournamentRegistrationReviewedNotification($registration, $approved)
        );
    }

    public function withdrawTeam(TournamentTeam $registration): void
    {
        if ($registration->tournament->isInProgress() || $registration->tournament->isCompleted()) {
            throw new \RuntimeException('Cannot withdraw from a tournament that has started or completed');
        }

        $registration->update([
            'status' => 'withdrawn',
        ]);
    }
}
