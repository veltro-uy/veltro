<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MatchEvent extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'match_id',
        'team_id',
        'user_id',
        'event_type',
        'minute',
        'description',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'minute' => 'integer',
        ];
    }

    /**
     * Get the match.
     */
    public function match(): BelongsTo
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    /**
     * Get the team.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the user (player).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if event is a goal.
     */
    public function isGoal(): bool
    {
        return $this->event_type === 'goal';
    }

    /**
     * Check if event is an assist.
     */
    public function isAssist(): bool
    {
        return $this->event_type === 'assist';
    }

    /**
     * Check if event is a yellow card.
     */
    public function isYellowCard(): bool
    {
        return $this->event_type === 'yellow_card';
    }

    /**
     * Check if event is a red card.
     */
    public function isRedCard(): bool
    {
        return $this->event_type === 'red_card';
    }

    /**
     * Check if event is a substitution in.
     */
    public function isSubstitutionIn(): bool
    {
        return $this->event_type === 'substitution_in';
    }

    /**
     * Check if event is a substitution out.
     */
    public function isSubstitutionOut(): bool
    {
        return $this->event_type === 'substitution_out';
    }

    /**
     * Get the event type label.
     */
    public function getEventTypeLabel(): string
    {
        return match ($this->event_type) {
            'goal' => 'Goal',
            'assist' => 'Assist',
            'yellow_card' => 'Yellow Card',
            'red_card' => 'Red Card',
            'substitution_in' => 'Substitution In',
            'substitution_out' => 'Substitution Out',
            default => 'Unknown',
        };
    }
}
