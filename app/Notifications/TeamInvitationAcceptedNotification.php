<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class TeamInvitationAcceptedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public TeamInvitation $invitation,
        public User $acceptedBy
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toDatabase(object $notifiable): array
    {
        $teamName = $this->invitation->team->name;

        return [
            'type' => 'team_invitation_accepted',
            'title' => "{$this->acceptedBy->name} aceptó tu invitación",
            'message' => "{$this->acceptedBy->name} se unió a {$teamName}",
            'action_url' => route('teams.show', $this->invitation->team_id),
            'icon' => 'UserCheck',
            'related_model' => [
                'team_id' => $this->invitation->team_id,
                'invitation_id' => $this->invitation->id,
            ],
            'created_at' => now()->toISOString(),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
