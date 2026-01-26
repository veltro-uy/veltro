<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\FootballMatch;
use App\Models\Team;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AvailabilityReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

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
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $matchUrl = route('matches.show', $this->match->id);
        $opponent = $this->match->home_team_id === $this->team->id
            ? ($this->match->awayTeam ? $this->match->awayTeam->name : 'TBD')
            : $this->match->homeTeam->name;

        $scheduledDate = $this->match->scheduled_at->format('l, F j, Y');
        $scheduledTime = $this->match->scheduled_at->format('g:i A');

        return (new MailMessage)
            ->subject('Confirm Your Availability - Match in 48 Hours')
            ->greeting("Hello {$notifiable->name}!")
            ->line("Your team **{$this->team->name}** has a match in 48 hours.")
            ->line("**Opponent:** {$opponent}")
            ->line("**Date:** {$scheduledDate}")
            ->line("**Time:** {$scheduledTime}")
            ->line("**Location:** {$this->match->location}")
            ->line('Please confirm your availability so your team can plan accordingly.')
            ->action('Confirm Availability', $matchUrl)
            ->line('Thank you for helping your team stay organized!');
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $opponent = $this->match->home_team_id === $this->team->id
            ? ($this->match->awayTeam ? $this->match->awayTeam->name : 'TBD')
            : $this->match->homeTeam->name;

        return [
            'type' => 'availability_reminder',
            'title' => 'Confirm Your Availability',
            'message' => "Match against {$opponent} is in 48 hours",
            'action_url' => route('matches.show', $this->match->id),
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
