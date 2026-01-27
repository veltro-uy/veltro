<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\TeamMember;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class TeamInvitationController extends Controller
{
    /**
     * Generate a new invitation
     */
    public function create(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'team_id' => ['required', 'integer', 'exists:teams,id'],
            'role' => ['required', 'in:player,co_captain'],
        ]);

        $team = Team::findOrFail($validated['team_id']);
        $user = Auth::user();

        // Check if user is a team leader
        $isLeader = $team->teamMembers()
            ->where('user_id', $user->id)
            ->whereIn('role', ['captain', 'co_captain'])
            ->where('status', 'active')
            ->exists();

        if (! $isLeader) {
            return response()->json([
                'message' => 'Solo los líderes del equipo pueden invitar miembros',
            ], 403);
        }

        $invitation = TeamInvitation::create([
            'team_id' => $team->id,
            'invited_by' => $user->id,
            'email' => null,
            'token' => TeamInvitation::generateToken(),
            'role' => $validated['role'],
            'expires_at' => now()->addDays(7),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Invitación creada exitosamente',
            'invitation' => [
                'token' => $invitation->token,
                'url' => $invitation->getInvitationUrl(),
            ],
        ], 201);
    }

    /**
     * Show invitation page
     */
    public function show(string $token): Response|RedirectResponse
    {
        $invitation = TeamInvitation::with(['team', 'inviter'])
            ->where('token', $token)
            ->firstOrFail();

        // Check and mark as expired if needed
        $invitation->checkAndMarkExpired();

        // If already accepted
        if ($invitation->status === 'accepted') {
            return redirect()->route('teams.show', $invitation->team_id)
                ->with('info', 'Esta invitación ya fue aceptada');
        }

        // If expired
        if ($invitation->status === 'expired' || $invitation->isExpired()) {
            return Inertia::render('teams/invitation-expired', [
                'team' => $invitation->team,
            ]);
        }

        // If revoked
        if ($invitation->status === 'revoked') {
            return Inertia::render('teams/invitation-revoked', [
                'team' => $invitation->team,
            ]);
        }

        // If user is logged in
        if (Auth::check()) {
            $user = Auth::user();

            // Check if already a member
            $isMember = $invitation->team->teamMembers()
                ->where('user_id', $user->id)
                ->exists();

            if ($isMember) {
                return redirect()->route('teams.show', $invitation->team_id)
                    ->with('info', 'Ya eres miembro de este equipo');
            }

            // Show accept invitation page
            return Inertia::render('teams/accept-invitation', [
                'invitation' => [
                    'id' => $invitation->id,
                    'token' => $invitation->token,
                    'role' => $invitation->role,
                    'expires_at' => $invitation->expires_at->toIso8601String(),
                ],
                'team' => $invitation->team,
                'inviter' => $invitation->inviter->only(['id', 'name']),
            ]);
        }

        // Redirect to register with invitation token
        return redirect()->route('register', ['invitation' => $token]);
    }

    /**
     * Accept invitation
     */
    public function accept(string $token): RedirectResponse
    {
        $invitation = TeamInvitation::where('token', $token)->firstOrFail();

        // Check and mark as expired if needed
        $invitation->checkAndMarkExpired();

        if (! $invitation->isValid()) {
            return back()->with('error', 'Esta invitación ya no es válida');
        }

        $user = Auth::user();

        // Check if already a member
        $isMember = $invitation->team->teamMembers()
            ->where('user_id', $user->id)
            ->exists();

        if ($isMember) {
            return redirect()->route('teams.show', $invitation->team_id)
                ->with('info', 'Ya eres miembro de este equipo');
        }

        // Check if team is at capacity
        if ($invitation->team->isFull()) {
            return back()->with('error', 'El equipo ha alcanzado su capacidad máxima y no puede aceptar más miembros');
        }

        DB::transaction(function () use ($invitation, $user) {
            // Add user to team
            TeamMember::create([
                'team_id' => $invitation->team_id,
                'user_id' => $user->id,
                'role' => $invitation->role,
                'status' => 'active',
            ]);

            // Mark invitation as accepted
            $invitation->update([
                'status' => 'accepted',
                'accepted_by' => $user->id,
                'accepted_at' => now(),
            ]);
        });

        return redirect()->route('teams.show', $invitation->team_id)
            ->with('success', '¡Te has unido al equipo exitosamente!');
    }

    /**
     * Revoke an invitation
     */
    public function revoke(int $id): RedirectResponse
    {
        $invitation = TeamInvitation::findOrFail($id);
        $user = Auth::user();

        // Check if user is a team leader
        $isLeader = $invitation->team->teamMembers()
            ->where('user_id', $user->id)
            ->whereIn('role', ['captain', 'co_captain'])
            ->where('status', 'active')
            ->exists();

        if (! $isLeader) {
            abort(403, 'No autorizado');
        }

        if ($invitation->status !== 'pending') {
            return back()->with('error', 'Solo se pueden revocar invitaciones pendientes');
        }

        $invitation->update(['status' => 'revoked']);

        return back()->with('success', 'Invitación revocada exitosamente');
    }

    /**
     * Get team invitations (for team leaders)
     */
    public function index(int $teamId)
    {
        $team = Team::findOrFail($teamId);
        $user = Auth::user();

        // Check if user is a team leader
        $isLeader = $team->teamMembers()
            ->where('user_id', $user->id)
            ->whereIn('role', ['captain', 'co_captain'])
            ->where('status', 'active')
            ->exists();

        if (! $isLeader) {
            abort(403, 'No autorizado');
        }

        $invitations = TeamInvitation::with(['inviter', 'acceptedBy'])
            ->where('team_id', $teamId)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($invitation) {
                $invitation->checkAndMarkExpired();

                return $invitation;
            });

        return response()->json($invitations);
    }
}
