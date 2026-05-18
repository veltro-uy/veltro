<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FootballMatch;
use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentGroup;
use App\Models\TournamentRound;
use App\Models\TournamentTeam;
use App\Models\User;
use App\Services\Tournament\RoundRobinScheduler;
use App\Services\Tournament\TournamentFormatRules;
use App\Services\Tournament\TournamentRegistrationService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class TournamentService
{
    public function __construct(
        private readonly TournamentRegistrationService $registrationService,
        private readonly TournamentFormatRules $formatRules,
    ) {}

    /**
     * Create a new tournament.
     */
    public function createTournament(User $user, array $data): Tournament
    {
        $format = $data['format'] ?? 'single_elimination';
        $groupCount = isset($data['group_count']) ? (int) $data['group_count'] : null;
        $groupSize = isset($data['group_size']) ? (int) $data['group_size'] : null;

        $maxTeams = $this->formatRules->resolveMaxTeams($format, $data, $groupCount, $groupSize);
        $this->formatRules->validateFormatConfig($format, $maxTeams, $groupCount, $groupSize);

        $tournament = Tournament::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'logo_path' => $data['logo_path'] ?? null,
            'organizer_id' => $user->id,
            'visibility' => $data['visibility'] ?? 'public',
            'status' => $data['status'] ?? 'draft',
            'variant' => $data['variant'],
            'format' => $format,
            'phase' => 'not_started',
            'group_count' => $format === 'group_stage_knockout' ? $groupCount : null,
            'group_size' => $format === 'group_stage_knockout' ? $groupSize : null,
            'max_teams' => $maxTeams,
            'min_teams' => $data['min_teams'] ?? 4,
            'registration_deadline' => $data['registration_deadline'] ?? null,
            'starts_at' => $data['starts_at'] ?? null,
            'ends_at' => $data['ends_at'] ?? null,
        ]);

        if ($format === 'group_stage_knockout') {
            $this->createGroups($tournament);
        }

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

        // Format cannot change once any team has registered.
        if (isset($data['format']) && $data['format'] !== $tournament->format) {
            if ($tournament->getRegisteredTeamsCount() > 0) {
                throw new \InvalidArgumentException('Cannot change tournament format after teams have registered');
            }
        }

        $format = $data['format'] ?? $tournament->format;
        $groupCount = $data['group_count'] ?? $tournament->group_count;
        $groupSize = $data['group_size'] ?? $tournament->group_size;

        $maxTeams = $this->formatRules->resolveMaxTeams($format, $data, $groupCount, $groupSize, fallback: $tournament->max_teams);
        $this->formatRules->validateFormatConfig($format, $maxTeams, $groupCount, $groupSize);

        if ($maxTeams < $tournament->getRegisteredTeamsCount()) {
            throw new \InvalidArgumentException('Cannot reduce max teams below current registered count');
        }

        $tournament->update([
            'name' => $data['name'] ?? $tournament->name,
            'description' => $data['description'] ?? $tournament->description,
            'logo_path' => $data['logo_path'] ?? $tournament->logo_path,
            'visibility' => $data['visibility'] ?? $tournament->visibility,
            'variant' => $data['variant'] ?? $tournament->variant,
            'format' => $format,
            'group_count' => $format === 'group_stage_knockout' ? $groupCount : null,
            'group_size' => $format === 'group_stage_knockout' ? $groupSize : null,
            'max_teams' => $maxTeams,
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
        return $this->registrationService->registerTeam($tournament, $team, $user);
    }

    /**
     * Approve a team registration.
     */
    public function approveTeam(TournamentTeam $registration): void
    {
        $this->registrationService->approveTeam($registration);
    }

    /**
     * Reject a team registration.
     */
    public function rejectTeam(TournamentTeam $registration): void
    {
        $this->registrationService->rejectTeam($registration);
    }

    /**
     * Withdraw a team registration.
     */
    public function withdrawTeam(TournamentTeam $registration): void
    {
        $this->registrationService->withdrawTeam($registration);
    }

    /**
     * Start the tournament and generate the schedule for its format.
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

        DB::transaction(function () use ($tournament, $approvedCount) {
            if ($tournament->isLeague()) {
                if ($approvedCount < 2) {
                    throw new \RuntimeException('League tournaments need at least 2 teams to start');
                }
                $tournament->update(['status' => 'in_progress', 'phase' => 'league']);
                $this->generateLeagueSchedule($tournament);

                return;
            }

            if ($tournament->isGroupStageKnockout()) {
                $expected = (int) $tournament->group_count * (int) $tournament->group_size;
                if ($approvedCount !== $expected) {
                    throw new \RuntimeException("Tournament needs exactly {$expected} approved teams to start");
                }
                if ($tournament->approvedTeams()->whereNull('tournament_group_id')->exists()) {
                    throw new \RuntimeException('All approved teams must be assigned to a group before starting');
                }
                $tournament->update(['status' => 'in_progress', 'phase' => 'group_stage']);
                $this->generateGroupStageMatches($tournament);

                return;
            }

            // Default: single-elimination
            if (! $this->formatRules->isPowerOfTwo($approvedCount)) {
                throw new \RuntimeException('Number of approved teams must be a power of 2 (4, 8, 16, 32, 64)');
            }
            $tournament->update(['status' => 'in_progress', 'phase' => 'knockout']);
            $this->generateBracket($tournament);
        });
    }

    /**
     * Generate the league schedule (round-robin, one matchday per round).
     */
    public function generateLeagueSchedule(Tournament $tournament): void
    {
        $teamIds = $tournament->approvedTeams()
            ->orderByRaw('seed IS NULL, seed ASC')
            ->pluck('team_id')
            ->all();

        $fixtures = (new RoundRobinScheduler)->generate($teamIds);

        $matchdays = [];
        foreach ($fixtures as $fixture) {
            $matchdays[$fixture['matchday']][] = $fixture;
        }

        foreach ($matchdays as $matchdayNum => $matches) {
            $round = TournamentRound::create([
                'tournament_id' => $tournament->id,
                'round_number' => $matchdayNum,
                'name' => "Jornada {$matchdayNum}",
                'starts_at' => $tournament->starts_at,
            ]);

            foreach ($matches as $fixture) {
                FootballMatch::create([
                    'tournament_id' => $tournament->id,
                    'tournament_round_id' => $round->id,
                    'matchday' => $matchdayNum,
                    'home_team_id' => $fixture['home'],
                    'away_team_id' => $fixture['away'],
                    'bracket_position' => null,
                    'variant' => $tournament->variant,
                    'status' => 'confirmed',
                    'match_type' => 'competitive',
                    'scheduled_at' => null,
                    'location' => null,
                    'created_by' => $tournament->organizer_id,
                    'confirmed_at' => now(),
                ]);
            }
        }
    }

    /**
     * If every league match is completed, mark the tournament completed.
     */
    public function completeLeagueIfDone(Tournament $tournament): void
    {
        if (! $tournament->isLeague()) {
            return;
        }

        $hasIncomplete = $tournament->matches()
            ->where('status', '!=', 'completed')
            ->exists();

        if (! $hasIncomplete) {
            $tournament->update([
                'status' => 'completed',
                'phase' => 'completed',
                'ends_at' => now(),
            ]);
        }
    }

    /**
     * Generate group-stage round-robin matches for every group, sharing one
     * `tournament_round` per matchday across all groups.
     */
    public function generateGroupStageMatches(Tournament $tournament): void
    {
        $groups = $tournament->groups()->with('teams')->get();

        if ($groups->isEmpty()) {
            throw new \RuntimeException('Tournament has no groups defined');
        }

        $scheduler = new RoundRobinScheduler;
        $byMatchday = [];

        foreach ($groups as $group) {
            $teamIds = $group->teams->pluck('team_id')->all();
            $fixtures = $scheduler->generate($teamIds);
            foreach ($fixtures as $fixture) {
                $byMatchday[$fixture['matchday']][] = [
                    'group_id' => $group->id,
                    'home' => $fixture['home'],
                    'away' => $fixture['away'],
                ];
            }
        }

        ksort($byMatchday);

        foreach ($byMatchday as $matchdayNum => $matches) {
            $round = TournamentRound::create([
                'tournament_id' => $tournament->id,
                'round_number' => $matchdayNum,
                'name' => "Jornada {$matchdayNum} - Fase de grupos",
                'starts_at' => $tournament->starts_at,
            ]);

            foreach ($matches as $fixture) {
                FootballMatch::create([
                    'tournament_id' => $tournament->id,
                    'tournament_round_id' => $round->id,
                    'tournament_group_id' => $fixture['group_id'],
                    'matchday' => $matchdayNum,
                    'home_team_id' => $fixture['home'],
                    'away_team_id' => $fixture['away'],
                    'bracket_position' => null,
                    'variant' => $tournament->variant,
                    'status' => 'confirmed',
                    'match_type' => 'competitive',
                    'scheduled_at' => null,
                    'location' => null,
                    'created_by' => $tournament->organizer_id,
                    'confirmed_at' => now(),
                ]);
            }
        }
    }

    /**
     * If every group-stage match is completed, compute advancers, generate the
     * knockout bracket, and flip the tournament into the knockout phase.
     */
    public function maybeTransitionToKnockout(Tournament $tournament): void
    {
        if (! $tournament->isGroupStageKnockout() || ! $tournament->inGroupStage()) {
            return;
        }

        $hasIncomplete = $tournament->matches()
            ->whereNotNull('tournament_group_id')
            ->where('status', '!=', 'completed')
            ->exists();

        if ($hasIncomplete) {
            return;
        }

        DB::transaction(function () use ($tournament) {
            $lastMatchday = (int) $tournament->matches()
                ->whereNotNull('matchday')
                ->max('matchday');

            $standingsService = app(StandingsService::class);
            $advancers = []; // group_position => [rank => team_id]

            $tournament->load('groups.teams', 'groups.matches');
            $groups = $tournament->groups->sortBy('position')->values();

            foreach ($groups as $group) {
                $rows = $standingsService->forGroup($group);
                $advancers[$group->position] = [
                    0 => $rows[0]->teamId,
                    1 => $rows[1]->teamId,
                ];
            }

            $pairings = $this->groupKnockoutPairings((int) $tournament->group_count);

            // Flatten pairings into bracket-ordered team_ids: pos 0 home, pos 0 away, pos 1 home, ...
            $orderedTeamIds = [];
            foreach ($pairings as $pairing) {
                $orderedTeamIds[] = $advancers[$pairing['home_group_pos']][$pairing['home_rank']];
                $orderedTeamIds[] = $advancers[$pairing['away_group_pos']][$pairing['away_rank']];
            }

            $tournamentTeams = TournamentTeam::where('tournament_id', $tournament->id)
                ->whereIn('team_id', $orderedTeamIds)
                ->get()
                ->keyBy('team_id');

            $teamsOrdered = collect($orderedTeamIds)
                ->map(fn (int $teamId) => $tournamentTeams[$teamId])
                ->values();

            $this->generateBracket($tournament, $teamsOrdered, $lastMatchday + 1);
            $tournament->update(['phase' => 'knockout']);
        });
    }

    /**
     * Cross-bracket pairings for the knockout phase of a group_stage_knockout
     * tournament. Returns one entry per first-round bracket position, keyed by
     * bracket_position, mapping to the (home_group_pos, home_rank, away_group_pos,
     * away_rank) of the advancers to slot into that match.
     *
     * Pairs adjacent groups (0,1) (2,3) ... and mirrors them across the bracket
     * so group winners can only meet at later rounds.
     *
     * @return array<int, array{home_group_pos: int, home_rank: int, away_group_pos: int, away_rank: int}>
     */
    private function groupKnockoutPairings(int $groupCount): array
    {
        if (! $this->formatRules->isPowerOfTwo($groupCount) || $groupCount < 2) {
            throw new \RuntimeException('Group count must be a power of 2 ≥ 2');
        }

        $pairings = [];
        $half = intdiv($groupCount, 2);

        for ($i = 0; $i < $groupCount; $i += 2) {
            $primaryPos = intdiv($i, 2);
            $mirrorPos = $primaryPos + $half;

            $pairings[$primaryPos] = [
                'home_group_pos' => $i,
                'home_rank' => 0,
                'away_group_pos' => $i + 1,
                'away_rank' => 1,
            ];

            $pairings[$mirrorPos] = [
                'home_group_pos' => $i + 1,
                'home_rank' => 0,
                'away_group_pos' => $i,
                'away_rank' => 1,
            ];
        }

        ksort($pairings);

        return $pairings;
    }

    /**
     * Auto-create groups when a group_stage_knockout tournament is created.
     */
    private function createGroups(Tournament $tournament): void
    {
        $count = (int) $tournament->group_count;
        for ($i = 0; $i < $count; $i++) {
            TournamentGroup::create([
                'tournament_id' => $tournament->id,
                'name' => chr(ord('A') + $i),
                'position' => $i,
            ]);
        }
    }

    /**
     * Generate a single-elimination bracket.
     *
     * When called with no team list, loads approved teams ordered by seed
     * (assigning seeds to any unseeded entries). When called with an explicit
     * team list (used by the group→knockout transition), uses that list as-is
     * and starts numbering rounds from $startingRoundNumber.
     *
     * @param  Collection<int, TournamentTeam>|null  $teams
     */
    public function generateBracket(Tournament $tournament, ?Collection $teams = null, int $startingRoundNumber = 1): void
    {
        if ($teams === null) {
            $teams = $tournament->tournamentTeams()
                ->where('status', 'approved')
                ->with('team')
                ->orderByRaw('seed IS NULL, seed ASC')
                ->get();

            $teams = $teams->map(function ($tournamentTeam, $index) {
                if ($tournamentTeam->seed === null) {
                    $tournamentTeam->seed = $index + 1;
                    $tournamentTeam->save();
                }

                return $tournamentTeam;
            });
        }

        $teamCount = $teams->count();

        if (! $this->formatRules->isPowerOfTwo($teamCount)) {
            throw new \RuntimeException('Number of teams must be a power of 2');
        }

        $totalRoundsForBracket = (int) log($teamCount, 2);

        // Create round records (numbering continues from $startingRoundNumber).
        for ($i = 0; $i < $totalRoundsForBracket; $i++) {
            $namePosition = $i + 1; // 1-indexed within the bracket for naming
            TournamentRound::create([
                'tournament_id' => $tournament->id,
                'round_number' => $startingRoundNumber + $i,
                'name' => $this->getRoundName($namePosition, $totalRoundsForBracket),
                'starts_at' => $tournament->starts_at,
            ]);
        }

        $firstRound = $tournament->rounds()
            ->where('round_number', $startingRoundNumber)
            ->first();

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
                'scheduled_at' => null,
                'location' => null,
                'created_by' => $tournament->organizer_id,
                'confirmed_at' => now(),
            ]);
        }

        for ($i = 1; $i < $totalRoundsForBracket; $i++) {
            $round = $tournament->rounds()
                ->where('round_number', $startingRoundNumber + $i)
                ->first();
            $matchesInRound = intdiv($teamCount, pow(2, $i + 1));

            for ($matchPos = 0; $matchPos < $matchesInRound; $matchPos++) {
                FootballMatch::create([
                    'tournament_id' => $tournament->id,
                    'tournament_round_id' => $round->id,
                    'home_team_id' => null,
                    'away_team_id' => null,
                    'bracket_position' => $matchPos,
                    'variant' => $tournament->variant,
                    'status' => 'pending',
                    'match_type' => 'competitive',
                    'scheduled_at' => null,
                    'location' => null,
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
}
