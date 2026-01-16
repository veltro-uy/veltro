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
            'team_id' => 'required|exists:teams,id',
        ]);

        $match = FootballMatch::findOrFail($matchId);
        $user = Auth::user();
        $teamId = $request->input('team_id');

        // Verify user is a member of this team
        $team = Team::findOrFail($teamId);
        if (!$team->hasMember($user->id)) {
            abort(403, 'You are not a member of this team.');
        }

        // Verify this team is playing in the match
        if ($match->home_team_id !== $teamId && $match->away_team_id !== $teamId) {
            abort(403, 'This team is not playing in this match.');
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
        if ($match->needsPlayerAlert($teamId) && $team->isLeader($user->id)) {
            $minimumPlayers = $match->getMinimumPlayers();
            $availableCount = $match->getAvailablePlayersCount($teamId);

            session()->flash('warning', "Warning: Only {$availableCount}/{$minimumPlayers} players confirmed available.");
        }

        return redirect()->back()->with('success', 'Availability updated successfully.');
    }
}
