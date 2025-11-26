<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

final class Team extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'variant',
        'logo_url',
        'description',
        'created_by',
        'max_members',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'founded_date' => 'date',
            'require_approval' => 'boolean',
        ];
    }

    /**
     * Get the user who created the team.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the team members.
     */
    public function teamMembers(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    /**
     * Get the active team members.
     */
    public function activeMembers(): HasMany
    {
        return $this->hasMany(TeamMember::class)->where('status', 'active');
    }

    /**
     * Get the users through team members.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'team_members')
            ->withPivot(['role', 'status', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get the join requests for the team.
     */
    public function joinRequests(): HasMany
    {
        return $this->hasMany(JoinRequest::class);
    }

    /**
     * Get the pending join requests.
     */
    public function pendingJoinRequests(): HasMany
    {
        return $this->hasMany(JoinRequest::class)->where('status', 'pending');
    }

    /**
     * Get the team captain.
     */
    public function captain(): ?TeamMember
    {
        return $this->teamMembers()->where('role', 'captain')->first();
    }

    /**
     * Get the team co-captains.
     */
    public function coCaptains(): HasMany
    {
        return $this->teamMembers()->where('role', 'co_captain');
    }

    /**
     * Get all team leaders (captains and co-captains).
     */
    public function getLeaders(): HasMany
    {
        return $this->teamMembers()
            ->whereIn('role', ['captain', 'co_captain'])
            ->where('status', 'active')
            ->with('user');
    }

    /**
     * Check if user is a member of the team.
     */
    public function hasMember(int $userId): bool
    {
        return $this->teamMembers()
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Check if user is captain of the team.
     */
    public function isCaptain(int $userId): bool
    {
        return $this->teamMembers()
            ->where('user_id', $userId)
            ->where('role', 'captain')
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Check if user is captain or co-captain.
     */
    public function isLeader(int $userId): bool
    {
        return $this->teamMembers()
            ->where('user_id', $userId)
            ->whereIn('role', ['captain', 'co_captain'])
            ->where('status', 'active')
            ->exists();
    }

    /**
     * Get member count.
     */
    public function getMemberCount(): int
    {
        return $this->activeMembers()->count();
    }

    /**
     * Get the maximum number of members allowed based on variant.
     */
    public function getMaxMembers(): int
    {
        // Use custom max_members if set, otherwise use defaults based on variant
        if ($this->max_members !== null) {
            return $this->max_members;
        }

        return match ($this->variant) {
            'football_11' => 25,
            'football_7' => 15,
            'football_5' => 10,
            'futsal' => 12,
            default => 25,
        };
    }

    /**
     * Get the minimum number of members required based on variant.
     */
    public function getMinMembers(): int
    {
        return match ($this->variant) {
            'football_11' => 18,
            'football_7' => 12,
            'football_5' => 8,
            'futsal' => 8,
            default => 5,
        };
    }

    /**
     * Check if the team is at capacity.
     */
    public function isFull(): bool
    {
        return $this->getMemberCount() >= $this->getMaxMembers();
    }

    /**
     * Check if the team meets the minimum member requirement.
     */
    public function meetsMinimumMembers(): bool
    {
        return $this->getMemberCount() >= $this->getMinMembers();
    }

    /**
     * Get available spots in the team.
     */
    public function getAvailableSpots(): int
    {
        return max(0, $this->getMaxMembers() - $this->getMemberCount());
    }

    /**
     * Get capacity percentage.
     */
    public function getCapacityPercentage(): int
    {
        $max = $this->getMaxMembers();
        if ($max === 0) {
            return 0;
        }

        return (int) round(($this->getMemberCount() / $max) * 100);
    }

    /**
     * Get matches where this team is the home team.
     */
    public function homeMatches(): HasMany
    {
        return $this->hasMany(FootballMatch::class, 'home_team_id');
    }

    /**
     * Get matches where this team is the away team.
     */
    public function awayMatches(): HasMany
    {
        return $this->hasMany(FootballMatch::class, 'away_team_id');
    }
}
