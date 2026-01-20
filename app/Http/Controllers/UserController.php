<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Get user profile data for modal display.
     * Public endpoint - anyone can view profiles.
     */
    public function show(User $user): JsonResponse
    {
        // Load active teams with eager loading
        $user->load(['activeTeams' => function ($query) {
            $query->select('teams.id', 'teams.name', 'teams.variant', 'teams.logo_url')
                ->orderBy('teams.name');
        }]);

        return response()->json([
            'user' => $user,
            'statistics' => $user->getStatistics(),
            'teams' => $user->activeTeams,
        ]);
    }
}
