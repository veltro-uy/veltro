<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\TeamInvitation;
use App\Models\User;
use App\Services\TeamInvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect(Request $request): RedirectResponse
    {
        // Preserve a team invitation token across the OAuth round-trip so the
        // user can be auto-joined to the team after signing up with Google.
        if ($request->filled('invitation')) {
            session(['invitation_token' => $request->string('invitation')->toString()]);
        }

        return Socialite::driver('google')->redirect();
    }

    /**
     * Handle the callback from Google OAuth.
     */
    public function callback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();

            // Find user by google_id or email
            $user = User::where('google_id', $googleUser->id)
                ->orWhere('email', $googleUser->email)
                ->first();

            if ($user) {
                // Update existing user with Google credentials
                $user->update([
                    'google_id' => $googleUser->id,
                    'google_token' => $googleUser->token,
                    'google_avatar_url' => $googleUser->avatar,
                ]);
            } else {
                // Create new user with Google data
                $user = User::create([
                    'name' => $googleUser->name,
                    'email' => $googleUser->email,
                    'google_id' => $googleUser->id,
                    'google_token' => $googleUser->token,
                    'google_avatar_url' => $googleUser->avatar,
                    'email_verified_at' => now(), // Google users are verified
                ]);
            }

            // Check if user has two-factor authentication enabled
            if ($user->two_factor_secret && $user->two_factor_confirmed_at) {
                // Store user ID in session for two-factor challenge
                session(['login.id' => $user->id]);

                return redirect()->route('two-factor.login');
            }

            // Log the user in directly if no 2FA
            Auth::login($user);

            $this->acceptPendingInvitation($user);

            return redirect()->intended('/teams');
        } catch (\Exception $e) {
            return redirect('/login')->withErrors([
                'email' => 'Unable to login with Google. Please try again.',
            ]);
        }
    }

    /**
     * Auto-join the user to a team if a valid invitation token was carried
     * through the OAuth flow, and queue the team page as the intended
     * destination so onboarding redirects there.
     */
    private function acceptPendingInvitation(User $user): void
    {
        $token = session()->pull('invitation_token');

        if (! $token) {
            return;
        }

        $invitation = TeamInvitation::where('token', $token)
            ->where('status', 'pending')
            ->first();

        if ($invitation && $invitation->isValid()) {
            app(TeamInvitationService::class)->acceptInvitation($invitation, $user);
            session(['url.intended' => route('teams.invitation.show', $invitation->token)]);
        }
    }
}
