<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TeamMember extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'team_id',
        'role',
        'position',
        'joined_at',
        'status',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'joined_at' => 'datetime',
        ];
    }

    /**
     * Get the user.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the team.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Check if member is captain.
     */
    public function isCaptain(): bool
    {
        return $this->role === 'captain';
    }

    /**
     * Check if member is co-captain.
     */
    public function isCoCaptain(): bool
    {
        return $this->role === 'co_captain';
    }

    /**
     * Check if member is a leader (captain or co-captain).
     */
    public function isLeader(): bool
    {
        return in_array($this->role, ['captain', 'co_captain']);
    }

    /**
     * Check if member is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if member is a goalkeeper.
     */
    public function isGoalkeeper(): bool
    {
        return $this->position === 'goalkeeper';
    }

    /**
     * Check if member is a defender.
     */
    public function isDefender(): bool
    {
        return $this->position === 'defender';
    }

    /**
     * Check if member is a midfielder.
     */
    public function isMidfielder(): bool
    {
        return $this->position === 'midfielder';
    }

    /**
     * Check if member is a forward.
     */
    public function isForward(): bool
    {
        return $this->position === 'forward';
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
