<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOnboardingCompleted
{
    /**
     * Routes that should be exempt from the onboarding check.
     *
     * @var array<string>
     */
    protected array $except = [
        'onboarding.*',
        'logout',
        'verification.*',
        'password.*',
        'two-factor.*',
    ];

    /**
     * Handle an incoming request.
     *
     * Redirect users who haven't completed onboarding to the onboarding page.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Skip for guests
        if (! $user) {
            return $next($request);
        }

        // Skip for exempt routes
        if ($this->shouldSkip($request)) {
            return $next($request);
        }

        // Redirect to onboarding if not completed
        if (! $user->hasCompletedOnboarding()) {
            return redirect()->route('onboarding.show');
        }

        return $next($request);
    }

    /**
     * Determine if the request should skip the onboarding check.
     */
    protected function shouldSkip(Request $request): bool
    {
        foreach ($this->except as $pattern) {
            if ($request->routeIs($pattern)) {
                return true;
            }
        }

        return false;
    }
}
