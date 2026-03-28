<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Tournament extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'logo_url',
        'logo_path',
        'organizer_id',
        'visibility',
        'status',
        'variant',
        'max_teams',
        'min_teams',
        'registration_deadline',
        'starts_at',
        'ends_at',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'logo_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'registration_deadline' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    /**
     * Get the tournament's logo URL.
     */
    public function getLogoUrlAttribute(): ?string
    {
        if ($this->logo_path) {
            $disk = config('filesystems.default');

            // For S3 and S3-compatible storage (Cloudflare R2), use full URL
            if ($disk !== 'public') {
                return \Storage::disk($disk)->url($this->logo_path);
            }

            // For local public disk, use asset helper
            return asset('storage/'.$this->logo_path);
        }

        return null;
    }

    /**
     * Get the organizer.
     */
    public function organizer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'organizer_id');
    }

    /**
     * Get the tournament teams (registrations).
     */
    public function tournamentTeams(): HasMany
    {
        return $this->hasMany(TournamentTeam::class);
    }

    /**
     * Get the approved tournament teams.
     */
    public function approvedTeams(): HasMany
    {
        return $this->hasMany(TournamentTeam::class)->where('status', 'approved');
    }

    /**
     * Get the pending tournament teams.
     */
    public function pendingTeams(): HasMany
    {
        return $this->hasMany(TournamentTeam::class)->where('status', 'pending');
    }

    /**
     * Get the teams through the tournament_teams pivot.
     */
    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class, 'tournament_teams')
            ->withPivot(['status', 'seed', 'registered_by', 'registered_at', 'approved_at'])
            ->withTimestamps();
    }

    /**
     * Get the tournament rounds.
     */
    public function rounds(): HasMany
    {
        return $this->hasMany(TournamentRound::class)->orderBy('round_number');
    }

    /**
     * Get the matches.
     */
    public function matches(): HasMany
    {
        return $this->hasMany(FootballMatch::class);
    }

    /**
     * Check if a user is the organizer.
     */
    public function isOrganizer(int $userId): bool
    {
        return $this->organizer_id === $userId;
    }

    /**
     * Check if registration is open.
     */
    public function isRegistrationOpen(): bool
    {
        if ($this->status !== 'registration_open' && $this->status !== 'draft') {
            return false;
        }

        if ($this->registration_deadline && now()->isAfter($this->registration_deadline)) {
            return false;
        }

        return true;
    }

    /**
     * Check if the tournament has space for more teams.
     */
    public function hasSpaceForTeams(): bool
    {
        $registeredCount = $this->tournamentTeams()
            ->whereIn('status', ['pending', 'approved'])
            ->count();

        return $registeredCount < $this->max_teams;
    }

    /**
     * Get the count of registered teams (pending + approved).
     */
    public function getRegisteredTeamsCount(): int
    {
        return $this->tournamentTeams()
            ->whereIn('status', ['pending', 'approved'])
            ->count();
    }

    /**
     * Get the count of approved teams.
     */
    public function getApprovedTeamsCount(): int
    {
        return $this->tournamentTeams()
            ->where('status', 'approved')
            ->count();
    }

    /**
     * Check if a team can register.
     */
    public function canRegister(int $teamId): bool
    {
        if (! $this->isRegistrationOpen()) {
            return false;
        }

        if (! $this->hasSpaceForTeams()) {
            return false;
        }

        // Check if team is already registered
        $existing = $this->tournamentTeams()
            ->where('team_id', $teamId)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        return ! $existing;
    }

    /**
     * Check if the tournament can start.
     */
    public function canStart(): bool
    {
        if ($this->status !== 'registration_open' && $this->status !== 'draft') {
            return false;
        }

        $approvedCount = $this->getApprovedTeamsCount();

        // Must have at least min_teams
        if ($approvedCount < $this->min_teams) {
            return false;
        }

        // Must be a power of 2
        return $this->isPowerOfTwo($approvedCount);
    }

    /**
     * Check if a number is a power of 2.
     */
    public function isPowerOfTwo(int $number): bool
    {
        return $number > 0 && ($number & ($number - 1)) === 0;
    }

    /**
     * Check if the tournament is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Check if the tournament is in registration_open status.
     */
    public function isRegistrationOpenStatus(): bool
    {
        return $this->status === 'registration_open';
    }

    /**
     * Check if the tournament is in progress.
     */
    public function isInProgress(): bool
    {
        return $this->status === 'in_progress';
    }

    /**
     * Check if the tournament is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Check if the tournament is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Check if the tournament can be edited.
     */
    public function canBeEdited(): bool
    {
        return in_array($this->status, ['draft', 'registration_open']);
    }

    /**
     * Check if the tournament can be deleted.
     */
    public function canBeDeleted(): bool
    {
        // Can only delete drafts with no registrations
        return $this->isDraft() && $this->getRegisteredTeamsCount() === 0;
    }
}
