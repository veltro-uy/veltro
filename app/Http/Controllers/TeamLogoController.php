<?php

namespace App\Http\Controllers;

use App\Models\Team;
use App\Services\TeamService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TeamLogoController extends Controller
{
    public function __construct(
        private readonly TeamService $teamService
    ) {}

    /**
     * Upload a new logo for the specified team.
     */
    public function store(Request $request, int $teamId): RedirectResponse
    {
        $team = Team::findOrFail($teamId);

        // Authorize: only captains and co-captains can upload
        if (! $team->isLeader($request->user()->id)) {
            abort(403, 'No tienes permiso para subir el logo de este equipo.');
        }

        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'], // 2MB max
        ]);

        $this->teamService->updateTeamLogo($team, $request->file('logo'));

        return back()->with('success', 'Logo del equipo actualizado exitosamente.');
    }

    /**
     * Delete the team's custom logo.
     */
    public function destroy(Request $request, int $teamId): RedirectResponse
    {
        $team = Team::findOrFail($teamId);

        // Authorize: only captains and co-captains can delete
        if (! $team->isLeader($request->user()->id)) {
            abort(403, 'No tienes permiso para eliminar el logo de este equipo.');
        }

        $this->teamService->removeTeamLogo($team);

        return back()->with('success', 'Logo del equipo eliminado exitosamente.');
    }
}
