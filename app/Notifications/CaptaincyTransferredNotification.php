<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\Team;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class CaptaincyTransferredNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Team $team
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        $teamName = $this->team->name;

        return [
            'type' => 'captaincy_transferred',
            'title' => "Ahora sos capitán de {$teamName}",
            'message' => "Te transfirieron la capitanía de {$teamName}",
            'action_url' => route('teams.show', $this->team->id),
            'icon' => 'Crown',
            'related_model' => [
                'team_id' => $this->team->id,
            ],
            'created_at' => now()->toISOString(),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
