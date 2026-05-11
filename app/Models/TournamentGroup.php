<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class TournamentGroup extends Model
{
    use HasFactory;

    /**
     * @var array<int, string>
     */
    protected $fillable = [
        'tournament_id',
        'name',
        'position',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
        ];
    }

    public function tournament(): BelongsTo
    {
        return $this->belongsTo(Tournament::class);
    }

    /**
     * Teams assigned to this group (via tournament_teams pivot).
     */
    public function teams(): HasMany
    {
        return $this->hasMany(TournamentTeam::class);
    }

    /**
     * Matches played within this group.
     */
    public function matches(): HasMany
    {
        return $this->hasMany(FootballMatch::class);
    }
}
