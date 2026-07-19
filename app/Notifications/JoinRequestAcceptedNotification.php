<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\JoinRequest;
use App\Notifications\Concerns\BuildsWebPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

class JoinRequestAcceptedNotification extends Notification implements ShouldQueue
{
    use BuildsWebPush, Queueable;

    public function __construct(
        public JoinRequest $joinRequest
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $teamName = $this->joinRequest->team->name;

        return [
            'type' => 'join_request_accepted',
            'title' => "¡Te aceptaron en {$teamName}!",
            'message' => "Tu solicitud para unirte a {$teamName} fue aceptada",
            'action_url' => route('teams.show', $this->joinRequest->team),
            'icon' => 'CheckCircle',
            'related_model' => [
                'team_id' => $this->joinRequest->team_id,
            ],
            'created_at' => now()->toISOString(),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
