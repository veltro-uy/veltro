<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Services\MatchService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class MatchEventController extends Controller
{
    public function __construct(
        private readonly MatchService $matchService
    ) {}

    /**
     * Store a new match event.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'match_id' => ['required', 'integer', 'exists:matches,id'],
            'team_id' => ['required', 'integer', 'exists:teams,id'],
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'event_type' => ['required', 'in:goal,assist,yellow_card,red_card,substitution_in,substitution_out'],
            'minute' => ['nullable', 'integer', 'min:0', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $match = FootballMatch::findOrFail($validated['match_id']);
            $user = Auth::user();

            // Verify user is a leader of the team
            $team = \App\Models\Team::findOrFail((int) $validated['team_id']);
            if (!$team->isLeader($user->id)) {
                abort(403, 'No autorizado');
            }

            $this->matchService->recordEvent($match, (int) $validated['team_id'], $validated);

            return back()->with('success', '¡Evento registrado exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Delete a match event.
     */
    public function destroy(int $eventId)
    {
        $user = Auth::user();

        try {
            $this->matchService->deleteEvent($eventId, $user->id);

            return back()->with('success', 'Evento eliminado exitosamente');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
