<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class AvatarController extends Controller
{
    /**
     * Upload a new avatar for the authenticated user.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'], // 2MB max
        ]);

        $user = $request->user();
        $disk = config('filesystems.default');

        // Delete old avatar if exists
        if ($user->avatar_path) {
            Storage::disk($disk)->delete($user->avatar_path);
        }

        // Get the uploaded file
        $file = $request->file('avatar');

        // Generate unique filename
        $filename = uniqid().'.'.$file->getClientOriginalExtension();
        $path = "avatars/{$user->id}/{$filename}";

        // Resize and save the image
        $image = Image::read($file);
        $image->cover(400, 400); // Resize to 400x400

        // Save to storage
        Storage::disk($disk)->put(
            $path,
            (string) $image->encode()
        );

        // Update user record
        $user->update([
            'avatar_path' => $path,
        ]);

        return back()->with('success', 'Avatar actualizado exitosamente.');
    }

    /**
     * Delete the user's custom avatar.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();
        $disk = config('filesystems.default');

        if ($user->avatar_path) {
            // Delete the file from storage
            Storage::disk($disk)->delete($user->avatar_path);

            // Clear the avatar path
            $user->update([
                'avatar_path' => null,
            ]);
        }

        return back()->with('success', 'Avatar eliminado exitosamente.');
    }
}
