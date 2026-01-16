<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MatchAvailability extends Model
{
    /**
     * The table associated with the model.
     */
    protected $table = 'match_availability';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'match_id',
        'user_id',
        'team_id',
        'status',
        'confirmed_at',
        'reminded_at',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'confirmed_at' => 'datetime',
        'reminded_at' => 'datetime',
    ];

    /**
     * Get the match for this availability.
     */
    public function match(): BelongsTo
    {
        return $this->belongsTo(FootballMatch::class, 'match_id');
    }

    /**
     * Get the user for this availability.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the team for this availability.
     */
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Scope to get available players.
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope to get maybe players.
     */
    public function scopeMaybe($query)
    {
        return $query->where('status', 'maybe');
    }

    /**
     * Scope to get unavailable players.
     */
    public function scopeUnavailable($query)
    {
        return $query->where('status', 'unavailable');
    }

    /**
     * Scope to get pending responses.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Check if the player is available.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    /**
     * Check if the player is maybe available.
     */
    public function isMaybe(): bool
    {
        return $this->status === 'maybe';
    }

    /**
     * Check if the player is unavailable.
     */
    public function isUnavailable(): bool
    {
        return $this->status === 'unavailable';
    }

    /**
     * Check if the player hasn't confirmed yet.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Mark as available.
     */
    public function markAvailable(): void
    {
        $this->update([
            'status' => 'available',
            'confirmed_at' => now(),
        ]);
    }

    /**
     * Mark as maybe.
     */
    public function markMaybe(): void
    {
        $this->update([
            'status' => 'maybe',
            'confirmed_at' => now(),
        ]);
    }

    /**
     * Mark as unavailable.
     */
    public function markUnavailable(): void
    {
        $this->update([
            'status' => 'unavailable',
            'confirmed_at' => now(),
        ]);
    }
}
