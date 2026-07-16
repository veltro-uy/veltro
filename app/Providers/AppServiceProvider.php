<?php

namespace App\Providers;

use App\Models\Tournament;
use App\Policies\TournamentPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Minishlink\WebPush\WebPush;
use NotificationChannels\WebPush\WebPushChannel;
use Psr\Log\LoggerInterface;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        Gate::policy(Tournament::class, TournamentPolicy::class);

        // Give the Web Push channel a WebPush client wired to Laravel's logger.
        // This overrides the package's default binding so the library's
        // "GMP/BCMath recommended" advisory is logged instead of raised via
        // trigger_error() — which Laravel's error handler would otherwise
        // escalate to a fatal ErrorException on hosts without those extensions.
        $this->app->when(WebPushChannel::class)
            ->needs(WebPush::class)
            ->give(fn ($app): WebPush => (new WebPush(
                $this->vapidAuth(),
                [],
                30,
                config('webpush.client_options', []),
                $app->make(LoggerInterface::class),
            ))
                ->setReuseVAPIDHeaders(true)
                ->setAutomaticPadding(config('webpush.automatic_padding')));
    }

    /**
     * Build the VAPID auth array for the WebPush client (mirrors the package's
     * own config resolution).
     *
     * @return array<string, mixed>
     */
    private function vapidAuth(): array
    {
        $vapid = config('webpush.vapid');

        if (empty($vapid['public_key']) || empty($vapid['private_key'])) {
            return [];
        }

        return [
            'VAPID' => [
                'subject' => $vapid['subject'] ?: url('/'),
                'publicKey' => $vapid['public_key'],
                'privateKey' => $vapid['private_key'],
            ],
        ];
    }
}
