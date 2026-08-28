<?php

namespace App\Http\Controllers;

use App\Http\Requests\OnboardingRequest;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Services\TeamInvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        private readonly TeamInvitationService $invitationService,
    ) {}

    /**
     * Show the onboarding page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $invitation = $this->pendingLeadershipInvitation($user);

        // If already completed, redirect to teams
        if ($user->hasCompletedOnboarding() && ! $invitation) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('onboarding/phone-number', [
            'user' => $user->only(['name', 'email', 'phone_number']),
            'phoneRequired' => (bool) $invitation,
        ]);
    }

    /**
     * Update the user's phone number and complete onboarding.
     */
    public function update(OnboardingRequest $request): RedirectResponse
    {
        $user = $request->user();
        $invitation = $this->pendingLeadershipInvitation($user);

        $user->update([
            'phone_number' => $request->validated('phone_number'),
            'onboarding_completed' => true,
        ]);

        if ($invitation) {
            session()->forget('invitation_token');

            if (! $this->invitationService->acceptInvitation($invitation, $user)) {
                return redirect()->route('teams.invitation.show', $invitation->token)
                    ->with('error', 'El equipo ha alcanzado su capacidad máxima y no puede aceptar más miembros');
            }

            session()->forget('url.intended');

            return redirect()->route('teams.show', $invitation->team)
                ->with('success', '¡Te has unido al equipo como co-capitán!');
        }

        return redirect()
            ->intended(route('teams.index'))
            ->with('success', '¡Bienvenido a Veltro!');
    }

    /**
     * Skip the onboarding process.
     */
    public function skip(Request $request): RedirectResponse
    {
        if ($this->pendingLeadershipInvitation($request->user())) {
            return back()->with('error', 'Debes agregar un número de teléfono para aceptar el rol de co-capitán.');
        }

        $request->user()->update([
            'onboarding_completed' => true,
        ]);

        return redirect()
            ->intended(route('teams.index'))
            ->with('success', '¡Bienvenido a Veltro! Puedes agregar tu número de teléfono más tarde en configuración.');
    }

    private function pendingLeadershipInvitation(User $user): ?TeamInvitation
    {
        $token = session('invitation_token');

        if (! $token) {
            return null;
        }

        $invitation = TeamInvitation::with('team')
            ->where('token', $token)
            ->where('role', 'co_captain')
            ->where('status', 'pending')
            ->where('expires_at', '>', now())
            ->first();

        if (! $invitation
            || (filled($invitation->email)
                && strcasecmp(trim($invitation->email), trim($user->email)) !== 0)
            || $invitation->team->isFull()
            || $invitation->team->teamMembers()->where('user_id', $user->id)->exists()) {
            session()->forget('invitation_token');

            return null;
        }

        return $invitation;
    }
}
