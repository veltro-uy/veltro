<?php

use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileCommentController;
use App\Http\Controllers\UserCommendationController;
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

// Public user profile page
Route::get('/jugadores/{user}', [UserController::class, 'show'])
    ->middleware('throttle:profile-view')
    ->name('users.show');

// API endpoint for modal/AJAX requests (kept for backward compatibility)
Route::get('/api/users/{user}', [UserController::class, 'showApi'])
    ->middleware('throttle:profile-view')
    ->name('users.show.api');

// Onboarding routes (must be outside 'onboarding' middleware to prevent redirect loops)
Route::middleware(['auth', 'verified', 'throttle:settings-write'])->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/onboarding', [OnboardingController::class, 'update'])->name('onboarding.update');
    Route::post('/onboarding/skip', [OnboardingController::class, 'skip'])->name('onboarding.skip');
});

// Commendations (public read, auth required for write)
Route::get('/api/users/{user}/commendations', [UserCommendationController::class, 'index'])
    ->middleware('throttle:profile-view')
    ->name('users.commendations.index');

Route::middleware(['auth', 'verified', 'throttle:settings-write'])->group(function () {
    Route::post('/api/users/{user}/commendations', [UserCommendationController::class, 'store'])
        ->name('users.commendations.store');
    Route::delete('/api/users/{user}/commendations/{category}', [UserCommendationController::class, 'destroy'])
        ->name('users.commendations.destroy');
});

// Profile comments (public read, auth required for write)
Route::get('/api/users/{user}/comments', [ProfileCommentController::class, 'index'])
    ->middleware('throttle:profile-view')
    ->name('users.comments.index');

Route::middleware(['auth', 'verified', 'throttle:settings-write'])->group(function () {
    Route::post('/api/users/{user}/comments', [ProfileCommentController::class, 'store'])
        ->name('users.comments.store');
    Route::delete('/api/comments/{comment}', [ProfileCommentController::class, 'destroy'])
        ->name('comments.destroy');
});

require __DIR__.'/settings.php';
require __DIR__.'/teams.php';
require __DIR__.'/matches.php';
require __DIR__.'/notifications.php';
