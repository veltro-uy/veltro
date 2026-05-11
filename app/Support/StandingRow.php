<?php

namespace App\Support;

final readonly class StandingRow
{
    public function __construct(
        public int $teamId,
        public int $played,
        public int $wins,
        public int $draws,
        public int $losses,
        public int $goalsFor,
        public int $goalsAgainst,
        public int $goalDifference,
        public int $points,
        public int $position,
        public bool $tiedWithAbove = false,
    ) {}

    /**
     * @return array<string, int|bool>
     */
    public function toArray(): array
    {
        return [
            'team_id' => $this->teamId,
            'played' => $this->played,
            'wins' => $this->wins,
            'draws' => $this->draws,
            'losses' => $this->losses,
            'goals_for' => $this->goalsFor,
            'goals_against' => $this->goalsAgainst,
            'goal_difference' => $this->goalDifference,
            'points' => $this->points,
            'position' => $this->position,
            'tied_with_above' => $this->tiedWithAbove,
        ];
    }
}
