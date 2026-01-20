<?php

use App\Http\Controllers\Settings\AvatarController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {
    Route::redirect('settings', '/settings/profile')->middleware('throttle:settings-read');

    Route::get('settings/profile', [ProfileController::class, 'edit'])
        ->middleware('throttle:settings-read')
        ->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])
        ->middleware('throttle:settings-write')
        ->name('profile.update');
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])
        ->middleware('throttle:settings-write')
        ->name('profile.destroy');

    Route::post('settings/avatar', [AvatarController::class, 'store'])
        ->middleware('throttle:avatar-upload')
        ->name('avatar.store');
    Route::delete('settings/avatar', [AvatarController::class, 'destroy'])
        ->middleware('throttle:settings-write')
        ->name('avatar.destroy');

    Route::get('settings/password', [PasswordController::class, 'edit'])
        ->middleware('throttle:settings-read')
        ->name('user-password.edit');

    Route::put('settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:settings-write')
        ->name('user-password.update');

    Route::get('settings/appearance', function () {
        return Inertia::render('settings/appearance');
    })->middleware('throttle:settings-read')->name('appearance.edit');

    Route::get('settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])
        ->middleware('throttle:settings-read')
        ->name('two-factor.show');
});
