<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommendationReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public User $fromUser,
        public string $category
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $categoryNames = [
            'friendly' => 'Amigable',
            'skilled' => 'Habilidoso',
            'teamwork' => 'Trabajo en equipo',
            'leadership' => 'Liderazgo',
        ];

        $categoryName = $categoryNames[$this->category] ?? $this->category;

        return (new MailMessage)
            ->subject('Nuevo Reconocimiento Recibido')
            ->greeting("¡Hola {$notifiable->name}!")
            ->line("{$this->fromUser->name} te ha reconocido por tu {$categoryName}.")
            ->line('Este reconocimiento se agregó a tu perfil para que otros jugadores puedan verlo.')
            ->action('Ver Mi Perfil', route('users.show', $notifiable->id))
            ->line('¡Gracias por ser un gran jugador!');
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $categoryNames = [
            'friendly' => 'Amigable',
            'skilled' => 'Habilidoso',
            'teamwork' => 'Trabajo en equipo',
            'leadership' => 'Liderazgo',
        ];

        $categoryName = $categoryNames[$this->category] ?? $this->category;

        return [
            'type' => 'commendation_received',
            'title' => "{$this->fromUser->name} te ha reconocido",
            'message' => "Has recibido un reconocimiento por {$categoryName}",
            'action_url' => route('users.show', $notifiable->id),
            'icon' => 'Award',
            'related_model' => [
                'from_user_id' => $this->fromUser->id,
                'category' => $this->category,
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
