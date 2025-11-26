<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\FootballMatch;
use App\Models\MatchRequest;
use App\Models\Team;
use App\Services\MatchService;
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

        // Get available matches with matching variants
        $availableMatches = $this->matchService->getAvailableMatches($userTeamVariants);

        return Inertia::render('matches/index', [
            'myMatches' => $myMatches,
            'availableMatches' => $availableMatches,
        ]);
    }

    /**
     * Show the form for creating a new match.
     */
    public function create(Request $request): Response
    {
        $user = Auth::user();

        // Get teams where user is a leader
        $teams = Team::whereHas('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->with(['teamMembers.user'])->get();

        if ($teams->isEmpty()) {
            return redirect()->route('matches.index')
                ->with('error', 'Debes ser líder de un equipo para crear partidos');
        }

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
            'location' => ['required', 'string', 'max:255'],
            'location_coords' => ['nullable', 'string', 'max:255'],
            'match_type' => ['required', 'in:friendly,competitive'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $user = Auth::user();
            $match = $this->matchService->createMatchAvailability(
                $user,
                (int) $validated['team_id'],
                $validated
            );

            return redirect()->route('matches.show', $match->id)
                ->with('success', '¡Disponibilidad de partido creada exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Display the specified match.
     */
    public function show(int $id): Response
    {
        $match = $this->matchService->getMatchDetails($id);

        if (!$match) {
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
                ->with('user:id,name')
                ->get();
            
            if ($match->away_team_id) {
                $awayLineup = $match->lineups()
                    ->where('team_id', $match->away_team_id)
                    ->with('user:id,name')
                    ->get();
            }

            $events = $match->events()
                ->with(['user:id,name', 'team:id,name'])
                ->orderBy('minute')
                ->get();
        }

        // Get opposing team leaders with phone numbers
        $opposingLeaders = $this->matchService->getOpposingTeamLeaders($match, $user->id);
        
        // Determine which leaders to show based on user's team
        $opposingTeamLeaders = collect();
        if ($isHomeLeader && $match->away_team_id) {
            // User is home leader, show away team leaders
            $opposingTeamLeaders = $opposingLeaders['away_leaders'];
        } elseif ($isAwayLeader) {
            // User is away leader, show home team leaders
            $opposingTeamLeaders = $opposingLeaders['home_leaders'];
        }

        // Format opposing team leaders for Inertia (ensure user relationship is loaded)
        $formattedOpposingLeaders = $opposingTeamLeaders->map(function ($leader) {
            // Ensure user is loaded
            if (!$leader->relationLoaded('user')) {
                $leader->load('user:id,name,phone_number');
            }

            return [
                'id' => $leader->id,
                'user_id' => $leader->user_id,
                'role' => $leader->role,
                'user' => [
                    'id' => $leader->user->id,
                    'name' => $leader->user->name,
                    'phone_number' => $leader->user->phone_number ?? null,
                ],
            ];
        });

        return Inertia::render('matches/show', [
            'match' => $match,
            'isHomeLeader' => $isHomeLeader,
            'isAwayLeader' => $isAwayLeader,
            'isLeader' => $isLeader,
            'eligibleTeams' => $eligibleTeams,
            'homeLineup' => $homeLineup,
            'awayLineup' => $awayLineup,
            'events' => $events,
            'opposingTeamLeaders' => $formattedOpposingLeaders,
        ]);
    }

    /**
     * Show the form for editing the match.
     */
    public function edit(int $id): Response
    {
        $match = FootballMatch::with(['homeTeam'])->findOrFail($id);
        $user = Auth::user();

        if (!$match->isHomeTeamLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        if ($match->hasStarted()) {
            return redirect()->route('matches.show', $match->id)
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

        if (!$match->isHomeTeamLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        $validated = $request->validate([
            'scheduled_at' => ['required', 'date'],
            'location' => ['required', 'string', 'max:255'],
            'location_coords' => ['nullable', 'string', 'max:255'],
            'match_type' => ['required', 'in:friendly,competitive'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        try {
            $match = $this->matchService->updateMatch($match, $validated);

            return redirect()->route('matches.show', $match->id)
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

        if (!$match->isTeamLeader($user->id)) {
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
                $validated['away_score']
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

        if (!$match->isTeamLeader($user->id)) {
            abort(403, 'No autorizado');
        }

        // Check if match time has been reached
        if ($match->scheduled_at->isFuture()) {
            return back()->with('error', 'No se puede completar el partido antes de que comience');
        }

        try {
            $this->matchService->completeMatch($match);

            return redirect()->route('matches.show', $match->id)
                ->with('success', '¡Partido completado exitosamente!');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }
}
