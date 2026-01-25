<?php

namespace App\Http\Controllers;

use App\Http\Requests\OnboardingRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    /**
     * Show the onboarding page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        // If already completed, redirect to teams
        if ($user->hasCompletedOnboarding()) {
            return redirect()->route('teams.index');
        }

        return Inertia::render('onboarding/phone-number', [
            'user' => $user->only(['name', 'email', 'phone_number']),
        ]);
    }

    /**
     * Update the user's phone number and complete onboarding.
     */
    public function update(OnboardingRequest $request): RedirectResponse
    {
        $request->user()->update([
            'phone_number' => $request->validated('phone_number'),
            'onboarding_completed' => true,
        ]);

        return redirect()
            ->route('teams.index')
            ->with('success', '¡Bienvenido a Veltro!');
    }

    /**
     * Skip the onboarding process.
     */
    public function skip(Request $request): RedirectResponse
    {
        $request->user()->update([
            'onboarding_completed' => true,
        ]);

        return redirect()
            ->route('teams.index')
            ->with('success', '¡Bienvenido a Veltro! Puedes agregar tu número de teléfono más tarde en configuración.');
    }
}
