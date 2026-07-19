<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\FootballMatch;
use App\Models\Team;
use App\Notifications\Concerns\BuildsWebPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

class MatchScoreUpdatedNotification extends Notification implements ShouldQueue
{
    use BuildsWebPush, Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public FootballMatch $match,
        public Team $updatingTeam
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $score = "{$this->match->home_team_score} - {$this->match->away_team_score}";

        return [
            'type' => 'match_score_updated',
            'title' => 'Resultado actualizado',
            'message' => "{$this->updatingTeam->name} actualizó el resultado a {$score}",
            'action_url' => route('matches.show', $this->match),
            'icon' => 'Target',
            'related_model' => [
                'match_id' => $this->match->id,
                'team_id' => $this->updatingTeam->id,
            ],
            'created_at' => now()->toISOString(),
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
