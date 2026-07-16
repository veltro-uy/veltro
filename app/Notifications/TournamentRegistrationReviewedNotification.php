<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\TournamentTeam;
use App\Notifications\Concerns\BuildsWebPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

class TournamentRegistrationReviewedNotification extends Notification implements ShouldQueue
{
    use BuildsWebPush, Queueable;

    public function __construct(
        public TournamentTeam $registration,
        public bool $approved
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', WebPushChannel::class];
    }

    public function toDatabase(object $notifiable): array
    {
        $tournamentName = $this->registration->tournament->name;

        $title = $this->approved
            ? "¡Aceptaron a tu equipo en {$tournamentName}!"
            : "Rechazaron tu inscripción en {$tournamentName}";

        $message = $this->approved
            ? "Tu inscripción en {$tournamentName} fue aprobada"
            : "Tu inscripción en {$tournamentName} fue rechazada";

        return [
            'type' => 'tournament_registration_reviewed',
            'title' => $title,
            'message' => $message,
            'action_url' => route('tournaments.show', $this->registration->tournament),
            'icon' => $this->approved ? 'Trophy' : 'XCircle',
            'related_model' => [
                'tournament_id' => $this->registration->tournament_id,
                'team_id' => $this->registration->team_id,
                'approved' => $this->approved,
            ],
            'created_at' => now()->toISOString(),
        ];
    }

    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
