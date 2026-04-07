<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentRound;
use App\Models\TournamentTeam;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class TournamentService
{
    /**
     * Create a new tournament.
     */
    public function createTournament(User $user, array $data): Tournament
    {
        // Validate max_teams is power of 2
        $maxTeams = (int) ($data['max_teams'] ?? 8);
        if (! $this->isPowerOfTwo($maxTeams)) {
            throw new \InvalidArgumentException('Max teams must be a power of 2 (4, 8, 16, 32, 64)');
        }

        $tournament = Tournament::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'logo_path' => $data['logo_path'] ?? null,
            'organizer_id' => $user->id,
            'visibility' => $data['visibility'] ?? 'public',
            'status' => $data['status'] ?? 'draft',
            'variant' => $data['variant'],
            'max_teams' => $maxTeams,
            'min_teams' => $data['min_teams'] ?? 4,
            'registration_deadline' => $data['registration_deadline'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        return $tournament;
    }

    /**
     * Update an existing tournament.
     */
    public function updateTournament(Tournament $tournament, array $data): Tournament
    {
        if (! $tournament->canBeEdited()) {
            throw new \RuntimeException('Tournament cannot be edited in its current status');
        }

        // Validate max_teams is power of 2 if being changed
        if (isset($data['max_teams'])) {
            if (! $this->isPowerOfTwo((int) $data['max_teams'])) {
                throw new \InvalidArgumentException('Max teams must be a power of 2 (4, 8, 16, 32, 64)');
            }

            // Check if reducing max_teams would exclude already registered teams
            if ($data['max_teams'] < $tournament->getRegisteredTeamsCount()) {
                throw new \InvalidArgumentException('Cannot reduce max teams below current registered count');
            }
        }

        $tournament->update([
            'name' => $data['name'] ?? $tournament->name,
            'description' => $data['description'] ?? $tournament->description,
            'logo_path' => $data['logo_path'] ?? $tournament->logo_path,
            'visibility' => $data['visibility'] ?? $tournament->visibility,
            'variant' => $data['variant'] ?? $tournament->variant,
            'max_teams' => $data['max_teams'] ?? $tournament->max_teams,
            'min_teams' => $data['min_teams'] ?? $tournament->min_teams,
            'registration_deadline' => $data['registration_deadline'] ?? $tournament->registration_deadline,
            'starts_at' => $data['starts_at'] ?? $tournament->starts_at,
            'ends_at' => $data['ends_at'] ?? $tournament->ends_at,
        ]);

        return $tournament->fresh();
    }

    /**
     * Delete a tournament.
     */
    public function deleteTournament(Tournament $tournament): void
    {
        if (! $tournament->canBeDeleted()) {
            throw new \RuntimeException('Tournament cannot be deleted. Only draft tournaments with no registrations can be deleted.');
        }

        $tournament->delete();
    }

    /**
     * Register a team for a tournament.
     */
    public function registerTeam(Tournament $tournament, Team $team, User $user): TournamentTeam
    {
        // Check if registration is open
        if (! $tournament->isRegistrationOpen()) {
            if ($tournament->registration_deadline && now()->isAfter($tournament->registration_deadline)) {
                throw new \RuntimeException('Registration deadline has passed');
            }
            throw new \RuntimeException('Tournament is not accepting registrations');
        }

        // Check if tournament has space
        if (! $tournament->hasSpaceForTeams()) {
            throw new \RuntimeException('Tournament is full');
        }

        // Check if team is already registered
        $existing = $tournament->tournamentTeams()
            ->where('team_id', $team->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existing) {
            throw new \RuntimeException('Team is already registered for this tournament');
        }

        // Validate variant matches
        if ($tournament->variant !== $team->variant) {
            throw new \InvalidArgumentException('Team variant must match tournament variant');
        }

        // Handle re-registration after rejection or withdrawal
        $previousRegistration = $tournament->tournamentTeams()
            ->where('team_id', $team->id)
            ->whereIn('status', ['rejected', 'withdrawn'])
            ->first();

        if ($previousRegistration) {
            $previousRegistration->update([
                'status' => $tournament->visibility === 'public' ? 'approved' : 'pending',
                'registered_by' => $user->id,
                'registered_at' => now(),
                'approved_at' => $tournament->visibility === 'public' ? now() : null,
            ]);

            return $previousRegistration;
        }

        $registration = TournamentTeam::create([
            'tournament_id' => $tournament->id,
            'team_id' => $team->id,
            'status' => $tournament->visibility === 'public' ? 'approved' : 'pending',
            'registered_by' => $user->id,
            'registered_at' => now(),
            'approved_at' => $tournament->visibility === 'public' ? now() : null,
        ]);

        return $registration;
    }

    /**
     * Approve a team registration.
     */
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
    }

    /**
     * Reject a team registration.
     */
    public function rejectTeam(TournamentTeam $registration): void
    {
        if ($registration->isRejected()) {
            throw new \RuntimeException('Registration is already rejected');
        }

        $registration->update([
            'status' => 'rejected',
        ]);
    }

    /**
     * Withdraw a team registration.
     */
    public function withdrawTeam(TournamentTeam $registration): void
    {
        if ($registration->tournament->isInProgress() || $registration->tournament->isCompleted()) {
            throw new \RuntimeException('Cannot withdraw from a tournament that has started or completed');
        }

        $registration->update([
            'status' => 'withdrawn',
        ]);
    }

    /**
     * Start the tournament and generate bracket.
     */
    public function startTournament(Tournament $tournament): void
    {
        if ($tournament->status !== 'registration_open' && $tournament->status !== 'draft') {
            throw new \RuntimeException('Tournament cannot be started from its current status');
        }

        $approvedCount = $tournament->getApprovedTeamsCount();

        if ($approvedCount < $tournament->min_teams) {
            throw new \RuntimeException("Tournament needs at least {$tournament->min_teams} teams to start");
        }

        if (! $this->isPowerOfTwo($approvedCount)) {
            throw new \RuntimeException('Number of approved teams must be a power of 2 (4, 8, 16, 32, 64)');
        }

        DB::transaction(function () use ($tournament) {
            $tournament->update(['status' => 'in_progress']);
            $this->generateBracket($tournament);
        });
    }

    /**
     * Generate tournament bracket.
     */
    public function generateBracket(Tournament $tournament): void
    {
        // Get approved teams ordered by seed (nulls last)
        $teams = $tournament->tournamentTeams()
            ->where('status', 'approved')
            ->with('team')
            ->orderByRaw('seed IS NULL, seed ASC')
            ->get();

        // Assign seeds if not set
        $teams = $teams->map(function ($tournamentTeam, $index) {
            if ($tournamentTeam->seed === null) {
                $tournamentTeam->seed = $index + 1;
                $tournamentTeam->save();
            }

            return $tournamentTeam;
        });

        $teamCount = $teams->count();

        // Validate team count is power of 2
        if (! $this->isPowerOfTwo($teamCount)) {
            throw new \RuntimeException('Number of approved teams must be a power of 2');
        }

        // Calculate rounds needed
        $totalRounds = (int) log($teamCount, 2);

        // Create round records
        for ($i = 1; $i <= $totalRounds; $i++) {
            TournamentRound::create([
                'tournament_id' => $tournament->id,
                'round_number' => $i,
                'name' => $this->getRoundName($i, $totalRounds),
                'starts_at' => $tournament->starts_at,
            ]);
        }

        // Get first round
        $firstRound = $tournament->rounds()->where('round_number', 1)->first();

        // Create first round matches with seeding
        for ($i = 0; $i < $teamCount; $i += 2) {
            FootballMatch::create([
                'tournament_id' => $tournament->id,
                'tournament_round_id' => $firstRound->id,
                'home_team_id' => $teams[$i]->team_id,
                'away_team_id' => $teams[$i + 1]->team_id,
                'bracket_position' => intdiv($i, 2),
                'variant' => $tournament->variant,
                'status' => 'confirmed',
                'match_type' => 'competitive',
                'scheduled_at' => $tournament->starts_at,
                'location' => 'TBD',
                'created_by' => $tournament->organizer_id,
                'confirmed_at' => now(),
            ]);
        }

        // Create placeholder matches for subsequent rounds
        for ($roundNum = 2; $roundNum <= $totalRounds; $roundNum++) {
            $round = $tournament->rounds()->where('round_number', $roundNum)->first();
            $matchesInRound = intdiv($teamCount, pow(2, $roundNum));

            for ($matchPos = 0; $matchPos < $matchesInRound; $matchPos++) {
                FootballMatch::create([
                    'tournament_id' => $tournament->id,
                    'tournament_round_id' => $round->id,
                    'home_team_id' => null, // TBD
                    'away_team_id' => null, // TBD
                    'bracket_position' => $matchPos,
                    'variant' => $tournament->variant,
                    'status' => 'pending',
                    'match_type' => 'competitive',
                    'scheduled_at' => $tournament->starts_at,
                    'location' => 'TBD',
                    'created_by' => $tournament->organizer_id,
                ]);
            }
        }
    }

    /**
     * Advance the winner of a match to the next round.
     */
    public function advanceWinner(FootballMatch $match): void
    {
        if (! $match->isTournamentMatch()) {
            throw new \RuntimeException('This is not a tournament match');
        }

        if (! $match->isCompleted()) {
            throw new \RuntimeException('Match is not completed yet');
        }

        $winnerId = $match->getWinnerTeamId();
        if (! $winnerId) {
            throw new \RuntimeException('Match has no winner (draw). Tournament matches cannot end in a draw.');
        }

        // Get the next match
        $nextMatch = $match->getNextMatch();
        if (! $nextMatch) {
            // This was the final match
            $this->completeTournament($match->tournament);

            return;
        }

        // Determine if winner goes to home or away position
        // Even bracket positions (0, 2, 4...) go to home, odd (1, 3, 5...) go to away
        if ($match->bracket_position % 2 === 0) {
            $nextMatch->home_team_id = $winnerId;
        } else {
            $nextMatch->away_team_id = $winnerId;
        }

        // If both teams are set, confirm the match
        if ($nextMatch->home_team_id && $nextMatch->away_team_id) {
            $nextMatch->status = 'confirmed';
            $nextMatch->confirmed_at = now();
        }

        $nextMatch->save();
    }

    /**
     * Complete the tournament.
     */
    private function completeTournament(Tournament $tournament): void
    {
        $tournament->update([
            'status' => 'completed',
            'ends_at' => now(),
        ]);
    }

    /**
     * Cancel a tournament.
     */
    public function cancelTournament(Tournament $tournament): void
    {
        if ($tournament->isCompleted()) {
            throw new \RuntimeException('Cannot cancel a completed tournament');
        }

        if ($tournament->isCancelled()) {
            throw new \RuntimeException('Tournament is already cancelled');
        }

        $tournament->update(['status' => 'cancelled']);
    }

    /**
     * Get round name based on round number and total rounds.
     */
    private function getRoundName(int $roundNumber, int $totalRounds): string
    {
        $roundsFromEnd = $totalRounds - $roundNumber + 1;

        return match ($roundsFromEnd) {
            1 => 'Final',
            2 => 'Semifinal',
            3 => 'Cuartos de Final',
            4 => 'Octavos de Final',
            default => "Ronda $roundNumber",
        };
    }

    /**
     * Check if a number is a power of 2.
     */
    private function isPowerOfTwo(int $number): bool
    {
        return $number > 0 && ($number & ($number - 1)) === 0;
    }
}
