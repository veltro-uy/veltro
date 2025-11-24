<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\JoinRequest;
use App\Models\Team;
use App\Services\TeamService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

final class JoinRequestController extends Controller
{
    public function __construct(
        private readonly TeamService $teamService
    ) {}

    /**
     * Create a join request.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'team_id' => ['required', 'integer', 'exists:teams,id'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        $user = Auth::user();
        $team = Team::findOrFail($validated['team_id']);

        // Check if user is already a member
        if ($team->hasMember($user->id)) {
            return back()->with('error', 'Ya eres miembro de este equipo');
        }

        // Check if user already has a pending request
        $existingRequest = JoinRequest::where('user_id', $user->id)
            ->where('team_id', $team->id)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            return back()->with('error', 'Ya tienes una solicitud pendiente para este equipo');
        }

        $this->teamService->createJoinRequest(
            $user->id,
            $team->id,
            $validated['message'] ?? null
        );

        return back()->with('success', '¡Solicitud de unión enviada exitosamente!');
    }

    /**
     * Accept a join request.
     */
    public function accept(int $id)
    {
        $joinRequest = JoinRequest::findOrFail($id);
        $user = Auth::user();

        if (!$joinRequest->team->isLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        if (!$joinRequest->isPending()) {
            return back()->with('error', 'Esta solicitud ya ha sido procesada');
        }

        $this->teamService->acceptJoinRequest($joinRequest, $user->id);

        return back()->with('success', '¡Solicitud de unión aceptada!');
    }

    /**
     * Reject a join request.
     */
    public function reject(int $id)
    {
        $joinRequest = JoinRequest::findOrFail($id);
        $user = Auth::user();

        if (!$joinRequest->team->isLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        if (!$joinRequest->isPending()) {
            return back()->with('error', 'Esta solicitud ya ha sido procesada');
        }

        $this->teamService->rejectJoinRequest($joinRequest, $user->id);

        return back()->with('success', '¡Solicitud de unión rechazada!');
    }

    /**
     * Cancel a join request.
     */
    public function cancel(int $id)
    {
        $joinRequest = JoinRequest::findOrFail($id);
        $user = Auth::user();

        if ($joinRequest->user_id !== $user->id) {
            abort(403, 'No autorizado');
        }

        if (!$joinRequest->isPending()) {
            return back()->with('error', 'Esta solicitud ya ha sido procesada');
        }

        $joinRequest->delete();

        return back()->with('success', '¡Solicitud de unión cancelada!');
    }

    /**
     * Get pending join requests for user's teams.
     */
    public function myRequests()
    {
        $user = Auth::user();
        $requests = $this->teamService->getPendingJoinRequestsForUser($user->id);

        return response()->json([
            'requests' => $requests,
        ]);
    }
}
