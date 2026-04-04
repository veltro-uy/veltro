<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Models\JoinRequest;
use App\Models\Tournament;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $teamIds = $user->teams()->pluck('teams.id')->toArray();
        $hasTeams = count($teamIds) > 0;

        // User's teams with member count
        $myTeams = $user->teams()
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

        // User's own pending join requests
        $pendingJoinRequests = JoinRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->with('team:id,name,logo_url,variant')
            ->latest()
            ->get();

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
            'pendingJoinRequests' => $pendingJoinRequests,
            'activeTournaments' => $activeTournaments,
            'hasTeams' => $hasTeams,
        ]);
    }
}
