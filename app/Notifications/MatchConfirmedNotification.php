<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\FootballMatch;
use App\Notifications\Concerns\BuildsWebPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

class MatchConfirmedNotification extends Notification implements ShouldQueue
{
    use BuildsWebPush, Queueable;

    public function __construct(
        public FootballMatch $match
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $opponentName = $this->match->awayTeam?->name ?? 'el rival';

        return [
            'type' => 'match_confirmed',
            'title' => '¡Partido confirmado!',
            'message' => "Tu partido contra {$opponentName} quedó confirmado",
            'action_url' => route('matches.show', $this->match),
            'icon' => 'CalendarCheck',
            'related_model' => [
                'match_id' => $this->match->id,
                'team_id' => $this->match->away_team_id,
            ],
            'created_at' => now()->toISOString(),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
