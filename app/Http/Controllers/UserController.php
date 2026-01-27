<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    /**
     * Display user profile page.
     * Public endpoint - anyone can view profiles.
     */
    public function show(User $user): Response
    {
        // Load active teams with eager loading
        $user->load(['activeTeams' => function ($query) {
            $query->select('teams.id', 'teams.name', 'teams.variant', 'teams.logo_url', 'teams.logo_path')
                ->orderBy('teams.name');
        }]);

        $data = [
            'user' => $user,
            'statistics' => $user->getStatistics(),
            'teams' => $user->activeTeams,
            'commendation_stats' => $user->getCommendationStats(),
            'comments_count' => $user->profileComments()->count(),
        ];

        // Add can_commend flag if user is authenticated
        if (auth()->check()) {
            $authUser = auth()->user();
            $data['can_commend'] = $authUser->id !== $user->id && $authUser->hasPlayedWith($user->id);
            $data['is_own_profile'] = $authUser->id === $user->id;
        } else {
            $data['is_own_profile'] = false;
        }

        return Inertia::render('users/show', $data);
    }

    /**
     * Get user profile data as JSON (for API/AJAX requests).
     * Kept for backward compatibility with modal.
     */
    public function showApi(User $user): JsonResponse
    {
        // Load active teams with eager loading
        $user->load(['activeTeams' => function ($query) {
            $query->select('teams.id', 'teams.name', 'teams.variant', 'teams.logo_url')
                ->orderBy('teams.name');
        }]);

        $response = [
            'user' => $user,
            'statistics' => $user->getStatistics(),
            'teams' => $user->activeTeams,
            'commendation_stats' => $user->getCommendationStats(),
            'comments_count' => $user->profileComments()->count(),
        ];

        // Add can_commend flag if user is authenticated
        if (auth()->check()) {
            $authUser = auth()->user();
            $response['can_commend'] = $authUser->id !== $user->id && $authUser->hasPlayedWith($user->id);
        }

        return response()->json($response);
    }
}
