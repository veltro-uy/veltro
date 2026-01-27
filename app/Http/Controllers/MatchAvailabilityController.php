<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Models\MatchAvailability;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MatchAvailabilityController extends Controller
{
    /**
     * Update the availability status for a match.
     */
    public function update(Request $request, int $matchId): RedirectResponse
    {
        $request->validate([
            'status' => 'required|in:available,maybe,unavailable',
        ]);

        $match = FootballMatch::findOrFail($matchId);
        $user = Auth::user();

        // Determine which team the user belongs to that's playing in this match
        // This prevents IDOR - users cannot manipulate team_id parameter
        $teamId = null;

        if ($match->home_team_id) {
            $homeTeam = Team::find($match->home_team_id);
            if ($homeTeam && $homeTeam->hasMember($user->id)) {
                $teamId = $match->home_team_id;
            }
        }

        if (! $teamId && $match->away_team_id) {
            $awayTeam = Team::find($match->away_team_id);
            if ($awayTeam && $awayTeam->hasMember($user->id)) {
                $teamId = $match->away_team_id;
            }
        }

        if (! $teamId) {
            abort(403, 'You are not a member of any team playing in this match.');
        }

        // Update or create availability
        $availability = MatchAvailability::updateOrCreate(
            [
                'match_id' => $matchId,
                'user_id' => $user->id,
                'team_id' => $teamId,
            ],
            [
                'status' => $request->input('status'),
                'confirmed_at' => now(),
            ]
        );

        // Check if team needs alert for minimum players
        $team = Team::find($teamId);
        if ($team && $match->needsPlayerAlert($teamId) && $team->isLeader($user->id)) {
            $minimumPlayers = $match->getMinimumPlayers();
            $availableCount = $match->getAvailablePlayersCount($teamId);

            session()->flash('warning', "Warning: Only {$availableCount}/{$minimumPlayers} players confirmed available.");
        }

        return redirect()->back()->with('success', 'Availability updated successfully.');
    }
}
