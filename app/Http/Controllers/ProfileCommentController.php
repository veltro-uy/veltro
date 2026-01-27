<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\ProfileComment;
use App\Models\User;
use App\Notifications\ProfileCommentNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ProfileCommentController extends Controller
{
    /**
     * Get paginated comments for a user's profile.
     */
    public function index(User $user): JsonResponse
    {
        $comments = ProfileComment::forProfile($user->id)
            ->with('author:id,name,avatar_path,google_avatar_url')
            ->paginate(20);

        return response()->json($comments);
    }

    /**
     * Store a new comment on a user's profile.
     */
    public function store(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:1000'],
        ], [
            'comment.required' => 'El comentario es obligatorio.',
            'comment.max' => 'El comentario no puede exceder los 1000 caracteres.',
        ]);

        $authUser = Auth::user();

        // Prevent commenting on own profile
        if ($authUser->id === $user->id) {
            return response()->json([
                'message' => 'No puedes comentar en tu propio perfil.',
            ], 422);
        }

        $comment = ProfileComment::create([
            'user_id' => $authUser->id,
            'profile_user_id' => $user->id,
            'comment' => $validated['comment'],
        ]);

        // Load author relationship
        $comment->load('author:id,name,avatar_path,google_avatar_url');

        // Send notification to profile owner
        $user->notify(new ProfileCommentNotification($authUser, $comment));

        return response()->json([
            'message' => 'Comentario publicado exitosamente.',
            'comment' => $comment,
        ], 201);
    }

    /**
     * Delete a comment.
     */
    public function destroy(ProfileComment $comment): JsonResponse
    {
        $authUser = Auth::user();

        // Check if user is comment author or profile owner
        if ($comment->user_id !== $authUser->id && $comment->profile_user_id !== $authUser->id) {
            return response()->json([
                'message' => 'No tienes permiso para eliminar este comentario.',
            ], 403);
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comentario eliminado exitosamente.',
        ]);
    }
}
