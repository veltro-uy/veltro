<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Models\Tournament;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class TournamentMatchController extends Controller
{
    /**
     * Update an individual tournament match's schedule (date/time/location).
     */
    public function update(Request $request, Tournament $tournament, FootballMatch $match): RedirectResponse
    {
        $this->authorize('scheduleMatches', $tournament);

        if ($match->tournament_id !== $tournament->id) {
            abort(404);
        }

        if (in_array($match->status, ['in_progress', 'completed'], true)) {
            abort(403, 'No se puede modificar un partido que ya empezó o terminó.');
        }

        $data = $request->validate([
            'scheduled_at' => ['nullable', 'date', 'after_or_equal:today'],
            'location' => ['nullable', 'string', 'max:255'],
        ]);

        $match->update([
            'scheduled_at' => $data['scheduled_at'] ?? null,
            'location' => $data['location'] ?? null,
        ]);

        return back()->with('success', 'Partido programado correctamente.');
    }
}
