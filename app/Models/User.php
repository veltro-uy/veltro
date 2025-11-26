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
        'google_id',
        'google_token',
        'google_avatar_url',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'avatar_url',
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
        ];
    }

    /**
     * Determine if the user has a password set.
     */
    public function hasPassword(): bool
    {
        return !is_null($this->password);
    }

    /**
     * Get the user's avatar URL.
     */
    public function getAvatarUrlAttribute(): ?string
    {
        return $this->google_avatar_url;
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
}
