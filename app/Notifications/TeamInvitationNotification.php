<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TeamInvitation;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class TeamInvitationNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public TeamInvitation $invitation,
        public User $invitedBy
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $team = $this->invitation->team;

        return [
            'type' => 'team_invitation',
            'title' => 'Invitación a un equipo',
            'message' => "{$this->invitedBy->name} te invitó a unirte a {$team->name}",
            'action_url' => route('teams.invitation.show', $this->invitation->token),
            'icon' => 'Users',
            'related_model' => [
                'team_id' => $team->id,
                'invited_by_id' => $this->invitedBy->id,
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
