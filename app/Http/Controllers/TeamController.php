<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Team;
use App\Services\TeamService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class TeamController extends Controller
{
    public function __construct(
        private readonly TeamService $teamService
    ) {}

    /**
     * Display a listing of teams.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Get user's teams
        $myTeams = $this->teamService->getUserTeams($user->id);

        // Get teams the user is not part of (for discovery)
        $discoverTeams = $this->teamService->getTeamsNotJoined($user->id);

        return Inertia::render('teams/index', [
            'myTeams' => $myTeams,
            'discoverTeams' => $discoverTeams,
        ]);
    }

    /**
     * Show the form for creating a new team.
     */
    public function create(): Response
    {
        return Inertia::render('teams/create');
    }

    /**
     * Store a newly created team.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'variant' => ['required', 'in:football_11,football_7,football_5,futsal'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = Auth::user();
        $team = $this->teamService->createTeam($user, $validated);

        return back()->with('success', '¡Equipo creado exitosamente!');
    }

    /**
     * Display the specified team.
     */
    public function show(int $id): Response
    {
        $team = $this->teamService->getTeamWithDetails($id);

        if (! $team) {
            abort(404);
        }

        $user = Auth::user();
        $isMember = $team->hasMember($user->id);
        $canManage = $team->isLeader($user->id);

        return Inertia::render('teams/show', [
            'team' => $team,
            'isMember' => $isMember,
            'canManage' => $canManage,
        ]);
    }

    /**
     * Update the specified team.
     */
    public function update(Request $request, int $id)
    {
        $team = Team::findOrFail($id);
        $user = Auth::user();

        if (! $team->isLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'variant' => ['required', 'in:football_11,football_7,football_5,futsal'],
            'description' => ['nullable', 'string', 'max:1000'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'remove_logo' => ['nullable', 'boolean'],
        ]);

        // Handle logo upload
        if ($request->hasFile('logo')) {
            $disk = config('filesystems.default');

            // Delete old logo if exists
            if ($team->logo_path) {
                \Storage::disk($disk)->delete($team->logo_path);
            }

            $file = $request->file('logo');
            $filename = uniqid().'.'.$file->getClientOriginalExtension();
            $path = "logos/{$team->id}/{$filename}";

            // Resize and save the image
            $image = \Intervention\Image\Laravel\Facades\Image::read($file);
            $image->cover(400, 400);

            \Storage::disk($disk)->put(
                $path,
                (string) $image->encode()
            );

            $validated['logo_path'] = $path;
        } elseif ($request->input('remove_logo')) {
            // Handle logo removal
            $disk = config('filesystems.default');

            if ($team->logo_path) {
                \Storage::disk($disk)->delete($team->logo_path);
            }

            $validated['logo_path'] = null;
        }

        $team = $this->teamService->updateTeam($team, $validated);

        return redirect()->route('teams.show', $team->id)
            ->with('success', '¡Equipo actualizado exitosamente!');
    }

    /**
     * Remove the specified team.
     */
    public function destroy(int $id)
    {
        $team = Team::findOrFail($id);
        $user = Auth::user();

        if (! $team->isCaptain($user->id)) {
            abort(403, 'Solo el capitán puede eliminar el equipo');
        }

        $this->teamService->deleteTeam($team);

        return redirect()->route('teams.index')
            ->with('success', '¡Equipo eliminado exitosamente!');
    }

    /**
     * Search for teams.
     */
    public function search(Request $request): Response
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'variant' => ['nullable', 'in:football_11,football_7,football_5,futsal'],
        ]);

        $teams = $this->teamService->searchTeams($validated);

        return Inertia::render('teams/search', [
            'teams' => $teams,
            'filters' => $validated,
        ]);
    }

    /**
     * Leave a team (self-remove).
     */
    public function leaveTeam(int $teamId)
    {
        $team = Team::findOrFail($teamId);
        $user = Auth::user();

        // Check if user is a member
        if (! $team->hasMember($user->id)) {
            return back()->with('error', 'No eres miembro de este equipo');
        }

        // Prevent captain from leaving without transferring captaincy
        if ($team->isCaptain($user->id)) {
            return back()->with('error', 'Debes transferir la capitanía antes de abandonar el equipo');
        }

        $this->teamService->removeMember($team, $user->id);

        return redirect()->route('teams.index')
            ->with('success', 'Has abandonado el equipo exitosamente');
    }

    /**
     * Remove a member from the team.
     */
    public function removeMember(Request $request, int $teamId, int $userId)
    {
        $team = Team::findOrFail($teamId);
        $user = Auth::user();

        if (! $team->isLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        // Prevent removing the captain
        if ($team->isCaptain($userId)) {
            return back()->with('error', 'No se puede eliminar al capitán. Transfiere la capitanía primero.');
        }

        $this->teamService->removeMember($team, $userId);

        return back()->with('success', '¡Miembro eliminado exitosamente!');
    }

    /**
     * Update a member's role.
     */
    public function updateMemberRole(Request $request, int $teamId, int $userId)
    {
        $team = Team::findOrFail($teamId);
        $user = Auth::user();

        if (! $team->isCaptain($user->id)) {
            abort(403, 'Solo el capitán puede actualizar roles de miembros');
        }

        $validated = $request->validate([
            'role' => ['required', 'in:player,co_captain'],
        ]);

        $this->teamService->updateMemberRole($team, $userId, $validated['role']);

        return back()->with('success', '¡Rol de miembro actualizado exitosamente!');
    }

    /**
     * Update a member's position.
     */
    public function updateMemberPosition(Request $request, int $teamId, int $userId)
    {
        $team = Team::findOrFail($teamId);
        $user = Auth::user();

        if (! $team->isLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        $validated = $request->validate([
            'position' => ['nullable', 'in:goalkeeper,defender,midfielder,forward'],
        ]);

        $this->teamService->updateMemberPosition($team, $userId, $validated['position']);

        return back()->with('success', '¡Posición de miembro actualizada exitosamente!');
    }

    /**
     * Transfer captaincy.
     */
    public function transferCaptaincy(Request $request, int $teamId)
    {
        $team = Team::findOrFail($teamId);
        $user = Auth::user();

        if (! $team->isCaptain($user->id)) {
            abort(403, 'Solo el capitán puede transferir la capitanía');
        }

        $validated = $request->validate([
            'new_captain_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        // Check if new captain is a member
        if (! $team->hasMember($validated['new_captain_id'])) {
            return back()->with('error', 'El nuevo capitán debe ser miembro del equipo');
        }

        $this->teamService->transferCaptaincy($team, $user->id, $validated['new_captain_id']);

        return back()->with('success', '¡Capitanía transferida exitosamente!');
    }
}
