<?php

namespace App\Http\Controllers;

use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

class TeamLogoController extends Controller
{
    /**
     * Upload a new logo for the specified team.
     */
    public function store(Request $request, int $teamId): RedirectResponse
    {
        $team = Team::findOrFail($teamId);

        // Authorize: only captains and co-captains can upload
        if (! $team->isLeader($request->user()->id)) {
            abort(403, 'No tienes permiso para subir el logo de este equipo.');
        }

        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'], // 2MB max
        ]);

        $disk = config('filesystems.default');

        // Delete old logo if exists
        if ($team->logo_path) {
            Storage::disk($disk)->delete($team->logo_path);
        }

        // Get the uploaded file
        $file = $request->file('logo');

        // Generate unique filename
        $filename = uniqid().'.'.$file->getClientOriginalExtension();
        $path = "logos/{$team->id}/{$filename}";

        // Resize and save the image
        $image = Image::read($file);
        $image->cover(400, 400); // Resize to 400x400

        // Save to storage
        Storage::disk($disk)->put(
            $path,
            (string) $image->encode()
        );

        // Update team record
        $team->update([
            'logo_path' => $path,
        ]);

        return back()->with('success', 'Logo del equipo actualizado exitosamente.');
    }

    /**
     * Delete the team's custom logo.
     */
    public function destroy(Request $request, int $teamId): RedirectResponse
    {
        $team = Team::findOrFail($teamId);

        // Authorize: only captains and co-captains can delete
        if (! $team->isLeader($request->user()->id)) {
            abort(403, 'No tienes permiso para eliminar el logo de este equipo.');
        }

        $disk = config('filesystems.default');

        if ($team->logo_path) {
            // Delete the file from storage
            Storage::disk($disk)->delete($team->logo_path);

            // Clear the logo path
            $team->update([
                'logo_path' => null,
            ]);
        }

        return back()->with('success', 'Logo del equipo eliminado exitosamente.');
    }
}
