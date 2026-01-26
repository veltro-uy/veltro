<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class CreateTestNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:test {email? : The email of the user to notify}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a test notification for a user';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');

        if (! $email) {
            // Get the first user
            $user = User::first();

            if (! $user) {
                $this->error('No users found in the database. Please create a user first.');

                return 1;
            }
        } else {
            $user = User::where('email', $email)->first();

            if (! $user) {
                $this->error("User with email {$email} not found.");

                return 1;
            }
        }

        // Create a test notification
        $user->notifications()->create([
            'id' => \Illuminate\Support\Str::uuid(),
            'type' => 'App\Notifications\MatchRequestReceivedNotification',
            'data' => [
                'type' => 'match_request_received',
                'title' => 'Test Notification',
                'message' => 'This is a test notification to verify the system is working!',
                'action_url' => '/teams',
                'icon' => 'Trophy',
                'related_model' => [
                    'match_id' => 999,
                    'team_id' => 999,
                ],
                'created_at' => now()->toISOString(),
            ],
            'read_at' => null,
        ]);

        $this->info("✅ Test notification created for user: {$user->name} ({$user->email})");
        $this->info("🔔 The notification bell should now show a badge with '1'");
        $this->info('👉 Refresh your browser to see the notification!');

        return 0;
    }
}
