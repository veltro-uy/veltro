<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Models\JoinRequest;
use App\Models\Team;
use App\Models\Tournament;
use App\Services\TeamService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __construct(
        private readonly TeamService $teamService
    ) {}

    public function index(Request $request): Response
    {
        $user = Auth::user();
        $teamIds = $user->activeTeams()->pluck('teams.id')->toArray();
        $hasTeams = count($teamIds) > 0;

        // Variants of the user's teams — used to surface relevant open matches.
        $userTeamVariants = $hasTeams
            ? Team::whereIn('id', $teamIds)->pluck('variant')->unique()->values()->all()
            : [];

        // User's teams with member count
        $myTeams = $user->activeTeams()
            ->withCount('teamMembers')
            ->limit(4)
            ->get(['teams.id', 'teams.name', 'teams.variant', 'teams.logo_url', 'teams.max_members']);

        // Next 3 upcoming matches across all user's teams
        $upcomingMatches = $hasTeams
            ? FootballMatch::with(['homeTeam', 'awayTeam'])
                ->where(function ($q) use ($teamIds) {
                    $q->whereIn('home_team_id', $teamIds)
                        ->orWhereIn('away_team_id', $teamIds);
                })
                ->whereIn('status', ['scheduled', 'confirmed'])
                ->where('scheduled_at', '>=', now())
                ->orderBy('scheduled_at')
                ->limit(3)
                ->get()
            : collect();

        // Open matches from other teams the user could challenge (matching variants).
        $openMatches = $hasTeams
            ? FootballMatch::with(['homeTeam', 'creator'])
                ->where('status', 'available')
                ->where('scheduled_at', '>', now())
                ->whereNotIn('home_team_id', $teamIds)
                ->when($userTeamVariants !== [], function ($query) use ($userTeamVariants) {
                    $query->whereIn('variant', $userTeamVariants);
                })
                ->orderBy('scheduled_at')
                ->limit(3)
                ->get()
            : collect();

        // User's own pending join requests (outgoing)
        $pendingJoinRequests = JoinRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->with('team:id,name,logo_url,variant')
            ->latest()
            ->get();

        // Pending requests to teams the user leads (incoming, actionable)
        $incomingJoinRequests = $hasTeams
            ? $this->teamService->getPendingJoinRequestsForUser($user->id)
            : collect();

        // A few teams to discover when the user's feed is quiet.
        $discoverTeams = Team::whereDoesntHave('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id);
        })
            ->withCount('teamMembers')
            ->latest()
            ->limit(3)
            ->get(['id', 'public_id', 'name', 'variant', 'logo_url', 'max_members']);

        // Has the user's team ever published a match? (drives the "next steps" checklist)
        $hasPublishedMatch = $hasTeams
            && FootballMatch::whereIn('home_team_id', $teamIds)->exists();

        // Active tournaments the user's teams are in
        $activeTournaments = $hasTeams
            ? Tournament::with(['organizer:id,name,avatar_path,google_avatar_url'])
                ->withCount(['tournamentTeams as registered_teams_count' => function ($query) {
                    $query->whereIn('status', ['pending', 'approved']);
                }])
                ->whereIn('status', ['registration_open', 'in_progress'])
                ->whereHas('tournamentTeams', function ($query) use ($teamIds) {
                    $query->whereIn('team_id', $teamIds)
                        ->whereIn('status', ['pending', 'approved']);
                })
                ->limit(3)
                ->get()
            : collect();

        return Inertia::render('dashboard', [
            'myTeams' => $myTeams,
            'upcomingMatches' => $upcomingMatches,
            'openMatches' => $openMatches,
            'pendingJoinRequests' => $pendingJoinRequests,
            'incomingJoinRequests' => $incomingJoinRequests,
            'discoverTeams' => $discoverTeams,
            'activeTournaments' => $activeTournaments,
            'hasTeams' => $hasTeams,
            'hasPublishedMatch' => $hasPublishedMatch,
        ]);
    }
}
