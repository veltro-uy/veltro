<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\FootballMatch;
use App\Models\MatchAvailability;
use App\Notifications\AvailabilityReminderNotification;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendAvailabilityReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'availability:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send availability reminders to players 48 hours before matches';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        // Find matches scheduled 48 hours from now (with a 30-minute window)
        $targetTime = Carbon::now()->addHours(48);
        $windowStart = $targetTime->copy()->subMinutes(15);
        $windowEnd = $targetTime->copy()->addMinutes(15);

        $matches = FootballMatch::whereBetween('scheduled_at', [$windowStart, $windowEnd])
            ->whereIn('status', ['confirmed', 'available'])
            ->with(['homeTeam.teamMembers.user', 'awayTeam.teamMembers.user'])
            ->get();

        if ($matches->isEmpty()) {
            $this->info('No matches found requiring reminders.');

            return self::SUCCESS;
        }

        $remindersSent = 0;

        foreach ($matches as $match) {
            $this->info("Processing match {$match->id}: {$match->homeTeam->name} vs ".
                       ($match->awayTeam ? $match->awayTeam->name : 'TBD'));

            // Send reminders for home team
            $remindersSent += $this->sendTeamReminders($match, $match->home_team_id, $match->homeTeam);

            // Send reminders for away team if exists
            if ($match->away_team_id && $match->awayTeam) {
                $remindersSent += $this->sendTeamReminders($match, $match->away_team_id, $match->awayTeam);
            }
        }

        $this->info("Sent {$remindersSent} reminders for {$matches->count()} matches.");

        return self::SUCCESS;
    }

    /**
     * Send reminders for a specific team in a match.
     */
    private function sendTeamReminders(FootballMatch $match, int $teamId, $team): int
    {
        $sent = 0;

        // Get all active team members
        $teamMembers = $team->teamMembers()->where('status', 'active')->get();

        foreach ($teamMembers as $member) {
            // Check if player has confirmed availability
            $availability = MatchAvailability::where('match_id', $match->id)
                ->where('user_id', $member->user_id)
                ->where('team_id', $teamId)
                ->first();

            // Send reminder if pending and haven't been reminded yet
            if (! $availability || ($availability->status === 'pending' && ! $availability->reminded_at)) {
                try {
                    // Create availability record if doesn't exist
                    if (! $availability) {
                        $availability = MatchAvailability::create([
                            'match_id' => $match->id,
                            'user_id' => $member->user_id,
                            'team_id' => $teamId,
                            'status' => 'pending',
                        ]);
                    }

                    // Send notification
                    $member->user->notify(new AvailabilityReminderNotification($match, $team));

                    // Mark as reminded
                    $availability->update(['reminded_at' => now()]);

                    $sent++;
                    $this->line("  → Sent reminder to {$member->user->name}");
                } catch (\Exception $e) {
                    $this->error("  → Failed to send reminder to {$member->user->name}: {$e->getMessage()}");
                }
            }
        }

        return $sent;
    }
}
