<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MatchLineup extends Model
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
        'position',
        'is_starter',
        'is_substitute',
        'minutes_played',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_starter' => 'boolean',
            'is_substitute' => 'boolean',
            'minutes_played' => 'integer',
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
     * Check if player is a starter.
     */
    public function isStarter(): bool
    {
        return $this->is_starter;
    }

    /**
     * Check if player is a substitute.
     */
    public function isSubstitute(): bool
    {
        return $this->is_substitute;
    }

    /**
     * Get the position label.
     */
    public function getPositionLabel(): ?string
    {
        return match ($this->position) {
            'goalkeeper' => 'Goalkeeper',
            'defender' => 'Defender',
            'midfielder' => 'Midfielder',
            'forward' => 'Forward',
            default => null,
        };
    }
}
