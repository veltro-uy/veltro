<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\JoinRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class JoinRequestRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public JoinRequest $joinRequest
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $teamName = $this->joinRequest->team->name;

        return [
            'type' => 'join_request_rejected',
            'title' => 'Solicitud rechazada',
            'message' => "Tu solicitud para unirte a {$teamName} no fue aceptada",
            'action_url' => route('teams.index'),
            'icon' => 'XCircle',
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
