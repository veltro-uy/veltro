<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirect(): RedirectResponse
    {
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

            return redirect()->intended('/dashboard');
        } catch (\Exception $e) {
            return redirect('/login')->withErrors([
                'email' => 'Unable to login with Google. Please try again.',
            ]);
        }
    }
}
