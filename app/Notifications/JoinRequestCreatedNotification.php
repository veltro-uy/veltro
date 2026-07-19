<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\JoinRequest;
use App\Notifications\Concerns\BuildsWebPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

class JoinRequestCreatedNotification extends Notification implements ShouldQueue
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
        $userName = $this->joinRequest->user->name;
        $teamName = $this->joinRequest->team->name;

        return [
            'type' => 'join_request_created',
            'title' => "Nueva solicitud para unirse a {$teamName}",
            'message' => "{$userName} quiere unirse a tu equipo",
            'action_url' => route('teams.show', $this->joinRequest->team),
            'icon' => 'UserPlus',
            'related_model' => [
                'team_id' => $this->joinRequest->team_id,
                'join_request_id' => $this->joinRequest->id,
            ],
            'created_at' => now()->toISOString(),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
