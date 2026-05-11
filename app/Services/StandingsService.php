<?php

namespace App\Services;

use App\Models\FootballMatch;
use App\Models\Tournament;
use App\Models\TournamentGroup;
use App\Support\StandingRow;
use Illuminate\Support\Collection;

class StandingsService
{
    public const WIN_POINTS = 3;

    public const DRAW_POINTS = 1;

    public const LOSS_POINTS = 0;

    /**
     * Compute a standings table from a set of matches over a fixed team set.
     *
     * Tiebreakers applied in order: points → goal difference → goals scored →
     * head-to-head (mini-table over only matches between the tied teams) →
     * seeded random shuffle (only when teams in the tied subgroup have actually
     * played each other; otherwise input order is preserved).
     *
     * @param  Collection<int, FootballMatch>  $matches
     * @param  Collection<int, int>  $teamIds
     * @return array<int, StandingRow>
     */
    public function compute(Collection $matches, Collection $teamIds, ?int $rngSeed = null): array
    {
        $teamIdList = $teamIds->values()->all();

        $aggregates = [];
        foreach ($teamIdList as $teamId) {
            $aggregates[$teamId] = $this->emptyAggregate($teamId);
        }

        $completed = $matches->filter(fn (FootballMatch $m) => $m->status === 'completed'
            && $m->home_score !== null
            && $m->away_score !== null
            && in_array($m->home_team_id, $teamIdList, true)
            && in_array($m->away_team_id, $teamIdList, true)
        )->values();

        foreach ($completed as $match) {
            $this->applyMatch($aggregates, $match);
        }

        // Preserve registration/input order as the stable starting order.
        $ordered = array_values(array_map(fn (int $id) => $aggregates[$id], $teamIdList));

        // Stable sort by primary stats (points → GD → GF).
        $this->stableSort($ordered, fn (array $a, array $b) => [$b['points'], $b['goal_difference'], $b['goals_for']]
            <=> [$a['points'], $a['goal_difference'], $a['goals_for']]);

        $ordered = $this->resolveTies($ordered, $completed, $rngSeed);

        return $this->toStandingRows($ordered);
    }

    /**
     * Compute league standings (all approved teams over all tournament matches).
     *
     * @return array<int, StandingRow>
     */
    public function forLeague(Tournament $tournament): array
    {
        $teamIds = $tournament->approvedTeams()->pluck('team_id');
        $matches = $tournament->matches()->get();

        return $this->compute($matches, $teamIds, $tournament->id);
    }

    /**
     * Compute standings for a single group.
     *
     * @return array<int, StandingRow>
     */
    public function forGroup(TournamentGroup $group): array
    {
        $group->loadMissing(['teams', 'matches']);
        $teamIds = $group->teams->pluck('team_id');

        return $this->compute($group->matches, $teamIds, $group->tournament_id);
    }

    /**
     * @return array<string, int>
     */
    private function emptyAggregate(int $teamId): array
    {
        return [
            'team_id' => $teamId,
            'played' => 0,
            'wins' => 0,
            'draws' => 0,
            'losses' => 0,
            'goals_for' => 0,
            'goals_against' => 0,
            'goal_difference' => 0,
            'points' => 0,
        ];
    }

    /**
     * @param  array<int, array<string, int>>  $aggregates
     */
    private function applyMatch(array &$aggregates, FootballMatch $match): void
    {
        $home = &$aggregates[$match->home_team_id];
        $away = &$aggregates[$match->away_team_id];

        $home['played']++;
        $away['played']++;
        $home['goals_for'] += $match->home_score;
        $home['goals_against'] += $match->away_score;
        $away['goals_for'] += $match->away_score;
        $away['goals_against'] += $match->home_score;

        if ($match->home_score > $match->away_score) {
            $home['wins']++;
            $away['losses']++;
            $home['points'] += self::WIN_POINTS;
            $away['points'] += self::LOSS_POINTS;
        } elseif ($match->away_score > $match->home_score) {
            $away['wins']++;
            $home['losses']++;
            $away['points'] += self::WIN_POINTS;
            $home['points'] += self::LOSS_POINTS;
        } else {
            $home['draws']++;
            $away['draws']++;
            $home['points'] += self::DRAW_POINTS;
            $away['points'] += self::DRAW_POINTS;
        }

        $home['goal_difference'] = $home['goals_for'] - $home['goals_against'];
        $away['goal_difference'] = $away['goals_for'] - $away['goals_against'];
    }

    /**
     * Walk the ordered list, find adjacent runs that tie on (points, GD, GF),
     * and resolve each run via head-to-head + RNG (only when actually played).
     *
     * @param  array<int, array<string, int>>  $ordered
     * @param  Collection<int, FootballMatch>  $matches
     * @return array<int, array<string, int|bool>>
     */
    private function resolveTies(array $ordered, Collection $matches, ?int $rngSeed): array
    {
        $resolved = [];
        $i = 0;
        $n = count($ordered);

        while ($i < $n) {
            $group = [$ordered[$i]];
            $j = $i + 1;
            while ($j < $n && $this->primaryEqual($ordered[$i], $ordered[$j])) {
                $group[] = $ordered[$j];
                $j++;
            }

            if (count($group) > 1) {
                $group = $this->resolveTiedGroup($group, $matches, $rngSeed);
            }

            foreach ($group as $row) {
                $resolved[] = $row;
            }
            $i = $j;
        }

        return $resolved;
    }

    /**
     * @param  array<int, array<string, int>>  $group
     * @param  Collection<int, FootballMatch>  $matches
     * @return array<int, array<string, int|bool>>
     */
    private function resolveTiedGroup(array $group, Collection $matches, ?int $rngSeed): array
    {
        $tiedIds = array_column($group, 'team_id');

        $h2hMatches = $matches->filter(fn (FootballMatch $m) => in_array($m->home_team_id, $tiedIds, true)
            && in_array($m->away_team_id, $tiedIds, true)
        )->values();

        $miniAggregates = [];
        foreach ($tiedIds as $teamId) {
            $miniAggregates[$teamId] = $this->emptyAggregate($teamId);
        }
        foreach ($h2hMatches as $match) {
            $this->applyMatch($miniAggregates, $match);
        }

        // Stable sort by H2H mini-table.
        $this->stableSort($group, function (array $a, array $b) use ($miniAggregates) {
            $ma = $miniAggregates[$a['team_id']];
            $mb = $miniAggregates[$b['team_id']];

            return [$mb['points'], $mb['goal_difference'], $mb['goals_for']]
                <=> [$ma['points'], $ma['goal_difference'], $ma['goals_for']];
        });

        // Find runs that are still tied in the mini-table; only RNG-shuffle if
        // the subgroup has actually played each other.
        $resolved = [];
        $i = 0;
        $n = count($group);
        while ($i < $n) {
            $sub = [$group[$i]];
            $j = $i + 1;
            $miniA = $miniAggregates[$group[$i]['team_id']];
            while ($j < $n) {
                $miniB = $miniAggregates[$group[$j]['team_id']];
                if ($this->aggregatesEqual($miniA, $miniB)) {
                    $sub[] = $group[$j];
                    $j++;
                } else {
                    break;
                }
            }

            if (count($sub) > 1) {
                $subTeamIds = array_column($sub, 'team_id');
                if ($this->subgroupHasPlayed($h2hMatches, $subTeamIds)) {
                    $sub = $this->shuffleDeterministic($sub, $rngSeed);
                    for ($k = 1; $k < count($sub); $k++) {
                        $sub[$k]['_tied_with_above'] = true;
                    }
                }
            }

            foreach ($sub as $row) {
                $resolved[] = $row;
            }
            $i = $j;
        }

        return $resolved;
    }

    /**
     * @param  array<string, int>  $a
     * @param  array<string, int>  $b
     */
    private function primaryEqual(array $a, array $b): bool
    {
        return $this->aggregatesEqual($a, $b);
    }

    /**
     * @param  array<string, int>  $a
     * @param  array<string, int>  $b
     */
    private function aggregatesEqual(array $a, array $b): bool
    {
        return $a['points'] === $b['points']
            && $a['goal_difference'] === $b['goal_difference']
            && $a['goals_for'] === $b['goals_for'];
    }

    /**
     * @param  Collection<int, FootballMatch>  $matches
     * @param  array<int, int>  $teamIds
     */
    private function subgroupHasPlayed(Collection $matches, array $teamIds): bool
    {
        foreach ($matches as $match) {
            if (in_array($match->home_team_id, $teamIds, true)
                && in_array($match->away_team_id, $teamIds, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<int, array<string, int>>  $items
     * @return array<int, array<string, int>>
     */
    private function shuffleDeterministic(array $items, ?int $rngSeed): array
    {
        $seed = ($rngSeed ?? 0) + array_sum(array_column($items, 'team_id'));
        mt_srand($seed);
        for ($k = count($items) - 1; $k > 0; $k--) {
            $r = mt_rand(0, $k);
            [$items[$k], $items[$r]] = [$items[$r], $items[$k]];
        }
        // Restore non-deterministic state so unrelated callers aren't affected.
        mt_srand();

        return $items;
    }

    /**
     * Stable sort (preserves input order for equal elements). PHP's usort is
     * stable since 8.0 but we wrap it for clarity.
     *
     * @param  array<int, mixed>  $items
     */
    private function stableSort(array &$items, callable $comparator): void
    {
        usort($items, $comparator);
    }

    /**
     * @param  array<int, array<string, int|bool>>  $ordered
     * @return array<int, StandingRow>
     */
    private function toStandingRows(array $ordered): array
    {
        $rows = [];
        $position = 1;
        foreach ($ordered as $aggregate) {
            $rows[] = new StandingRow(
                teamId: $aggregate['team_id'],
                played: $aggregate['played'],
                wins: $aggregate['wins'],
                draws: $aggregate['draws'],
                losses: $aggregate['losses'],
                goalsFor: $aggregate['goals_for'],
                goalsAgainst: $aggregate['goals_against'],
                goalDifference: $aggregate['goal_difference'],
                points: $aggregate['points'],
                position: $position,
                tiedWithAbove: $aggregate['_tied_with_above'] ?? false,
            );
            $position++;
        }

        return $rows;
    }
}
