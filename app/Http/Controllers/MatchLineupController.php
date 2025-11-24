<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Services\MatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class MatchLineupController extends Controller
{
    public function __construct(
        private readonly MatchService $matchService
    ) {}

    /**
     * Show the lineup form for a team in a match.
     */
    public function edit(int $matchId): Response
    {
        $match = FootballMatch::with([
            'homeTeam.teamMembers.user',
            'awayTeam.teamMembers.user',
            'lineups',
        ])->findOrFail($matchId);

        $user = Auth::user();

        // Determine which team the user can manage lineup for
        $isHomeLeader = $match->isHomeTeamLeader($user->id);
        $isAwayLeader = $match->away_team_id ? $match->isAwayTeamLeader($user->id) : false;

        if (!$isHomeLeader && !$isAwayLeader) {
            abort(403, 'No autorizado');
        }

        // Get the team the user can manage
        $team = $isHomeLeader ? $match->homeTeam : $match->awayTeam;
        
        // Get current lineup for this team
        $currentLineup = $match->lineups()
            ->where('team_id', $team->id)
            ->with('user')
            ->get();

        return Inertia::render('matches/lineup', [
            'match' => $match,
            'team' => $team,
            'currentLineup' => $currentLineup,
            'minimumPlayers' => $match->getMinimumPlayers(),
        ]);
    }

    /**
     * Update lineup for a team in a match.
     */
    public function update(Request $request, int $matchId)
    {
        $match = FootballMatch::findOrFail($matchId);
        $user = Auth::user();

        $validated = $request->validate([
            'team_id' => ['required', 'integer', 'exists:teams,id'],
            'players' => ['required', 'array', 'min:1'],
            'players.*.user_id' => ['required', 'integer', 'exists:users,id'],
            'players.*.position' => ['nullable', 'in:goalkeeper,defender,midfielder,forward'],
            'players.*.is_starter' => ['required', 'boolean'],
            'players.*.is_substitute' => ['required', 'boolean'],
        ]);

        // Verify user is leader of the team
        $team = \App\Models\Team::findOrFail((int) $validated['team_id']);
        if (!$team->isLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        try {
            $this->matchService->setLineup(
                $match,
                (int) $validated['team_id'],
                $validated['players']
            );

            return back()->with('success', '¡Alineación actualizada exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
