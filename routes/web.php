<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    // Redirect authenticated users to teams page
    if (auth()->check() && auth()->user()->hasVerifiedEmail()) {
        return redirect()->route('teams.index');
    }

    return Inertia::render('landing-page', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->middleware('throttle:public')->name('home');

Route::middleware('throttle:oauth')->group(function () {
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('google.callback');
});

require __DIR__.'/settings.php';
require __DIR__.'/teams.php';
require __DIR__.'/matches.php';
