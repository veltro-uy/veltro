<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\UserController;
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

// Public user profile endpoint
Route::get('/api/users/{user}', [UserController::class, 'show'])
    ->middleware('throttle:profile-view')
    ->name('users.show');

require __DIR__.'/settings.php';
require __DIR__.'/teams.php';
require __DIR__.'/matches.php';
