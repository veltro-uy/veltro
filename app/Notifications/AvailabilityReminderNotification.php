<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\FootballMatch;
use App\Models\Team;
use App\Notifications\Concerns\BuildsWebPush;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use NotificationChannels\WebPush\WebPushChannel;

class AvailabilityReminderNotification extends Notification implements ShouldQueue
{
    use BuildsWebPush, Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public FootballMatch $match,
        public Team $team
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database', 'broadcast', WebPushChannel::class];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $matchUrl = route('matches.show', $this->match);
        $opponent = $this->match->home_team_id === $this->team->id
            ? ($this->match->awayTeam ? $this->match->awayTeam->name : 'A definir')
            : $this->match->homeTeam->name;

        $scheduledDate = $this->match->scheduled_at->locale('es')->isoFormat('dddd D [de] MMMM [de] YYYY');
        $scheduledTime = $this->match->scheduled_at->format('H:i').' hs';

        return (new MailMessage)
            ->subject('Confirmá tu disponibilidad — Partido en 48 horas')
            ->greeting("¡Hola {$notifiable->name}!")
            ->line("Tu equipo **{$this->team->name}** tiene un partido en 48 horas.")
            ->line("**Rival:** {$opponent}")
            ->line("**Fecha:** {$scheduledDate}")
            ->line("**Hora:** {$scheduledTime}")
            ->line("**Lugar:** {$this->match->location}")
            ->line('Confirmá tu disponibilidad para que tu equipo pueda organizarse.')
            ->action('Confirmar disponibilidad', $matchUrl)
            ->line('¡Gracias por ayudar a tu equipo a estar organizado!');
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $opponent = $this->match->home_team_id === $this->team->id
            ? ($this->match->awayTeam ? $this->match->awayTeam->name : 'A definir')
            : $this->match->homeTeam->name;

        return [
            'type' => 'availability_reminder',
            'title' => 'Confirmá tu disponibilidad',
            'message' => "El partido contra {$opponent} es en 48 horas",
            'action_url' => route('matches.show', $this->match),
            'icon' => 'Clock',
            'related_model' => [
                'match_id' => $this->match->id,
                'team_id' => $this->team->id,
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
