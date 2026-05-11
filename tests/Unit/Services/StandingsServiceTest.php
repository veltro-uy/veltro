<?php

use App\Models\FootballMatch;
use App\Services\StandingsService;

function standingsMatch(int $home, int $away, int $homeScore, int $awayScore, string $status = 'completed'): FootballMatch
{
    $match = new FootballMatch;
    $match->home_team_id = $home;
    $match->away_team_id = $away;
    $match->home_score = $homeScore;
    $match->away_score = $awayScore;
    $match->status = $status;

    return $match;
}

it('returns one row per team with zeros when no matches exist', function () {
    $rows = (new StandingsService)->compute(collect(), collect([1, 2, 3]));

    expect($rows)->toHaveCount(3);
    foreach ($rows as $row) {
        expect($row->played)->toBe(0)
            ->and($row->wins)->toBe(0)
            ->and($row->draws)->toBe(0)
            ->and($row->losses)->toBe(0)
            ->and($row->points)->toBe(0)
            ->and($row->goalDifference)->toBe(0)
            ->and($row->tiedWithAbove)->toBeFalse();
    }
    // Input order preserved when no matches have been played.
    expect(array_map(fn ($r) => $r->teamId, $rows))->toBe([1, 2, 3]);
});

it('aggregates wins, draws, losses, goals, and points correctly', function () {
    $matches = collect([
        standingsMatch(1, 2, 3, 1),  // 1 beats 2
        standingsMatch(2, 3, 2, 2),  // draw
        standingsMatch(1, 3, 1, 0),  // 1 beats 3
    ]);

    $rows = (new StandingsService)->compute($matches, collect([1, 2, 3]));

    // Team 1: 2W = 6 pts, GF 4 GA 1 GD +3
    expect($rows[0]->teamId)->toBe(1)
        ->and($rows[0]->wins)->toBe(2)
        ->and($rows[0]->draws)->toBe(0)
        ->and($rows[0]->losses)->toBe(0)
        ->and($rows[0]->goalsFor)->toBe(4)
        ->and($rows[0]->goalsAgainst)->toBe(1)
        ->and($rows[0]->goalDifference)->toBe(3)
        ->and($rows[0]->points)->toBe(6)
        ->and($rows[0]->position)->toBe(1);

    // Team 3: 0W 1D 1L = 1 pt, GF 2 GA 3 GD -1 (better than team 2's GD -2)
    expect($rows[1]->teamId)->toBe(3)
        ->and($rows[1]->points)->toBe(1)
        ->and($rows[1]->goalDifference)->toBe(-1)
        ->and($rows[1]->position)->toBe(2);

    // Team 2: 0W 1D 1L = 1 pt, GF 3 GA 5 GD -2
    expect($rows[2]->teamId)->toBe(2)
        ->and($rows[2]->points)->toBe(1)
        ->and($rows[2]->goalDifference)->toBe(-2)
        ->and($rows[2]->position)->toBe(3);
});

it('breaks ties by goal difference', function () {
    $matches = collect([
        standingsMatch(1, 3, 3, 0),  // 1 beats 3 by 3
        standingsMatch(2, 3, 1, 0),  // 2 beats 3 by 1
    ]);

    $rows = (new StandingsService)->compute($matches, collect([1, 2, 3]));

    // Teams 1 and 2 both have 3 pts; team 1 has GD +3, team 2 has GD +1.
    expect($rows[0]->teamId)->toBe(1)->and($rows[0]->goalDifference)->toBe(3);
    expect($rows[1]->teamId)->toBe(2)->and($rows[1]->goalDifference)->toBe(1);
    expect($rows[2]->teamId)->toBe(3);
});

it('breaks ties by goals scored when GD is equal', function () {
    $matches = collect([
        standingsMatch(1, 3, 4, 2),  // 1 beats 3
        standingsMatch(4, 1, 3, 1),  // 4 beats 1 — team 1 GD: +2 -2 = 0
        standingsMatch(2, 3, 1, 0),  // 2 beats 3
        standingsMatch(4, 2, 1, 0),  // 4 beats 2 — team 2 GD: +1 -1 = 0
    ]);

    $rows = (new StandingsService)->compute($matches, collect([1, 2, 3, 4]));

    // Team 4: 2W = 6 pts (top)
    // Team 1: 1W 1L = 3 pts, GD 0, GF 5
    // Team 2: 1W 1L = 3 pts, GD 0, GF 1 — same pts/GD, less GF
    // Team 3: 0W 2L = 0 pts (bottom)
    expect($rows[0]->teamId)->toBe(4)->and($rows[0]->points)->toBe(6);
    expect($rows[1]->teamId)->toBe(1)->and($rows[1]->goalsFor)->toBe(5);
    expect($rows[2]->teamId)->toBe(2)->and($rows[2]->goalsFor)->toBe(1);
    expect($rows[3]->teamId)->toBe(3);
});

it('breaks ties by head-to-head when primary stats are identical', function () {
    // 4 teams. A=1, B=2, C=3, D=4. All play each other once.
    $matches = collect([
        standingsMatch(1, 4, 5, 0),  // A beats D 5-0
        standingsMatch(1, 2, 1, 0),  // A beats B 1-0
        standingsMatch(3, 1, 1, 0),  // C beats A 1-0
        standingsMatch(4, 2, 5, 0),  // D beats B 5-0
        standingsMatch(3, 4, 5, 0),  // C beats D 5-0
        standingsMatch(2, 3, 1, 0),  // B beats C 1-0
    ]);

    $rows = (new StandingsService)->compute($matches, collect([1, 2, 3, 4]));

    // A: 6 pts, GF 6 GA 1 GD +5
    // C: 6 pts, GF 6 GA 1 GD +5  ← tied with A on (pts, GD, GF); H2H: C beat A, so C first
    // D: 3 pts, GF 5 GA 10 GD -5
    // B: 3 pts, GF 1 GA 6  GD -5  ← tied with D on (pts, GD); GF tiebreak: D ahead (5 > 1)
    expect($rows[0]->teamId)->toBe(3); // C
    expect($rows[1]->teamId)->toBe(1); // A
    expect($rows[2]->teamId)->toBe(4); // D
    expect($rows[3]->teamId)->toBe(2); // B
});

it('uses seeded RNG to break truly unbreakable ties deterministically', function () {
    // Rock-paper-scissors: each team beats one and loses to the other.
    // All 3 teams: 1W 1L = 3 pts, GF 1 GA 1 GD 0. H2H mini-table is identical.
    $matches = collect([
        standingsMatch(1, 2, 1, 0),
        standingsMatch(2, 3, 1, 0),
        standingsMatch(3, 1, 1, 0),
    ]);

    $svc = new StandingsService;
    $rows1 = $svc->compute($matches, collect([1, 2, 3]), rngSeed: 42);
    $rows2 = $svc->compute($matches, collect([1, 2, 3]), rngSeed: 42);

    $ids1 = array_map(fn ($r) => $r->teamId, $rows1);
    $ids2 = array_map(fn ($r) => $r->teamId, $rows2);

    // Same seed → identical order.
    expect($ids1)->toBe($ids2);

    // The 2nd and 3rd teams are flagged as tied with above.
    expect($rows1[1]->tiedWithAbove)->toBeTrue();
    expect($rows1[2]->tiedWithAbove)->toBeTrue();
    expect($rows1[0]->tiedWithAbove)->toBeFalse();
});

it('preserves input order when tied teams have not yet played each other', function () {
    // Mid-stage standings: teams 1, 2, 3 are all at zero having only played team 4.
    // No actual H2H between 1/2/3 — should NOT shuffle them via RNG.
    $matches = collect([
        standingsMatch(4, 1, 1, 0),  // team 1 lost to 4
        standingsMatch(4, 2, 1, 0),  // team 2 lost to 4
        standingsMatch(4, 3, 1, 0),  // team 3 lost to 4
    ]);

    $rows = (new StandingsService)->compute($matches, collect([1, 2, 3, 4]));

    expect($rows[0]->teamId)->toBe(4);
    // Teams 1, 2, 3 all tied (0 pts, GD -1, GF 0) and have NOT played each
    // other → input order preserved, no _tied_with_above markers.
    expect($rows[1]->teamId)->toBe(1)->and($rows[1]->tiedWithAbove)->toBeFalse();
    expect($rows[2]->teamId)->toBe(2)->and($rows[2]->tiedWithAbove)->toBeFalse();
    expect($rows[3]->teamId)->toBe(3)->and($rows[3]->tiedWithAbove)->toBeFalse();
});

it('ignores matches involving teams outside the team set', function () {
    $matches = collect([
        standingsMatch(1, 2, 3, 1),
        standingsMatch(99, 1, 5, 0), // team 99 not in the set
    ]);

    $rows = (new StandingsService)->compute($matches, collect([1, 2]));

    expect($rows[0]->teamId)->toBe(1)
        ->and($rows[0]->played)->toBe(1)
        ->and($rows[0]->goalsFor)->toBe(3);
});

it('ignores non-completed matches', function () {
    $matches = collect([
        standingsMatch(1, 2, 3, 1, 'completed'),
        standingsMatch(1, 2, 0, 0, 'in_progress'),
        standingsMatch(1, 2, 0, 0, 'confirmed'),
    ]);

    $rows = (new StandingsService)->compute($matches, collect([1, 2]));

    expect($rows[0]->played)->toBe(1)
        ->and($rows[0]->teamId)->toBe(1)
        ->and($rows[0]->wins)->toBe(1);
});
