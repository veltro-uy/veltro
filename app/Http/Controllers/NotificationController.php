<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get paginated notifications for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        $notifications = $user->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($notifications);
    }

    /**
     * Get unread notification count (for polling).
     */
    public function unreadCount(): JsonResponse
    {
        $user = Auth::user();

        $count = $user->unreadNotifications()->count();

        return response()->json(['count' => $count]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(string $id): JsonResponse
    {
        $user = Auth::user();

        $notification = $user->notifications()->findOrFail($id);

        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read']);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(): JsonResponse
    {
        $user = Auth::user();

        $user->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read']);
    }

    /**
     * Delete a single notification.
     */
    public function destroy(string $id): JsonResponse
    {
        $user = Auth::user();

        $notification = $user->notifications()->findOrFail($id);

        $notification->delete();

        return response()->json(['message' => 'Notification deleted']);
    }

    /**
     * Clear all read notifications.
     */
    public function clearRead(): JsonResponse
    {
        $user = Auth::user();

        $user->notifications()->whereNotNull('read_at')->delete();

        return response()->json(['message' => 'Read notifications cleared']);
    }
}
