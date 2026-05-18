<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Tournament;
use App\Models\TournamentTeam;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class TournamentGroupController extends Controller
{
    /**
     * Save the organizer's group draw. Accepts an `assignments` array of
     * { tournament_team_id, tournament_group_id } and writes them in a
     * single transaction. Group-id may be null to "unassign" a team.
     */
    public function assign(Request $request, int $tournamentId)
    {
        $tournament = Tournament::with('groups')->findOrFail($tournamentId);
        $this->authorize('drawGroups', $tournament);

        $validated = $request->validate([
            'assignments' => ['required', 'array', 'min:1'],
            'assignments.*.tournament_team_id' => ['required', 'integer'],
            'assignments.*.tournament_group_id' => ['nullable', 'integer'],
        ]);

        $groupIdsForTournament = $tournament->groups->pluck('id')->all();
        $teamIdsForTournament = TournamentTeam::where('tournament_id', $tournament->id)
            ->where('status', 'approved')
            ->pluck('id')
            ->all();

        // Validate every team and group belong to this tournament.
        foreach ($validated['assignments'] as $assignment) {
            if (! in_array($assignment['tournament_team_id'], $teamIdsForTournament, true)) {
                throw ValidationException::withMessages([
                    'error' => 'Una o más asignaciones referencian un equipo que no pertenece a este torneo.',
                ]);
            }
            if ($assignment['tournament_group_id'] !== null
                && ! in_array($assignment['tournament_group_id'], $groupIdsForTournament, true)) {
                throw ValidationException::withMessages([
                    'error' => 'Una o más asignaciones referencian un grupo que no pertenece a este torneo.',
                ]);
            }
        }

        // Validate group capacity.
        $assignmentsByGroup = [];
        foreach ($validated['assignments'] as $assignment) {
            if ($assignment['tournament_group_id'] !== null) {
                $assignmentsByGroup[$assignment['tournament_group_id']] = ($assignmentsByGroup[$assignment['tournament_group_id']] ?? 0) + 1;
            }
        }
        $capacity = (int) $tournament->group_size;
        foreach ($assignmentsByGroup as $groupId => $count) {
            if ($count > $capacity) {
                throw ValidationException::withMessages([
                    'error' => "Un grupo no puede tener más de {$capacity} equipos.",
                ]);
            }
        }

        DB::transaction(function () use ($validated) {
            foreach ($validated['assignments'] as $assignment) {
                TournamentTeam::where('id', $assignment['tournament_team_id'])
                    ->update(['tournament_group_id' => $assignment['tournament_group_id']]);
            }
        });

        return redirect()->route('tournaments.show', $tournament->id)
            ->with('success', 'Sorteo guardado.');
    }

    /**
     * Clear all group assignments for this tournament's approved teams.
     */
    public function clear(int $tournamentId)
    {
        $tournament = Tournament::findOrFail($tournamentId);
        $this->authorize('drawGroups', $tournament);

        TournamentTeam::where('tournament_id', $tournament->id)
            ->update(['tournament_group_id' => null]);

        return redirect()->route('tournaments.show', $tournament->id)
            ->with('success', 'Sorteo reiniciado.');
    }
}
