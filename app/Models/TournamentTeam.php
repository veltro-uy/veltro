<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TournamentTeam extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tournament_id',
        'team_id',
        'status',
        'seed',
        'registered_by',
        'registered_at',
        'approved_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'registered_at' => 'datetime',
            'approved_at' => 'datetime',
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
     * Get the team.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Get the user who registered the team.
     */
    public function registeredBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'registered_by');
    }

    /**
     * Check if the registration is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if the registration is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Check if the registration is rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    /**
     * Check if the registration is withdrawn.
     */
    public function isWithdrawn(): bool
    {
        return $this->status === 'withdrawn';
    }

    /**
     * Check if the registration is active (pending or approved).
     */
    public function isActive(): bool
    {
        return in_array($this->status, ['pending', 'approved']);
    }
}
