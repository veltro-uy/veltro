<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Team;
use App\Models\Tournament;
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

        $query = Tournament::with(['organizer:id,name,avatar_path,google_avatar_url'])
            ->withCount(['tournamentTeams as registered_teams_count' => function ($query) {
                $query->whereIn('status', ['pending', 'approved']);
            }]);

        // Filter by status if provided
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by variant if provided
        if ($request->has('variant') && $request->variant !== 'all') {
            $query->where('variant', $request->variant);
        }

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

        $tournaments = $query->orderByDesc('created_at')->paginate(12);

        // Get user's teams where they are a leader (for creating tournaments)
        $userTeams = $user ? Team::whereHas('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->get(['id', 'name', 'variant']) : collect();

        return Inertia::render('tournaments/index', [
            'tournaments' => $tournaments,
            'userTeams' => $userTeams,
            'filters' => [
                'status' => $request->status ?? 'all',
                'variant' => $request->variant ?? 'all',
            ],
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

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'visibility' => ['required', 'in:public,invite_only'],
            'variant' => ['required', 'in:football_11,football_7,football_5,futsal'],
            'max_teams' => ['required', 'integer', 'in:4,8,16,32,64'],
            'min_teams' => ['required', 'integer', 'min:2'],
            'registration_deadline' => array_filter(['nullable', 'date', 'after:now', $request->starts_at ? 'before:starts_at' : null]),
            'starts_at' => array_filter(['nullable', 'date', 'after_or_equal:now', $request->ends_at ? 'before:ends_at' : null]),
            'ends_at' => array_filter(['nullable', 'date', $request->starts_at ? 'after:starts_at' : null]),
        ]);

        try {
            $user = Auth::user();
            unset($validated['logo']);
            $tournament = $this->tournamentService->createTournament($user, $validated);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                $this->uploadLogo($tournament, $request->file('logo'));
            }

            return redirect()->route('tournaments.show', $tournament->id)
                ->with('success', 'Torneo creado exitosamente');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified tournament.
     */
    public function show(int $id): Response
    {
        $tournament = Tournament::with([
            'organizer:id,name,avatar_path,google_avatar_url',
            'tournamentTeams.team.teamMembers.user',
            'tournamentTeams.registeredBy:id,name',
            'rounds.matches.homeTeam',
            'rounds.matches.awayTeam',
        ])
            ->withCount(['tournamentTeams as registered_teams_count' => function ($query) {
                $query->whereIn('status', ['pending', 'approved']);
            }])
            ->findOrFail($id);

        $this->authorize('view', $tournament);

        $user = Auth::user();

        // Get user's teams where they are a leader for registration
        $userTeams = $user ? Team::whereHas('teamMembers', function ($query) use ($user) {
            $query->where('user_id', $user->id)
                ->whereIn('role', ['captain', 'co_captain'])
                ->where('status', 'active');
        })->where('variant', $tournament->variant)->get(['id', 'name', 'variant']) : collect();

        // Check if user can perform various actions
        $canEdit = $user && $user->can('update', $tournament);
        $canDelete = $user && $user->can('delete', $tournament);
        // canStart combines the policy check (organizer + valid status) with the
        // model's runtime readiness check (enough approved teams, power of 2)
        // so the UI never offers a button that would fail server-side.
        $canStart = $user && $user->can('start', $tournament) && $tournament->canStart();
        $canCancel = $user && $user->can('cancel', $tournament);
        $canApprove = $user && $user->can('approveTeam', $tournament);

        return Inertia::render('tournaments/show', [
            'tournament' => $tournament,
            'userTeams' => $userTeams,
            'permissions' => [
                'canEdit' => $canEdit,
                'canDelete' => $canDelete,
                'canStart' => $canStart,
                'canCancel' => $canCancel,
                'canApprove' => $canApprove,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified tournament.
     */
    public function edit(int $id): Response
    {
        $tournament = Tournament::findOrFail($id);

        $this->authorize('update', $tournament);

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

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'visibility' => ['required', 'in:public,invite_only'],
            'variant' => ['required', 'in:football_11,football_7,football_5,futsal'],
            'max_teams' => ['required', 'integer', 'in:4,8,16,32,64'],
            'min_teams' => ['required', 'integer', 'min:2'],
            'registration_deadline' => array_filter(['nullable', 'date', $request->starts_at ? 'before:starts_at' : null]),
            'starts_at' => array_filter(['nullable', 'date', $request->ends_at ? 'before:ends_at' : null]),
            'ends_at' => array_filter(['nullable', 'date', $request->starts_at ? 'after:starts_at' : null]),
        ]);

        try {
            unset($validated['logo']);
            $tournament = $this->tournamentService->updateTournament($tournament, $validated);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                $this->uploadLogo($tournament, $request->file('logo'));
            } elseif ($request->boolean('remove_logo')) {
                $this->deleteLogo($tournament);
            }

            return redirect()->route('tournaments.show', $tournament->id)
                ->with('success', 'Torneo actualizado exitosamente');
        } catch (\RuntimeException|\InvalidArgumentException $e) {
            throw ValidationException::withMessages([
                'error' => $e->getMessage(),
            ]);
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

        return redirect()->route('tournaments.show', $tournament->id)
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

            return redirect()->route('tournaments.show', $tournament->id)
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

            return redirect()->route('tournaments.show', $tournament->id)
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
