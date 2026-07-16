<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\FootballMatch;
use App\Models\MatchRequest;
use App\Models\Team;
use App\Notifications\Concerns\BuildsWebPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

class MatchRequestReceivedNotification extends Notification implements ShouldQueue
{
    use BuildsWebPush, Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public FootballMatch $match,
        public Team $requestingTeam,
        public MatchRequest $matchRequest
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
        return [
            'type' => 'match_request_received',
            'title' => 'Nueva solicitud de partido',
            'message' => "{$this->requestingTeam->name} quiere jugar tu partido",
            'action_url' => route('matches.show', $this->match->id),
            'icon' => 'Trophy',
            'related_model' => [
                'match_id' => $this->match->id,
                'team_id' => $this->requestingTeam->id,
                'match_request_id' => $this->matchRequest->id,
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
