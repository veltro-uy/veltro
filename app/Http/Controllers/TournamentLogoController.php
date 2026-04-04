<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Tournament;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Intervention\Image\Laravel\Facades\Image;

final class TournamentLogoController extends Controller
{
    /**
     * Upload a new logo for the specified tournament.
     */
    public function store(Request $request, int $tournamentId): RedirectResponse
    {
        $tournament = Tournament::findOrFail($tournamentId);

        // Only the organizer can upload the logo
        if (! $tournament->isOrganizer($request->user()->id)) {
            abort(403, 'No tienes permiso para subir la imagen de este torneo.');
        }

        $request->validate([
            'logo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $disk = config('filesystems.default');

        // Delete old logo if exists
        if ($tournament->logo_path) {
            Storage::disk($disk)->delete($tournament->logo_path);
        }

        $file = $request->file('logo');
        $filename = uniqid().'.'.$file->getClientOriginalExtension();
        $path = "tournament-logos/{$tournament->id}/{$filename}";

        // Resize and save the image
        $image = Image::read($file);
        $image->cover(400, 400);

        Storage::disk($disk)->put(
            $path,
            (string) $image->encode()
        );

        $tournament->update([
            'logo_path' => $path,
        ]);

        return back()->with('success', 'Imagen del torneo actualizada exitosamente.');
    }

    /**
     * Delete the tournament's logo.
     */
    public function destroy(Request $request, int $tournamentId): RedirectResponse
    {
        $tournament = Tournament::findOrFail($tournamentId);

        if (! $tournament->isOrganizer($request->user()->id)) {
            abort(403, 'No tienes permiso para eliminar la imagen de este torneo.');
        }

        $disk = config('filesystems.default');

        if ($tournament->logo_path) {
            Storage::disk($disk)->delete($tournament->logo_path);
            $tournament->update(['logo_path' => null]);
        }

        return back()->with('success', 'Imagen del torneo eliminada exitosamente.');
    }
}
