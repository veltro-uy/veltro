<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\Tournament;
use App\Rules\CleanText;
use App\Services\StandingsService;
use App\Services\TournamentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Intervention\Image\Laravel\Facades\Image;

final class TournamentController extends Controller
{
    public function __construct(
        private readonly TournamentService $tournamentService
    ) {}

    /**
     * Display a listing of tournaments.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $status = $request->string('status')->toString();
        $variant = $request->string('variant')->toString();
        $sort = $request->string('sort')->toString();

        $filters = [
            'status' => in_array($status, ['draft', 'registration_open', 'in_progress', 'completed', 'cancelled'], true) ? $status : 'all',
            'variant' => in_array($variant, ['football_11', 'football_7', 'football_5', 'futsal'], true) ? $variant : 'all',
            'search' => trim($request->string('search')->toString()),
            'sort' => in_array($sort, ['newest', 'start_soon', 'name'], true) ? $sort : 'newest',
        ];

        $query = Tournament::with(['organizer:id,name,avatar_path,google_avatar_url'])
            ->withCount(['tournamentTeams as registered_teams_count' => function ($query) {
                $query->whereIn('status', ['pending', 'approved']);
            }]);

        // Only show public tournaments or tournaments user is involved in
        $query->where(function ($q) use ($user) {
            $q->where('visibility', 'public');

            if ($user) {
                $userTeamIds = $user->teams()->pluck('teams.id')->toArray();
                $q->orWhere('organizer_id', $user->id)
                    ->orWhereHas('tournamentTeams', function ($query) use ($userTeamIds) {
                        $query->whereIn('team_id', $userTeamIds);
                    });
            }
        });

        if ($filters['variant'] !== 'all') {
            $query->where('variant', $filters['variant']);
        }

        if ($filters['search'] !== '') {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%")
                    ->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }

        $statusCounts = (clone $query)
            ->select('status')
            ->selectRaw('count(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        if ($filters['status'] !== 'all') {
            $query->where('status', $filters['status']);
        }

        match ($filters['sort']) {
            'start_soon' => $query->orderByRaw('starts_at is null, starts_at asc')->orderByDesc('created_at'),
            'name' => $query->orderBy('name')->orderByDesc('created_at'),
            default => $query->orderByDesc('created_at'),
        };

        $tournaments = $query->paginate(12)->withQueryString();

        // Get user's teams where they are a leader (for creating tournaments)
        $userTeams = $user ? Team::whereHas('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->get(['id', 'name', 'variant']) : collect();

        return Inertia::render('tournaments/index', [
            'tournaments' => $tournaments,
            'statusCounts' => [
                'all' => $statusCounts->sum(),
                'draft' => (int) ($statusCounts['draft'] ?? 0),
                'registration_open' => (int) ($statusCounts['registration_open'] ?? 0),
                'in_progress' => (int) ($statusCounts['in_progress'] ?? 0),
                'completed' => (int) ($statusCounts['completed'] ?? 0),
                'cancelled' => (int) ($statusCounts['cancelled'] ?? 0),
            ],
            'userTeams' => $userTeams,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new tournament.
     */
    public function create(): Response
    {
        $this->authorize('create', Tournament::class);

        return Inertia::render('tournaments/create');
    }

    /**
     * Store a newly created tournament.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Tournament::class);

        $validated = $request->validate($this->tournamentRules($request));

        try {
            $user = Auth::user();
            unset($validated['logo']);
            $tournament = $this->tournamentService->createTournament($user, $validated);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                $this->uploadLogo($tournament, $request->file('logo'));
            }

            return redirect()->route('tournaments.show', $tournament)
                ->with('success', 'Torneo creado exitosamente');
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified tournament.
     */
    public function show(Tournament $tournament): Response
    {
        $tournament = Tournament::with([
            'organizer:id,name,avatar_path,google_avatar_url',
            'tournamentTeams.team.teamMembers.user',
            'tournamentTeams.registeredBy:id,name',
            'rounds.matches.homeTeam',
            'rounds.matches.awayTeam',
            'groups.teams.team',
            'groups.matches',
        ])
            ->withCount(['tournamentTeams as registered_teams_count' => function ($query) {
                $query->whereIn('status', ['pending', 'approved']);
            }])
            ->findOrFail($tournament->id);

        $this->authorize('view', $tournament);

        $user = Auth::user();

        // Get user's teams where they are a leader for registration
        $userTeams = $user ? Team::whereHas('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->where('variant', $tournament->variant)->get(['id', 'name', 'variant']) : collect();

        // Check if user can perform various actions
        $canEdit = $user && $user->can('update', $tournament) && $tournament->canBeEdited();
        $canDelete = $user && $user->can('delete', $tournament);
        // canStart combines the policy check (organizer + valid status) with the
        // model's runtime readiness check (enough approved teams, power of 2)
        // so the UI never offers a button that would fail server-side.
        $canStart = $user && $user->can('start', $tournament) && $tournament->canStart();
        $canCancel = $user && $user->can('cancel', $tournament);
        $canApprove = $user && $user->can('approveTeam', $tournament);
        $canScheduleMatches = $user && $user->can('scheduleMatches', $tournament);

        // Standings/group tables sit below the fold and are the most expensive
        // computation on this page, so stream them in as deferred props while the
        // shell renders. Only one applies per format; the other stays an eager null.
        $isLeague = $tournament->isLeague();
        $isGroupStage = $tournament->isGroupStageKnockout();
        $canDrawGroups = $isGroupStage && $user && $user->can('drawGroups', $tournament);

        return Inertia::render('tournaments/show', [
            'tournament' => $tournament,
            'standings' => $isLeague
                ? Inertia::defer(fn () => $this->buildLeagueStandings($tournament), 'standings')
                : null,
            'groupStandings' => $isGroupStage
                ? Inertia::defer(fn () => $this->buildGroupStandings($tournament), 'standings')
                : null,
            'userTeams' => $userTeams,
            'permissions' => [
                'canEdit' => $canEdit,
                'canDelete' => $canDelete,
                'canStart' => $canStart,
                'canCancel' => $canCancel,
                'canApprove' => $canApprove,
                'canScheduleMatches' => $canScheduleMatches,
                'canDrawGroups' => $canDrawGroups,
            ],
        ]);
    }

    /**
     * Build the league standings rows enriched with team data for Inertia.
     *
     * @return array<int, array<string, mixed>>
     */
    private function buildLeagueStandings(Tournament $tournament): array
    {
        $teamIds = $tournament->approvedTeams()->pluck('team_id');
        $matches = $tournament->matches()->get();

        $rows = app(StandingsService::class)->compute($matches, $teamIds, $tournament->id);

        return $this->attachTeamsToRows($rows, $tournament);
    }

    /**
     * Build per-group standings keyed by tournament_group_id.
     *
     * @return array<int, array<int, array<string, mixed>>>
     */
    private function buildGroupStandings(Tournament $tournament): array
    {
        $service = app(StandingsService::class);
        $byGroup = [];

        foreach ($tournament->groups as $group) {
            $rows = $service->forGroup($group);
            $byGroup[$group->id] = $this->attachTeamsToRows($rows, $tournament);
        }

        return $byGroup;
    }

    /**
     * @param  array<int, \App\Support\StandingRow>  $rows
     * @return array<int, array<string, mixed>>
     */
    private function attachTeamsToRows(array $rows, Tournament $tournament): array
    {
        $teamMap = [];
        foreach ($tournament->tournamentTeams as $tt) {
            if ($tt->team) {
                $teamMap[$tt->team_id] = $tt->team;
            }
        }

        $out = [];
        foreach ($rows as $row) {
            $out[] = $row->toArray() + [
                'team' => $teamMap[$row->teamId] ?? null,
            ];
        }

        return $out;
    }

    /**
     * Build validation rules for tournament create/update, branching on format.
     *
     * @return array<string, array<int, mixed>>
     */
    private function tournamentRules(Request $request, bool $isUpdate = false): array
    {
        $format = $request->input('format', 'single_elimination');

        $rules = [
            'name' => ['required', 'string', 'max:255', new CleanText],
            'description' => ['nullable', 'string', 'max:5000'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'visibility' => ['required', 'in:public,invite_only'],
            'variant' => ['required', 'in:football_11,football_7,football_5,futsal'],
            'format' => ['nullable', 'in:single_elimination,league,group_stage_knockout'],
            'min_teams' => ['required', 'integer', 'min:2'],
            'registration_deadline' => array_filter([
                'nullable', 'date',
                $isUpdate ? null : 'after:now',
                $request->starts_at ? 'before:starts_at' : null,
            ]),
            'starts_at' => array_filter([
                'nullable', 'date',
                $isUpdate ? null : 'after_or_equal:now',
                $request->ends_at ? 'before:ends_at' : null,
            ]),
            'ends_at' => array_filter([
                'nullable', 'date',
                $request->starts_at ? 'after:starts_at' : null,
            ]),
        ];

        if ($format === 'group_stage_knockout') {
            $rules['group_count'] = ['required', 'integer', 'in:2,4,8,16'];
            $rules['group_size'] = ['required', 'integer', 'min:2', 'max:16'];
            // max_teams is derived from group_count × group_size in the service.
            $rules['max_teams'] = ['nullable', 'integer'];
        } elseif ($format === 'league') {
            $rules['max_teams'] = ['required', 'integer', 'min:2', 'max:64'];
        } else {
            $rules['max_teams'] = ['required', 'integer', 'in:4,8,16,32,64'];
        }

        return $rules;
    }

    /**
     * Show the form for editing the specified tournament.
     */
    public function edit(Tournament $tournament): Response|\Illuminate\Http\RedirectResponse
    {
        $this->authorize('update', $tournament);

        if (! $tournament->canBeEdited()) {
            return redirect()
                ->route('tournaments.show', $tournament)
                ->with('error', 'Este torneo ya no se puede editar.');
        }

        return Inertia::render('tournaments/edit', [
            'tournament' => $tournament,
        ]);
    }

    /**
     * Update the specified tournament.
     */
    public function update(Request $request, int $id)
    {
        $tournament = Tournament::findOrFail($id);

        $this->authorize('update', $tournament);

        $validated = $request->validate($this->tournamentRules($request, isUpdate: true));

        try {
            unset($validated['logo']);
            $tournament = $this->tournamentService->updateTournament($tournament, $validated);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                $this->uploadLogo($tournament, $request->file('logo'));
            } elseif ($request->boolean('remove_logo')) {
                $this->deleteLogo($tournament);
            }

            return redirect()->route('tournaments.show', $tournament)
                ->with('success', 'Torneo actualizado exitosamente');
        } catch (\RuntimeException|\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    /**
     * Remove the specified tournament.
     */
    public function destroy(int $id)
    {
        $tournament = Tournament::findOrFail($id);

        $this->authorize('delete', $tournament);

        try {
            $this->tournamentService->deleteTournament($tournament);

            return redirect()->route('tournaments.index')
                ->with('success', 'Torneo eliminado exitosamente');
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Open tournament registration.
     */
    public function openRegistration(int $id)
    {
        $tournament = Tournament::findOrFail($id);

        $this->authorize('update', $tournament);

        if ($tournament->status !== 'draft') {
            return back()->with('error', 'Solo se puede abrir la inscripción de torneos en borrador');
        }

        $tournament->update(['status' => 'registration_open']);

        return redirect()->route('tournaments.show', $tournament)
            ->with('success', 'Inscripción abierta. Los equipos ahora pueden registrarse.');
    }

    /**
     * Start the tournament and generate bracket.
     */
    public function start(int $id)
    {
        $tournament = Tournament::findOrFail($id);

        $this->authorize('start', $tournament);

        try {
            $this->tournamentService->startTournament($tournament);

            return redirect()->route('tournaments.show', $tournament)
                ->with('success', 'Torneo iniciado exitosamente. Se ha generado el bracket.');
        } catch (\RuntimeException|\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Cancel the tournament.
     */
    public function cancel(int $id)
    {
        $tournament = Tournament::findOrFail($id);

        $this->authorize('cancel', $tournament);

        try {
            $this->tournamentService->cancelTournament($tournament);

            return redirect()->route('tournaments.show', $tournament)
                ->with('success', 'Torneo cancelado');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Upload a logo for a tournament.
     */
    private function uploadLogo(Tournament $tournament, \Illuminate\Http\UploadedFile $file): void
    {
        $disk = config('filesystems.default');

        if ($tournament->logo_path) {
            Storage::disk($disk)->delete($tournament->logo_path);
        }

        $filename = uniqid().'.'.$file->getClientOriginalExtension();
        $path = "tournament-logos/{$tournament->id}/{$filename}";

        $image = Image::read($file);
        $image->cover(400, 400);

        Storage::disk($disk)->put($path, (string) $image->encode());

        $tournament->update(['logo_path' => $path]);
    }

    /**
     * Delete a tournament's logo.
     */
    private function deleteLogo(Tournament $tournament): void
    {
        $disk = config('filesystems.default');

        if ($tournament->logo_path) {
            Storage::disk($disk)->delete($tournament->logo_path);
            $tournament->update(['logo_path' => null]);
        }
    }
}
