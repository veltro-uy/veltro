<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequirePassword
{
    /**
     * Handle an incoming request.
     *
     * Redirect OAuth users without passwords to set up a password
     * before accessing password-protected features like 2FA.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Check if the user has a password set
        if ($user && !$user->hasPassword()) {
            // Redirect to password settings with a flag indicating setup is needed
            return redirect()
                ->route('user-password.edit')
                ->with('needs_password_setup', true)
                ->with('intended_url', $request->url());
        }

        // If user has a password, proceed to password confirmation
        $passwordConfirmMiddleware = app(\Illuminate\Auth\Middleware\RequirePassword::class);

        return $passwordConfirmMiddleware->handle($request, $next);
    }
}

