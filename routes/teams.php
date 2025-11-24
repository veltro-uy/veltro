<?php

declare(strict_types=1);

use App\Http\Controllers\JoinRequestController;
use App\Http\Controllers\TeamController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    // Teams
    Route::get('/teams', [TeamController::class, 'index'])->name('teams.index');
    Route::get('/teams/create', [TeamController::class, 'create'])->name('teams.create');
    Route::post('/teams', [TeamController::class, 'store'])->name('teams.store');
    Route::get('/teams/search', [TeamController::class, 'search'])->name('teams.search');
    Route::get('/teams/{id}', [TeamController::class, 'show'])->name('teams.show');
    Route::get('/teams/{id}/edit', [TeamController::class, 'edit'])->name('teams.edit');
    Route::put('/teams/{id}', [TeamController::class, 'update'])->name('teams.update');
    Route::delete('/teams/{id}', [TeamController::class, 'destroy'])->name('teams.destroy');

    // Team Members
    Route::post('/teams/{teamId}/leave', [TeamController::class, 'leaveTeam'])
        ->name('teams.leave');
    Route::delete('/teams/{teamId}/members/{userId}', [TeamController::class, 'removeMember'])
        ->name('teams.members.remove');
    Route::put('/teams/{teamId}/members/{userId}/role', [TeamController::class, 'updateMemberRole'])
        ->name('teams.members.update-role');
    Route::put('/teams/{teamId}/members/{userId}/position', [TeamController::class, 'updateMemberPosition'])
        ->name('teams.members.update-position');
    Route::post('/teams/{teamId}/transfer-captaincy', [TeamController::class, 'transferCaptaincy'])
        ->name('teams.transfer-captaincy');

    // Join Requests
    Route::post('/join-requests', [JoinRequestController::class, 'store'])
        ->name('join-requests.store');
    Route::post('/join-requests/{id}/accept', [JoinRequestController::class, 'accept'])
        ->name('join-requests.accept');
    Route::post('/join-requests/{id}/reject', [JoinRequestController::class, 'reject'])
        ->name('join-requests.reject');
    Route::delete('/join-requests/{id}', [JoinRequestController::class, 'cancel'])
        ->name('join-requests.cancel');
    Route::get('/join-requests/my-requests', [JoinRequestController::class, 'myRequests'])
        ->name('join-requests.my-requests');
});

