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
    public function edit(Request $request, int $matchId): Response
    {
        $match = FootballMatch::with([
            'homeTeam.teamMembers.user',
            'awayTeam.teamMembers.user',
            'tournament',
            'lineups',
        ])->findOrFail($matchId);

        $user = Auth::user();

        // Determine which teams the user can manage a lineup for. Tournament
        // matches: the organizer manages both teams. Friendly matches: a leader
        // manages their own team only.
        $manageableTeams = collect();

        if ($match->isTournamentMatch()) {
            if (! $match->tournament?->isOrganizer($user->id)) {
                abort(403, 'No autorizado');
            }
            $manageableTeams->push($match->homeTeam);
            if ($match->awayTeam) {
                $manageableTeams->push($match->awayTeam);
            }
        } else {
            if ($match->isHomeTeamLeader($user->id)) {
                $manageableTeams->push($match->homeTeam);
            }
            if ($match->away_team_id && $match->isAwayTeamLeader($user->id)) {
                $manageableTeams->push($match->awayTeam);
            }

            if ($manageableTeams->isEmpty()) {
                abort(403, 'No autorizado');
            }
        }

        // Resolve the team currently being edited from ?team=, defaulting to the
        // first manageable team. Reject a team the user cannot manage.
        $requestedTeamId = $request->integer('team');
        $team = $requestedTeamId
            ? $manageableTeams->firstWhere('id', $requestedTeamId)
            : $manageableTeams->first();

        if (! $team) {
            abort(403, 'No autorizado');
        }

        // Get current lineup for this team
        $currentLineup = $match->lineups()
            ->where('team_id', $team->id)
            ->with('user')
            ->get();

        return Inertia::render('matches/lineup', [
            'match' => $match,
            'team' => $team,
            'teams' => $manageableTeams->map(fn ($t) => [
                'id' => $t->id,
                'name' => $t->name,
            ])->values(),
            'currentTeamId' => $team->id,
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

        $teamId = (int) $validated['team_id'];

        // Tournament matches: only the organizer may set lineups, and the team
        // must be part of the match. Friendly matches: the team's own leader.
        if ($match->isTournamentMatch()) {
            if (! $match->tournament?->isOrganizer($user->id)) {
                abort(403, 'No autorizado');
            }
            if (! in_array($teamId, array_filter([$match->home_team_id, $match->away_team_id]), true)) {
                abort(403, 'No autorizado');
            }
        } else {
            $team = \App\Models\Team::findOrFail($teamId);
            if (! $team->isLeader($user->id)) {
                abort(403, 'No autorizado');
            }
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
