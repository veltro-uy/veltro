<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class TournamentRound extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tournament_id',
        'round_number',
        'name',
        'starts_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
        ];
    }

    /**
     * Get the tournament.
     */
    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * Get the matches in this round.
     */
    public function matches(): HasMany
    {
        return $this->hasMany(FootballMatch::class, 'tournament_round_id')->orderBy('bracket_position');
    }

    /**
     * Check if this is the first round.
     */
    public function isFirstRound(): bool
    {
        return $this->round_number === 1;
    }

    /**
     * Check if this is the final round.
     */
    public function isFinal(): bool
    {
        $totalRounds = $this->tournament->rounds()->count();

        return $this->round_number === $totalRounds;
    }

    /**
     * Get all matches that are completed in this round.
     */
    public function completedMatches(): HasMany
    {
        return $this->matches()->where('status', 'completed');
    }

    /**
     * Check if all matches in this round are completed.
     */
    public function isCompleted(): bool
    {
        $totalMatches = $this->matches()->count();
        $completedMatches = $this->completedMatches()->count();

        return $totalMatches > 0 && $totalMatches === $completedMatches;
    }
}
