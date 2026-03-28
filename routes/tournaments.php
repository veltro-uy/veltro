<?php

declare(strict_types=1);

use App\Http\Controllers\TournamentController;
use App\Http\Controllers\TournamentRegistrationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified', 'throttle:tournaments', 'onboarding'])->group(function () {
    // Tournaments
    Route::get('/tournaments', [TournamentController::class, 'index'])->name('tournaments.index');
    Route::get('/tournaments/create', [TournamentController::class, 'create'])->name('tournaments.create');
    Route::post('/tournaments', [TournamentController::class, 'store'])->name('tournaments.store');
    Route::get('/tournaments/{id}', [TournamentController::class, 'show'])->name('tournaments.show');
    Route::get('/tournaments/{id}/edit', [TournamentController::class, 'edit'])->name('tournaments.edit');
    Route::put('/tournaments/{id}', [TournamentController::class, 'update'])->name('tournaments.update');
    Route::delete('/tournaments/{id}', [TournamentController::class, 'destroy'])->name('tournaments.destroy');
    Route::post('/tournaments/{id}/open-registration', [TournamentController::class, 'openRegistration'])->name('tournaments.open-registration');
    Route::post('/tournaments/{id}/start', [TournamentController::class, 'start'])->name('tournaments.start');
    Route::post('/tournaments/{id}/cancel', [TournamentController::class, 'cancel'])->name('tournaments.cancel');

    // Tournament Registrations
    Route::post('/tournaments/{id}/register', [TournamentRegistrationController::class, 'register'])->name('tournaments.register');
    Route::post('/tournament-registrations/{id}/approve', [TournamentRegistrationController::class, 'approve'])->name('tournament-registrations.approve');
    Route::post('/tournament-registrations/{id}/reject', [TournamentRegistrationController::class, 'reject'])->name('tournament-registrations.reject');
    Route::delete('/tournament-registrations/{id}', [TournamentRegistrationController::class, 'withdraw'])->name('tournament-registrations.withdraw');
});
