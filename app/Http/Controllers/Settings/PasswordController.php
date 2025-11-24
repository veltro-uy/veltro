<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class PasswordController extends Controller
{
    /**
     * Show the user's password settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/password', [
            'hasPassword' => $request->user()->hasPassword(),
            'needsPasswordSetup' => session('needs_password_setup', false),
            'intendedUrl' => session('intended_url'),
        ]);
    }

    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse
    {
        $user = $request->user();
        $hasPassword = $user->hasPassword();

        // Conditionally require current password only if user already has one
        $validated = $request->validate([
            'current_password' => $hasPassword ? ['required', 'current_password'] : [],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user->update([
            'password' => $validated['password'],
        ]);

        // If this was a password setup (not update), redirect to intended URL
        $intendedUrl = session('intended_url');
        if (!$hasPassword && $intendedUrl) {
            session()->forget(['needs_password_setup', 'intended_url']);
            return redirect($intendedUrl);
        }

        return back();
    }
}
