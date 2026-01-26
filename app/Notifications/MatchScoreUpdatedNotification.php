<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\FootballMatch;
use App\Models\Team;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class MatchScoreUpdatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public FootballMatch $match,
        public Team $updatingTeam
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the database representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $score = "{$this->match->home_team_score} - {$this->match->away_team_score}";

        return [
            'type' => 'match_score_updated',
            'title' => 'Match Score Updated',
            'message' => "{$this->updatingTeam->name} updated the score to {$score}",
            'action_url' => route('matches.show', $this->match->id),
            'icon' => 'Target',
            'related_model' => [
                'match_id' => $this->match->id,
                'team_id' => $this->updatingTeam->id,
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
