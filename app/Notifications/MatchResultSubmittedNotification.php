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

final class MatchResultSubmittedNotification extends Notification implements ShouldQueue
{
    use BuildsWebPush, Queueable;

    public function __construct(
        public FootballMatch $match,
        public Team $submittingTeam,
    ) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    /** @return array<string, mixed> */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'match_result_submitted',
            'title' => 'Resultado por confirmar',
            'message' => "{$this->submittingTeam->name} envió el resultado {$this->match->home_score} - {$this->match->away_score}",
            'action_url' => route('matches.show', $this->match),
            'icon' => 'Trophy',
            'related_model' => [
                'match_id' => $this->match->id,
                'team_id' => $this->submittingTeam->id,
            ],
            'created_at' => now()->toISOString(),
        ];
    }

    /** @return array<string, mixed> */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
