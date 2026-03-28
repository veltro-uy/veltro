<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\Tournament;
use App\Models\TournamentTeam;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

final class TournamentRegistrationController extends Controller
{
    public function __construct(
        private readonly TournamentService $tournamentService
    ) {}

    /**
     * Register a team for a tournament.
     */
    public function register(Request $request, int $id)
    {
        $tournament = Tournament::findOrFail($id);

        $validated = $request->validate([
            'team_id' => ['required', 'integer', 'exists:teams,id'],
        ]);

        $team = Team::findOrFail($validated['team_id']);

        $this->authorize('register', [$tournament, $team]);

        try {
            $user = Auth::user();
            $registration = $this->tournamentService->registerTeam($tournament, $team, $user);

            $message = $tournament->visibility === 'public'
                ? 'Equipo registrado exitosamente'
                : 'Solicitud de registro enviada. Esperando aprobación del organizador.';

            return redirect()->route('tournaments.show', $tournament->id)
                ->with('success', $message);
        } catch (\RuntimeException|\InvalidArgumentException $e) {
            \Log::error('Tournament registration failed', [
                'tournament_id' => $tournament->id,
                'team_id' => $team->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'team_id' => [$e->getMessage()],
            ]);
        } catch (\Exception $e) {
            \Log::error('Unexpected tournament registration error', [
                'tournament_id' => $tournament->id,
                'team_id' => $team->id,
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', 'Ocurrió un error inesperado. Por favor, intenta de nuevo.');
        }
    }

    /**
     * Approve a team registration.
     */
    public function approve(int $id)
    {
        $registration = TournamentTeam::with('tournament')->findOrFail($id);

        $this->authorize('approveTeam', $registration->tournament);

        try {
            $this->tournamentService->approveTeam($registration);

            return back()->with('success', 'Equipo aprobado exitosamente');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Reject a team registration.
     */
    public function reject(int $id)
    {
        $registration = TournamentTeam::with('tournament')->findOrFail($id);

        $this->authorize('rejectTeam', $registration->tournament);

        try {
            $this->tournamentService->rejectTeam($registration);

            return back()->with('success', 'Equipo rechazado');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Withdraw a team registration.
     */
    public function withdraw(int $id)
    {
        $registration = TournamentTeam::with(['tournament', 'team.teamMembers'])->findOrFail($id);

        $user = Auth::user();

        // Check if user is a leader of the team
        if (! $registration->team->isLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        try {
            $this->tournamentService->withdrawTeam($registration);

            return back()->with('success', 'Registro retirado exitosamente');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
