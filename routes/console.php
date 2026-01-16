<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule availability reminders to run every 30 minutes
// This checks for matches exactly 48 hours away (±15 minute window)
Schedule::command('availability:send-reminders')
    ->everyThirtyMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->onSuccess(function () {
        info('Availability reminders sent successfully');
    })
    ->onFailure(function () {
        logger()->error('Failed to send availability reminders');
    });
