<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\ProfileComment;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class ProfileCommentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public User $commenter,
        public ProfileComment $comment
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
        $preview = Str::limit($this->comment->comment, 100);

        return (new MailMessage)
            ->subject('Nuevo Comentario en tu Perfil')
            ->greeting("¡Hola {$notifiable->name}!")
            ->line("{$this->commenter->name} ha comentado en tu perfil:")
            ->line("\"{$preview}\"")
            ->action('Ver Comentario', route('users.show', $notifiable->id))
            ->line('Gracias por ser parte de la comunidad Veltro.');
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $preview = Str::limit($this->comment->comment, 100);

        return [
            'type' => 'profile_comment',
            'title' => "{$this->commenter->name} comentó en tu perfil",
            'message' => $preview,
            'action_url' => route('users.show', $notifiable->id),
            'icon' => 'MessageCircle',
            'related_model' => [
                'comment_id' => $this->comment->id,
                'author_id' => $this->commenter->id,
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
