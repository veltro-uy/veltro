<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class TeamInvitation extends Model
{
    protected $fillable = [
        'team_id',
        'invited_by',
        'email',
        'token',
        'role',
        'status',
        'expires_at',
        'accepted_by',
        'accepted_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'accepted_at' => 'datetime',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    public function acceptedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    /**
     * Generate a unique invitation token
     */
    public static function generateToken(): string
    {
        return Str::random(32);
    }

    /**
     * Check if invitation is valid
     */
    public function isValid(): bool
    {
        return $this->status === 'pending'
            && $this->expires_at->isFuture();
    }

    /**
     * Check if invitation is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Get the invitation URL
     */
    public function getInvitationUrl(): string
    {
        return url("/teams/invite/{$this->token}");
    }

    /**
     * Mark invitation as expired if past expiry date
     */
    public function checkAndMarkExpired(): void
    {
        if ($this->isExpired() && $this->status === 'pending') {
            $this->update(['status' => 'expired']);
        }
    }
}
