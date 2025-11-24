<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class FootballMatch extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'matches';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'home_team_id',
        'away_team_id',
        'variant',
        'scheduled_at',
        'location',
        'location_coords',
        'match_type',
        'status',
        'home_score',
        'away_score',
        'notes',
        'created_by',
        'confirmed_at',
        'started_at',
        'completed_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'home_score' => 'integer',
            'away_score' => 'integer',
        ];
    }

    /**
     * Get the home team.
     */
    public function homeTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'home_team_id');
    }

    /**
     * Get the away team.
     */
    public function awayTeam(): BelongsTo
    {
        return $this->belongsTo(Team::class, 'away_team_id');
    }

    /**
     * Get the user who created the match.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the match requests.
     */
    public function matchRequests(): HasMany
    {
        return $this->hasMany(MatchRequest::class, 'match_id');
    }

    /**
     * Get the pending match requests.
     */
    public function pendingRequests(): HasMany
    {
        return $this->hasMany(MatchRequest::class, 'match_id')->where('status', 'pending');
    }

    /**
     * Get the lineups for the match.
     */
    public function lineups(): HasMany
    {
        return $this->hasMany(MatchLineup::class, 'match_id');
    }

    /**
     * Get the events for the match.
     */
    public function events(): HasMany
    {
        return $this->hasMany(MatchEvent::class, 'match_id');
    }

    /**
     * Get the lineup for a specific team.
     */
    public function getTeamLineup(int $teamId): HasMany
    {
        return $this->lineups()->where('team_id', $teamId);
    }

    /**
     * Get the events for a specific team.
     */
    public function getTeamEvents(int $teamId): HasMany
    {
        return $this->events()->where('team_id', $teamId);
    }

    /**
     * Check if the match is available.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    /**
     * Check if the match is confirmed.
     */
    public function isConfirmed(): bool
    {
        return $this->status === 'confirmed';
    }

    /**
     * Check if the match is in progress.
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Check if the match is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the match is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Check if a user is a leader of either team.
     */
    public function isTeamLeader(int $userId): bool
    {
        $homeLeader = $this->homeTeam->isLeader($userId);
        $awayLeader = $this->away_team_id ? $this->awayTeam->isLeader($userId) : false;
        
        return $homeLeader || $awayLeader;
    }

    /**
     * Check if a user is a leader of the home team.
     */
    public function isHomeTeamLeader(int $userId): bool
    {
        return $this->homeTeam->isLeader($userId);
    }

    /**
     * Check if a user is a leader of the away team.
     */
    public function isAwayTeamLeader(int $userId): bool
    {
        return $this->away_team_id ? $this->awayTeam->isLeader($userId) : false;
    }

    /**
     * Check if the match has started.
     */
    public function hasStarted(): bool
    {
        return $this->started_at !== null;
    }

    /**
     * Get the minimum players required based on variant.
     */
    public function getMinimumPlayers(): int
    {
        return match ($this->variant) {
            'football_11' => 11,
            'football_7' => 7,
            'football_5' => 5,
            'futsal' => 5,
            default => 5,
        };
    }

    /**
     * Check if a team has enough players in lineup.
     */
    public function hasEnoughPlayers(int $teamId): bool
    {
        $lineupCount = $this->lineups()
            ->where('team_id', $teamId)
            ->where('is_starter', true)
            ->count();
            
        return $lineupCount >= $this->getMinimumPlayers();
    }

    /**
     * Get the winner team ID, or null if draw or not completed.
     */
    public function getWinnerTeamId(): ?int
    {
        if (!$this->isCompleted() || $this->home_score === null || $this->away_score === null) {
            return null;
        }

        if ($this->home_score > $this->away_score) {
            return $this->home_team_id;
        }

        if ($this->away_score > $this->home_score) {
            return $this->away_team_id;
        }

        return null; // Draw
    }

    /**
     * Check if the match is a draw.
     */
    public function isDraw(): bool
    {
        return $this->isCompleted() 
            && $this->home_score !== null 
            && $this->away_score !== null
            && $this->home_score === $this->away_score;
    }
}
