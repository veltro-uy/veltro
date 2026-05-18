<?php

declare(strict_types=1);

namespace App\Services\Tournament;

final class TournamentFormatRules
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function resolveMaxTeams(string $format, array $data, ?int $groupCount, ?int $groupSize, ?int $fallback = null): int
    {
        if ($format === 'group_stage_knockout' && $groupCount && $groupSize) {
            return $groupCount * $groupSize;
        }

        if (isset($data['max_teams'])) {
            return (int) $data['max_teams'];
        }

        return $fallback ?? 8;
    }

    public function validateFormatConfig(string $format, int $maxTeams, ?int $groupCount, ?int $groupSize): void
    {
        if (! in_array($format, ['single_elimination', 'league', 'group_stage_knockout'], true)) {
            throw new \InvalidArgumentException('Invalid tournament format');
        }

        if ($format === 'single_elimination') {
            if (! in_array($maxTeams, [4, 8, 16, 32, 64], true)) {
                throw new \InvalidArgumentException('Single-elimination tournaments require max teams in {4, 8, 16, 32, 64}');
            }

            return;
        }

        if ($format === 'league') {
            if ($maxTeams < 2 || $maxTeams > 64) {
                throw new \InvalidArgumentException('League tournaments require between 2 and 64 teams');
            }

            return;
        }

        if (! in_array($groupCount, [2, 4, 8, 16], true)) {
            throw new \InvalidArgumentException('Group count must be 2, 4, 8 or 16');
        }

        if ($groupSize === null || $groupSize < 2 || $groupSize > 16) {
            throw new \InvalidArgumentException('Group size must be between 2 and 16');
        }

        if ($maxTeams !== $groupCount * $groupSize) {
            throw new \InvalidArgumentException('Max teams must equal group_count x group_size');
        }
    }

    public function isPowerOfTwo(int $number): bool
    {
        return $number > 0 && ($number & ($number - 1)) === 0;
    }
}
