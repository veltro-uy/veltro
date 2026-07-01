<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Services\MatchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MatchAvailabilityController extends Controller
{
    public function __construct(
        private readonly MatchService $matchService
    ) {}

    /**
     * Update the availability status for a match.
     */
    public function update(Request $request, int $matchId): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:available,maybe,unavailable',
        ]);

        $match = FootballMatch::findOrFail($matchId);
        $user = $request->user();

        // Derive the team from membership (IDOR guard - the client cannot
        // supply an arbitrary team_id).
        $team = $this->matchService->resolveUserTeam($match, $user->id);

        if (! $team) {
            abort(403, 'No sos miembro de ninguno de los equipos que juegan este partido.');
        }

        $this->matchService->recordPlayerAvailability($match, $user->id, $team->id, $validated['status']);

        // Warn leaders when the team is short of the minimum players.
        if ($match->needsPlayerAlert($team->id) && $team->isLeader($user->id)) {
            $minimumPlayers = $match->getMinimumPlayers();
            $availableCount = $match->getAvailablePlayersCount($team->id);

            session()->flash('warning', "Atención: solo {$availableCount}/{$minimumPlayers} jugadores confirmaron disponibilidad.");
        }

        return redirect()->back()->with('success', 'Disponibilidad actualizada exitosamente.');
    }
}
