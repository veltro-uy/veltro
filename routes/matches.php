<?php

declare(strict_types=1);

use App\Http\Controllers\MatchController;
use App\Http\Controllers\MatchEventController;
use App\Http\Controllers\MatchLineupController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'throttle:matches'])->group(function () {
    // Matches
    Route::get('/matches', [MatchController::class, 'index'])->name('matches.index');
    Route::get('/matches/create', [MatchController::class, 'create'])->name('matches.create');
    Route::post('/matches', [MatchController::class, 'store'])->name('matches.store');
    Route::get('/matches/{id}', [MatchController::class, 'show'])->name('matches.show');
    Route::get('/matches/{id}/edit', [MatchController::class, 'edit'])->name('matches.edit');
    Route::put('/matches/{id}', [MatchController::class, 'update'])->name('matches.update');
    Route::post('/matches/{id}/cancel', [MatchController::class, 'cancel'])->name('matches.cancel');
    Route::post('/matches/{id}/complete', [MatchController::class, 'complete'])->name('matches.complete');

    // Match Requests
    Route::post('/match-requests', [MatchController::class, 'createRequest'])->name('match-requests.create');
    Route::post('/match-requests/{id}/accept', [MatchController::class, 'acceptRequest'])->name('match-requests.accept');
    Route::post('/match-requests/{id}/reject', [MatchController::class, 'rejectRequest'])->name('match-requests.reject');

    // Match Lineups
    Route::get('/matches/{matchId}/lineup', [MatchLineupController::class, 'edit'])->name('matches.lineup.edit');
    Route::post('/matches/{matchId}/lineup', [MatchLineupController::class, 'update'])->name('matches.lineup.update');

    // Match Events
    Route::post('/match-events', [MatchEventController::class, 'store'])->name('match-events.store');
    Route::delete('/match-events/{eventId}', [MatchEventController::class, 'destroy'])->name('match-events.destroy');

    // Match Score
    Route::post('/matches/{id}/score', [MatchController::class, 'updateScore'])->name('matches.update-score');
});

