<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Models\MatchRequest;
use App\Models\Team;
use App\Rules\CleanText;
use App\Services\MatchService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class MatchController extends Controller
{
    public function __construct(
        private readonly MatchService $matchService
    ) {}

    /**
     * Display a listing of matches.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Get user's matches (from teams they lead)
        $myMatches = $this->matchService->getUserMatches($user->id);

        // Get user's team variants to filter available matches
        $userTeamVariants = Team::whereHas('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->pluck('variant')->unique()->toArray();

        // Get available matches with matching variants, filtered by search
        $search = trim((string) $request->string('search'));
        $availableMatches = $this->matchService->getAvailableMatches($userTeamVariants, $search);

        // Get teams where user is a leader (for creating matches)
        $teams = Team::whereHas('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->get(['id', 'name', 'variant']);

        return Inertia::render('matches/index', [
            'myMatches' => $myMatches,
            'availableMatches' => $availableMatches,
            'teams' => $teams,
            'hasTeams' => $user->teams()->exists(),
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Show the form for publishing a new match availability.
     */
    public function create(): Response
    {
        $user = Auth::user();

        // Teams where the user is a leader (can publish matches), incl. logo for the preview.
        $teams = Team::whereHas('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->get(['id', 'name', 'variant', 'logo_path']);

        return Inertia::render('matches/create', [
            'teams' => $teams,
        ]);
    }

    /**
     * Store a newly created match.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'team_id' => ['required', 'integer', 'exists:teams,id'],
            'scheduled_at' => ['required', 'date', 'after_or_equal:now'],
            'location' => ['required', 'string', 'max:255', new CleanText],
            'location_coords' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $user = Auth::user();
            $match = $this->matchService->createMatchAvailability(
                $user,
                (int) $validated['team_id'],
                $validated
            );

            return redirect()->route('matches.show', $match)
                ->with('success', '¡Disponibilidad de partido creada exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified match.
     */
    public function show(FootballMatch $match): Response
    {
        $match = $this->matchService->getMatchDetails($match->id);

        if (! $match) {
            abort(404);
        }

        $user = Auth::user();

        // Load team members (leaders only) for leader checks to avoid N+1 queries
        $match->loadMissing([
            'homeTeam.teamMembers' => function ($query) {
                $query->whereIn('role', ['captain', 'co_captain'])
                    ->where('status', 'active');
            },
        ]);

        if ($match->away_team_id) {
            $match->loadMissing([
                'awayTeam.teamMembers' => function ($query) {
                    $query->whereIn('role', ['captain', 'co_captain'])
                        ->where('status', 'active');
                },
            ]);
        }

        // Check if user is a leader of either team (uses loaded data)
        $isHomeLeader = $match->isHomeTeamLeader($user->id);
        $isAwayLeader = $match->away_team_id ? $match->isAwayTeamLeader($user->id) : false;
        $isLeader = $isHomeLeader || $isAwayLeader;

        // For tournament matches the organizer is the sole manager of results,
        // goals and lineups — reuse the existing leader flags so the frontend
        // gating shows management controls to the organizer only.
        if ($match->isTournamentMatch()) {
            $isOrganizer = (bool) $match->tournament?->isOrganizer($user->id);
            $isHomeLeader = $isOrganizer;
            $isAwayLeader = $isOrganizer;
            $isLeader = $isOrganizer;
        }

        // Get user's teams that can request this match
        $eligibleTeams = [];
        if ($match->isAvailable()) {
            $eligibleTeams = Team::where('variant', $match->variant)
                ->where('id', '!=', $match->home_team_id)
                ->whereHas('teamMembers', function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->whereIn('role', ['captain', 'co_captain'])
                        ->where('status', 'active');
                })
                ->with(['teamMembers.user'])
                ->get();
        }

        // Get lineups and events for the match (only load if needed)
        $homeLineup = collect();
        $awayLineup = collect();
        $events = collect();

        if ($match->isConfirmed() || $match->isInProgress() || $match->isCompleted()) {
            $homeLineup = $match->lineups()
                ->where('team_id', $match->home_team_id)
                ->with('user:id,public_id,name')
                ->get();

            if ($match->away_team_id) {
                $awayLineup = $match->lineups()
                    ->where('team_id', $match->away_team_id)
                    ->with('user:id,public_id,name')
                    ->get();
            }

            $events = $match->events()
                ->with(['user:id,name', 'team:id,name'])
                ->orderBy('minute')
                ->get();
        }

        // Determine the current user's team + their own availability status. This
        // drives the availability selector (kept eager); the full rosters + stats
        // and opposing-team leaders sit below the fold and are deferred below.
        $userTeamId = null;
        if ($isHomeLeader || $match->homeTeam->hasMember($user->id)) {
            $userTeamId = $match->home_team_id;
        } elseif ($match->away_team_id && ($isAwayLeader || $match->awayTeam->hasMember($user->id))) {
            $userTeamId = $match->away_team_id;
        }

        $userAvailability = $userTeamId
            ? $match->availability()
                ->where('team_id', $userTeamId)
                ->where('user_id', $user->id)
                ->first()
            : null;

        return Inertia::render('matches/show', [
            'match' => $match,
            'isHomeLeader' => $isHomeLeader,
            'isAwayLeader' => $isAwayLeader,
            'isLeader' => $isLeader,
            'eligibleTeams' => $eligibleTeams,
            'homeLineup' => $homeLineup,
            'awayLineup' => $awayLineup,
            'events' => $events,
            'opposingTeamLeaders' => Inertia::defer(fn () => $this->formatOpposingLeaders($match, $user->id, $isHomeLeader, $isAwayLeader), 'secondary'),
            'homeAvailability' => Inertia::defer(fn () => $this->loadAvailability($match)['home'], 'secondary'),
            'awayAvailability' => Inertia::defer(fn () => $this->loadAvailability($match)['away'], 'secondary'),
            'userAvailability' => $userAvailability,
            'userTeamId' => $userTeamId,
            'homeAvailabilityStats' => Inertia::defer(fn () => $this->loadAvailability($match)['homeStats'], 'secondary'),
            'awayAvailabilityStats' => Inertia::defer(fn () => $this->loadAvailability($match)['awayStats'], 'secondary'),
        ]);
    }

    /**
     * Resolve the opposing-team leaders (with phone numbers) to show the viewer,
     * formatted for Inertia. Deferred — only relevant once the match is confirmed.
     *
     * @return array<int, array<string, mixed>>
     */
    private function formatOpposingLeaders(FootballMatch $match, int $userId, bool $isHomeLeader, bool $isAwayLeader): array
    {
        $opposingLeaders = $this->matchService->getOpposingTeamLeaders($match, $userId);

        $leaders = collect();
        if ($isHomeLeader && $match->away_team_id) {
            $leaders = $opposingLeaders['away_leaders'];
        } elseif ($isAwayLeader) {
            $leaders = $opposingLeaders['home_leaders'];
        }

        return $leaders->map(function ($leader) {
            if (! $leader->relationLoaded('user')) {
                $leader->load('user:id,public_id,name,phone_number');
            }

            return [
                'id' => $leader->id,
                'user_id' => $leader->user_id,
                'role' => $leader->role,
                'user' => [
                    'id' => $leader->user->id,
                    'public_id' => $leader->user->public_id,
                    'name' => $leader->user->name,
                    'phone_number' => $leader->user->phone_number ?? null,
                ],
            ];
        })->values()->all();
    }

    /**
     * Load both teams' availability rosters + summary stats for the match.
     * Memoized with once() so the deferred prop closures share a single set of
     * queries when the 'secondary' group is resolved.
     *
     * @return array{home: \Illuminate\Support\Collection, away: \Illuminate\Support\Collection, homeStats: array<string, int>, awayStats: array<string, int>|null}
     */
    private function loadAvailability(FootballMatch $match): array
    {
        return once(function () use ($match) {
            $mapAvailability = fn ($availability) => [
                'id' => $availability->id,
                'match_id' => $availability->match_id,
                'user_id' => $availability->user_id,
                'team_id' => $availability->team_id,
                'status' => $availability->status,
                'confirmed_at' => $availability->confirmed_at,
                'reminded_at' => $availability->reminded_at,
                'created_at' => $availability->created_at,
                'updated_at' => $availability->updated_at,
                'user' => $availability->user ? [
                    'id' => $availability->user->id,
                    'name' => $availability->user->name,
                    'avatar_url' => $availability->user->avatar_url,
                ] : null,
            ];

            $home = $match->availability()
                ->where('team_id', $match->home_team_id)
                ->with('user')
                ->get()
                ->map($mapAvailability);

            $away = $match->away_team_id
                ? $match->availability()
                    ->where('team_id', $match->away_team_id)
                    ->with('user')
                    ->get()
                    ->map($mapAvailability)
                : collect();

            $minimum = $match->getMinimumPlayers();
            $statsFor = fn ($collection) => [
                'available' => $collection->where('status', 'available')->count(),
                'maybe' => $collection->where('status', 'maybe')->count(),
                'unavailable' => $collection->where('status', 'unavailable')->count(),
                'pending' => $collection->where('status', 'pending')->count(),
                'total' => $collection->count(),
                'minimum' => $minimum,
            ];

            return [
                'home' => $home,
                'away' => $away,
                'homeStats' => $statsFor($home),
                'awayStats' => $match->away_team_id ? $statsFor($away) : null,
            ];
        });
    }

    /**
     * Determine whether the user may reschedule/cancel a match. Tournament
     * matches are managed by the organizer; friendly matches by the home
     * team leader.
     */
    private function canSchedule(FootballMatch $match, int $userId): bool
    {
        if ($match->isTournamentMatch()) {
            return (bool) $match->tournament?->isOrganizer($userId);
        }

        return $match->isHomeTeamLeader($userId);
    }

    /**
     * Show the form for editing the match.
     */
    public function edit(FootballMatch $match): Response|RedirectResponse
    {
        $match->load(['homeTeam']);
        $user = Auth::user();

        if (! $this->canSchedule($match, $user->id)) {
            abort(403, 'No autorizado');
        }

        if ($match->hasStarted()) {
            return redirect()->route('matches.show', $match)
                ->with('error', 'No se puede editar un partido que ya ha comenzado');
        }

        return Inertia::render('matches/edit', [
            'match' => $match,
        ]);
    }

    /**
     * Update the specified match.
     */
    public function update(Request $request, int $id)
    {
        $match = FootballMatch::findOrFail($id);
        $user = Auth::user();

        if (! $this->canSchedule($match, $user->id)) {
            abort(403, 'No autorizado');
        }

        $validated = $request->validate([
            'scheduled_at' => ['required', 'date', 'after_or_equal:now'],
            'location' => ['required', 'string', 'max:255', new CleanText],
            'location_coords' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $match = $this->matchService->updateMatch($match, $validated);

            return redirect()->route('matches.show', $match)
                ->with('success', '¡Partido actualizado exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Cancel the match.
     */
    public function cancel(int $id)
    {
        $match = FootballMatch::findOrFail($id);
        $user = Auth::user();

        try {
            $this->matchService->cancelMatch($match, $user->id);

            return redirect()->route('matches.index')
                ->with('success', 'Partido cancelado exitosamente');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Create a match request.
     */
    public function createRequest(Request $request)
    {
        $validated = $request->validate([
            'match_id' => ['required', 'integer', 'exists:matches,id'],
            'team_id' => ['required', 'integer', 'exists:teams,id'],
            'message' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $user = Auth::user();
            $this->matchService->createMatchRequest(
                $user->id,
                (int) $validated['match_id'],
                (int) $validated['team_id'],
                $validated['message'] ?? null
            );

            return back()->with('success', '¡Solicitud de partido enviada exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Accept a match request.
     */
    public function acceptRequest(int $requestId)
    {
        $matchRequest = MatchRequest::findOrFail($requestId);
        $user = Auth::user();

        try {
            $this->matchService->acceptMatchRequest($matchRequest, $user->id);

            return back()->with('success', '¡Solicitud de partido aceptada! El partido está confirmado.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Reject a match request.
     */
    public function rejectRequest(int $requestId)
    {
        $matchRequest = MatchRequest::findOrFail($requestId);
        $user = Auth::user();

        try {
            $this->matchService->rejectMatchRequest($matchRequest, $user->id);

            return back()->with('success', 'Solicitud de partido rechazada');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Update match score.
     */
    public function updateScore(Request $request, int $id)
    {
        $match = FootballMatch::findOrFail($id);
        $user = Auth::user();

        if (! $match->canManage($user->id)) {
            abort(403, 'No autorizado');
        }

        // Check if match time has been reached
        if ($match->scheduled_at->isFuture()) {
            return back()->with('error', 'No se puede actualizar el marcador antes de que comience el partido');
        }

        $validated = $request->validate([
            'home_score' => ['required', 'integer', 'min:0'],
            'away_score' => ['required', 'integer', 'min:0'],
        ]);

        try {
            $this->matchService->updateScore(
                $match,
                $validated['home_score'],
                $validated['away_score'],
                $user->id
            );

            return back()->with('success', '¡Marcador actualizado exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Complete a match.
     */
    public function complete(int $id)
    {
        $match = FootballMatch::findOrFail($id);
        $user = Auth::user();

        if (! $match->canManage($user->id)) {
            abort(403, 'No autorizado');
        }

        // Check if match time has been reached (skip when no schedule is set,
        // e.g. league matches without a fixed kickoff time)
        if ($match->scheduled_at !== null && $match->scheduled_at->isFuture()) {
            return back()->with('error', 'No se puede completar el partido antes de que comience');
        }

        try {
            $this->matchService->completeMatch($match);

            return redirect()->route('matches.show', $match)
                ->with('success', '¡Partido completado exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
