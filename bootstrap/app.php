<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'require.password' => \App\Http\Middleware\RequirePassword::class,
            'onboarding' => \App\Http\Middleware\EnsureOnboardingCompleted::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Render branded Inertia error pages instead of Laravel's default
        // exception views. Tests are skipped so feature tests can assert raw
        // 4xx/5xx statuses. Server errors (500/503) keep Laravel's detailed
        // exception page while debugging (APP_DEBUG=true); client errors
        // (403/404) are always branded since they never carry a stack trace.
        $exceptions->respond(function (Response $response, \Throwable $exception, Request $request) {
            if (app()->environment('testing')) {
                return $response;
            }

            $status = $response->getStatusCode();

            // A stale CSRF token: bounce back rather than show a full error page.
            if ($status === 419) {
                return back()->with('error', 'La sesión expiró, intentá de nuevo.');
            }

            // Keep the detailed exception page for server errors while debugging.
            if (in_array($status, [500, 503], true) && config('app.debug')) {
                return $response;
            }

            if (in_array($status, [403, 404, 500, 503], true)) {
                return Inertia::render('errors/error', ['status' => $status])
                    ->toResponse($request)
                    ->setStatusCode($status);
            }

            return $response;
        });
    })->create();
