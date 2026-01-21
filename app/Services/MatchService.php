<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\FootballMatch;
use App\Models\MatchEvent;
use App\Models\MatchLineup;
use App\Models\MatchRequest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

final class MatchService
{
    /**
     * Create a new match availability.
     */
    public function createMatchAvailability(User $user, int $teamId, array $data): FootballMatch
    {
        $team = Team::findOrFail($teamId);

        // Verify user is a leader of the team
        if (! $team->isLeader($user->id)) {
            throw new \Exception('Only team leaders can create match availability');
        }

        return DB::transaction(function () use ($team, $user, $data) {
            return FootballMatch::create([
                'home_team_id' => $team->id,
                'away_team_id' => null,
                'variant' => $team->variant,
                'scheduled_at' => $data['scheduled_at'],
                'location' => $data['location'],
                'location_coords' => $data['location_coords'] ?? null,
                'match_type' => $data['match_type'] ?? 'friendly',
                'status' => 'available',
                'notes' => $data['notes'] ?? null,
                'created_by' => $user->id,
            ]);
        });
    }

    /**
     * Update a match.
     */
    public function updateMatch(FootballMatch $match, array $data): FootballMatch
    {
        // Only allow updating if match hasn't started
        if ($match->hasStarted()) {
            throw new \Exception('Cannot update a match that has already started');
        }

        $match->update($data);

        return $match->fresh();
    }

    /**
     * Cancel a match.
     */
    public function cancelMatch(FootballMatch $match, int $userId): bool
    {
        // Only home team leader can cancel before confirmation
        if (! $match->isHomeTeamLeader($userId)) {
            throw new \Exception('Only the home team leader can cancel this match');
        }

        if ($match->hasStarted()) {
            throw new \Exception('Cannot cancel a match that has already started');
        }

        return DB::transaction(function () use ($match) {
            // Delete all pending requests
            $match->matchRequests()->where('status', 'pending')->delete();

            // Update match status
            $match->update(['status' => 'cancelled']);

            return true;
        });
    }

    /**
     * Create a match request.
     */
    public function createMatchRequest(int $userId, int $matchId, int $teamId, ?string $message = null): MatchRequest
    {
        $match = FootballMatch::findOrFail($matchId);
        $team = Team::findOrFail($teamId);

        // Verify user is a leader of the requesting team
        if (! $team->isLeader($userId)) {
            throw new \Exception('Only team leaders can request matches');
        }

        // Verify match is available
        if (! $match->isAvailable()) {
            throw new \Exception('This match is no longer available');
        }

        // Verify team variant matches
        if ($team->variant !== $match->variant) {
            throw new \Exception('Team variant must match the match variant');
        }

        // Check if there's already a pending request from this team
        $existingRequest = MatchRequest::where('match_id', $matchId)
            ->where('requesting_team_id', $teamId)
            ->where('status', 'pending')
            ->first();

        if ($existingRequest) {
            throw new \Exception('You already have a pending request for this match');
        }

        return MatchRequest::create([
            'match_id' => $matchId,
            'requesting_team_id' => $teamId,
            'status' => 'pending',
            'message' => $message,
        ]);
    }

    /**
     * Accept a match request.
     */
    public function acceptMatchRequest(MatchRequest $matchRequest, int $reviewerId): FootballMatch
    {
        return DB::transaction(function () use ($matchRequest, $reviewerId) {
            $match = $matchRequest->match;

            // Verify reviewer is home team leader
            if (! $match->isHomeTeamLeader($reviewerId)) {
                throw new \Exception('Only the home team leader can accept requests');
            }

            // Verify match is still available
            if (! $match->isAvailable()) {
                throw new \Exception('This match is no longer available');
            }

            // Update the request
            $matchRequest->update([
                'status' => 'accepted',
                'reviewed_at' => now(),
                'reviewed_by' => $reviewerId,
            ]);

            // Update the match
            $match->update([
                'away_team_id' => $matchRequest->requesting_team_id,
                'status' => 'confirmed',
                'confirmed_at' => now(),
            ]);

            // Reject all other pending requests
            MatchRequest::where('match_id', $match->id)
                ->where('id', '!=', $matchRequest->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'rejected',
                    'reviewed_at' => now(),
                    'reviewed_by' => $reviewerId,
                ]);

            return $match->fresh(['homeTeam', 'awayTeam', 'creator']);
        });
    }

    /**
     * Reject a match request.
     */
    public function rejectMatchRequest(MatchRequest $matchRequest, int $reviewerId): MatchRequest
    {
        $match = $matchRequest->match;

        // Verify reviewer is home team leader
        if (! $match->isHomeTeamLeader($reviewerId)) {
            throw new \Exception('Only the home team leader can reject requests');
        }

        $matchRequest->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'reviewed_by' => $reviewerId,
        ]);

        return $matchRequest->fresh();
    }

    /**
     * Set lineup for a team in a match.
     */
    public function setLineup(FootballMatch $match, int $teamId, array $players): bool
    {
        // Verify match is confirmed
        if (! $match->isConfirmed() && ! $match->isInProgress()) {
            throw new \Exception('Can only set lineup for confirmed matches');
        }

        // Verify team is part of the match
        if ($match->home_team_id !== $teamId && $match->away_team_id !== $teamId) {
            throw new \Exception('Team is not part of this match');
        }

        return DB::transaction(function () use ($match, $teamId, $players) {
            // Delete existing lineup for this team
            MatchLineup::where('match_id', $match->id)
                ->where('team_id', $teamId)
                ->delete();

            // Create new lineup entries
            foreach ($players as $player) {
                MatchLineup::create([
                    'match_id' => $match->id,
                    'team_id' => $teamId,
                    'user_id' => $player['user_id'],
                    'position' => $player['position'] ?? null,
                    'is_starter' => $player['is_starter'] ?? true,
                    'is_substitute' => $player['is_substitute'] ?? false,
                    'minutes_played' => 0,
                ]);
            }

            return true;
        });
    }

    /**
     * Update match score.
     */
    public function updateScore(FootballMatch $match, int $homeScore, int $awayScore): FootballMatch
    {
        // Verify match is in progress or confirmed
        if (! $match->isInProgress() && ! $match->isConfirmed()) {
            throw new \Exception('Can only update score for in-progress or confirmed matches');
        }

        // Verify match time has been reached
        if ($match->scheduled_at->isFuture()) {
            throw new \Exception('Cannot update score before the match starts');
        }

        // If match was confirmed, change to in_progress
        $updates = [
            'home_score' => $homeScore,
            'away_score' => $awayScore,
        ];

        if ($match->isConfirmed()) {
            $updates['status'] = 'in_progress';
            $updates['started_at'] = now();
        }

        $match->update($updates);

        return $match->fresh();
    }

    /**
     * Record a match event.
     */
    public function recordEvent(FootballMatch $match, int $teamId, array $eventData): MatchEvent
    {
        // Verify match is in progress
        if (! $match->isInProgress()) {
            throw new \Exception('Can only record events for in-progress matches');
        }

        // Verify team is part of the match
        if ($match->home_team_id !== $teamId && $match->away_team_id !== $teamId) {
            throw new \Exception('Team is not part of this match');
        }

        return MatchEvent::create([
            'match_id' => $match->id,
            'team_id' => $teamId,
            'user_id' => $eventData['user_id'] ?? null,
            'event_type' => $eventData['event_type'],
            'minute' => $eventData['minute'] ?? null,
            'description' => $eventData['description'] ?? null,
        ]);
    }

    /**
     * Complete a match.
     */
    public function completeMatch(FootballMatch $match): FootballMatch
    {
        // Verify match is in progress
        if (! $match->isInProgress()) {
            throw new \Exception('Can only complete in-progress matches');
        }

        // Verify match time has been reached
        if ($match->scheduled_at->isFuture()) {
            throw new \Exception('Cannot complete match before it has started');
        }

        $match->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return $match->fresh();
    }

    /**
     * Get available matches for teams with specific variants.
     */
    public function getAvailableMatches(?array $variants = null): Collection
    {
        $query = FootballMatch::with(['homeTeam', 'creator'])
            ->where('status', 'available')
            ->where('scheduled_at', '>', now())
            ->orderBy('scheduled_at', 'asc');

        if ($variants) {
            $query->whereIn('variant', $variants);
        }

        return $query->get();
    }

    /**
     * Get matches for a specific team.
     */
    public function getTeamMatches(int $teamId, ?string $status = null): Collection
    {
        $query = FootballMatch::with(['homeTeam', 'awayTeam', 'creator'])
            ->where(function ($q) use ($teamId) {
                $q->where('home_team_id', $teamId)
                    ->orWhere('away_team_id', $teamId);
            })
            ->orderBy('scheduled_at', 'desc');

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get();
    }

    /**
     * Get matches for teams that a user leads.
     */
    public function getUserMatches(int $userId): Collection
    {
        // Get teams where user is a leader
        $teamIds = Team::whereHas('teamMembers', function ($query) use ($userId) {
            $query->where('user_id', $userId)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->pluck('id');

        return FootballMatch::with(['homeTeam', 'awayTeam', 'creator'])
            ->where(function ($q) use ($teamIds) {
                $q->whereIn('home_team_id', $teamIds)
                    ->orWhereIn('away_team_id', $teamIds);
            })
            ->orderBy('scheduled_at', 'desc')
            ->get();
    }

    /**
     * Get match details with all relationships.
     */
    public function getMatchDetails(int $matchId): ?FootballMatch
    {
        return FootballMatch::with([
            'homeTeam',
            'awayTeam',
            'creator',
            'matchRequests.requestingTeam',
        ])->find($matchId);
    }

    /**
     * Get opposing team leaders with phone numbers for a match.
     *
     * @return array{home_leaders: \Illuminate\Database\Eloquent\Collection, away_leaders: \Illuminate\Database\Eloquent\Collection}
     */
    public function getOpposingTeamLeaders(FootballMatch $match, int $userId): array
    {
        $homeLeaders = collect();
        $awayLeaders = collect();

        // Only return leaders if match is confirmed and user is a leader of one of the teams
        if (! $match->isConfirmed() || ! $match->isTeamLeader($userId)) {
            return [
                'home_leaders' => $homeLeaders,
                'away_leaders' => $awayLeaders,
            ];
        }

        // Get home team leaders efficiently - only load leaders with user data
        $homeLeaders = $match->homeTeam->getLeaders()
            ->with('user:id,name,phone_number')
            ->get();

        // Get away team leaders if away team exists
        if ($match->away_team_id) {
            $awayLeaders = $match->awayTeam->getLeaders()
                ->with('user:id,name,phone_number')
                ->get();
        }

        return [
            'home_leaders' => $homeLeaders,
            'away_leaders' => $awayLeaders,
        ];
    }

    /**
     * Get match statistics.
     */
    public function getMatchStatistics(int $matchId): array
    {
        $match = FootballMatch::with(['events', 'lineups'])->findOrFail($matchId);

        $homeGoals = $match->events()
            ->where('team_id', $match->home_team_id)
            ->where('event_type', 'goal')
            ->get();

        $awayGoals = $match->events()
            ->where('team_id', $match->away_team_id)
            ->where('event_type', 'goal')
            ->get();

        $homeCards = $match->events()
            ->where('team_id', $match->home_team_id)
            ->whereIn('event_type', ['yellow_card', 'red_card'])
            ->get();

        $awayCards = $match->events()
            ->where('team_id', $match->away_team_id)
            ->whereIn('event_type', ['yellow_card', 'red_card'])
            ->get();

        return [
            'home_goals' => $homeGoals,
            'away_goals' => $awayGoals,
            'home_cards' => $homeCards,
            'away_cards' => $awayCards,
            'home_lineup' => $match->lineups()->where('team_id', $match->home_team_id)->get(),
            'away_lineup' => $match->lineups()->where('team_id', $match->away_team_id)->get(),
        ];
    }

    /**
     * Delete a match event.
     */
    public function deleteEvent(int $eventId, int $userId): bool
    {
        $event = MatchEvent::findOrFail($eventId);
        $match = $event->match;

        // Verify user is a leader of the team
        if ($event->team_id === $match->home_team_id) {
            if (! $match->isHomeTeamLeader($userId)) {
                throw new \Exception('Only team leaders can delete events');
            }
        } else {
            if (! $match->isAwayTeamLeader($userId)) {
                throw new \Exception('Only team leaders can delete events');
            }
        }

        return $event->delete();
    }
}
