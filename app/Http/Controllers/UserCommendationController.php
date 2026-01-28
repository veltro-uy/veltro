<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserCommendation;
use App\Notifications\CommendationReceivedNotification;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class UserCommendationController extends Controller
{
    /**
     * Get commendation stats for a user.
     */
    public function index(User $user): JsonResponse
    {
        $response = [
            'stats' => $user->getCommendationStats(),
        ];

        // If user is authenticated, include which commendations they've given to this user
        if (Auth::check()) {
            $givenCommendations = UserCommendation::where('from_user_id', Auth::id())
                ->where('to_user_id', $user->id)
                ->pluck('category')
                ->toArray();

            $response['given_commendations'] = $givenCommendations;
        }

        return response()->json($response);
    }

    /**
     * Store a new commendation.
     */
    public function store(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'category' => ['required', Rule::in(['friendly', 'skilled', 'teamwork', 'leadership'])],
        ]);

        $authUser = Auth::user();

        // Prevent self-commendation
        if ($authUser->id === $user->id) {
            return response()->json([
                'message' => 'No puedes reconocerte a ti mismo.',
            ], 422);
        }

        // Check if users have played together
        if (! $authUser->hasPlayedWith($user->id)) {
            return response()->json([
                'message' => 'Solo puedes reconocer a jugadores con los que hayas jugado.',
            ], 422);
        }

        try {
            $commendation = UserCommendation::create([
                'from_user_id' => $authUser->id,
                'to_user_id' => $user->id,
                'category' => $validated['category'],
            ]);

            // Send notification
            $user->notify(new CommendationReceivedNotification($authUser, $validated['category']));

            return response()->json([
                'message' => 'Reconocimiento enviado exitosamente.',
                'commendation' => $commendation,
                'stats' => $user->getCommendationStats(),
            ], 201);
        } catch (QueryException $e) {
            // Handle duplicate commendation (unique constraint violation)
            if ($e->getCode() === '23000') {
                return response()->json([
                    'message' => 'Ya has dado este reconocimiento a este jugador.',
                ], 422);
            }

            throw $e;
        }
    }

    /**
     * Remove a commendation.
     */
    public function destroy(User $user, string $category): JsonResponse
    {
        $authUser = Auth::user();

        $commendation = UserCommendation::where('from_user_id', $authUser->id)
            ->where('to_user_id', $user->id)
            ->where('category', $category)
            ->first();

        if (! $commendation) {
            return response()->json([
                'message' => 'Reconocimiento no encontrado.',
            ], 404);
        }

        $commendation->delete();

        return response()->json([
            'message' => 'Reconocimiento eliminado exitosamente.',
            'stats' => $user->getCommendationStats(),
        ]);
    }
}
