<?php

declare(strict_types=1);

namespace App\Services\Tournament;

final class RoundRobinScheduler
{
    /**
     * Generate a single round-robin schedule using the circle method.
     *
     * Returns one fixture per pair of teams across `n - 1` matchdays (n/2
     * matches per matchday). If team count is odd, a phantom BYE is added and
     * fixtures involving it are skipped. Home/away alternates per round so the
     * fixed-position team gets a balanced split.
     *
     * @param  array<int, int>  $teamIds
     * @return array<int, array{matchday: int, home: int, away: int}>
     */
    public function generate(array $teamIds): array
    {
        $teams = array_values($teamIds);
        if (count($teams) < 2) {
            return [];
        }

        if (count($teams) % 2 === 1) {
            $teams[] = -1; // BYE sentinel
        }

        $n = count($teams);
        $rounds = $n - 1;
        $half = intdiv($n, 2);

        // We rotate indices into $teams instead of the array itself so the
        // fixed team (position 0) is always the original first team.
        $positions = range(0, $n - 1);
        $fixtures = [];

        for ($r = 0; $r < $rounds; $r++) {
            $matchday = $r + 1;

            for ($i = 0; $i < $half; $i++) {
                $home = $teams[$positions[$i]];
                $away = $teams[$positions[$n - 1 - $i]];

                if ($home === -1 || $away === -1) {
                    continue;
                }

                if ($r % 2 === 1) {
                    $fixtures[] = ['matchday' => $matchday, 'home' => $away, 'away' => $home];
                } else {
                    $fixtures[] = ['matchday' => $matchday, 'home' => $home, 'away' => $away];
                }
            }

            // Rotate: keep position[0] fixed, move last index to position 1,
            // shift the rest right by one.
            $last = $positions[$n - 1];
            for ($k = $n - 1; $k > 1; $k--) {
                $positions[$k] = $positions[$k - 1];
            }
            $positions[1] = $last;
        }

        return $fixtures;
    }
}
