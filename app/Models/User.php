<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone_number',
        'bio',
        'location',
        'date_of_birth',
        'avatar_path',
        'google_id',
        'google_token',
        'google_avatar_url',
        'onboarding_completed',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'avatar_url',
        'age',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'date_of_birth' => 'date',
            'onboarding_completed' => 'boolean',
        ];
    }

    /**
     * Determine if the user has completed onboarding.
     */
    public function hasCompletedOnboarding(): bool
    {
        return $this->onboarding_completed ?? false;
    }

    /**
     * Determine if the user has a password set.
     */
    public function hasPassword(): bool
    {
        return ! is_null($this->password);
    }

    /**
     * Get the user's avatar URL.
     * Priority: custom avatar → Google avatar → null
     */
    public function getAvatarUrlAttribute(): ?string
    {
        if ($this->avatar_path) {
            $disk = config('filesystems.default');

            // For S3 and S3-compatible storage, use the full URL
            if ($disk !== 'public') {
                return \Storage::disk($disk)->url($this->avatar_path);
            }

            // For local public disk, use asset helper
            return asset('storage/'.$this->avatar_path);
        }

        return $this->google_avatar_url;
    }

    /**
     * Get the user's age from date of birth.
     */
    public function getAgeAttribute(): ?int
    {
        if (! $this->date_of_birth) {
            return null;
        }

        return $this->date_of_birth->age;
    }

    /**
     * Get the teams the user is a member of.
     */
    public function teams()
    {
        return $this->belongsToMany(Team::class, 'team_members')
            ->withPivot(['role', 'status', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get the user's active teams.
     */
    public function activeTeams()
    {
        return $this->belongsToMany(Team::class, 'team_members')
            ->wherePivot('status', 'active')
            ->withPivot(['role', 'status', 'joined_at'])
            ->withTimestamps();
    }

    /**
     * Get teams created by the user.
     */
    public function createdTeams()
    {
        return $this->hasMany(Team::class, 'created_by');
    }

    /**
     * Get the user's join requests.
     */
    public function joinRequests()
    {
        return $this->hasMany(JoinRequest::class);
    }

    /**
     * Get the user's pending join requests.
     */
    public function pendingJoinRequests()
    {
        return $this->hasMany(JoinRequest::class)->where('status', 'pending');
    }

    /**
     * Get the user's match availability records.
     */
    public function matchAvailability()
    {
        return $this->hasMany(MatchAvailability::class);
    }

    /**
     * Get user statistics for profile display.
     *
     * @return array<string, mixed>
     */
    public function getStatistics(): array
    {
        return [
            'teams_count' => $this->activeTeams()->count(),
            'matches_played' => $this->matchAvailability()
                ->where('status', '!=', 'pending')
                ->distinct('match_id')
                ->count('match_id'),
            'member_since' => $this->created_at->toIso8601String(),
        ];
    }

    /**
     * Get commendations received by the user.
     */
    public function commendationsReceived()
    {
        return $this->hasMany(UserCommendation::class, 'to_user_id');
    }

    /**
     * Get commendations given by the user.
     */
    public function commendationsGiven()
    {
        return $this->hasMany(UserCommendation::class, 'from_user_id');
    }

    /**
     * Get comments on this user's profile.
     */
    public function profileComments()
    {
        return $this->hasMany(ProfileComment::class, 'profile_user_id');
    }

    /**
     * Get comments written by this user.
     */
    public function writtenComments()
    {
        return $this->hasMany(ProfileComment::class, 'user_id');
    }

    /**
     * Get commendation statistics for the user.
     *
     * @return array<string, int>
     */
    public function getCommendationStats(): array
    {
        $commendations = $this->commendationsReceived()
            ->selectRaw('category, COUNT(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category');

        return [
            'friendly' => $commendations->get('friendly', 0),
            'skilled' => $commendations->get('skilled', 0),
            'teamwork' => $commendations->get('teamwork', 0),
            'leadership' => $commendations->get('leadership', 0),
            'total' => $commendations->sum(),
        ];
    }

    /**
     * Check if this user has played with another user.
     */
    public function hasPlayedWith(int $userId): bool
    {
        return MatchAvailability::where('user_id', $this->id)
            ->whereIn('match_id', function ($query) use ($userId) {
                $query->select('match_id')
                    ->from('match_availability')
                    ->where('user_id', $userId);
            })
            ->exists();
    }
}
