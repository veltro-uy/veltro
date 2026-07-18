<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Tournament;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PurgeUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:purge {id : The ID of the user to permanently delete}
                            {--dry-run : Show what would be deleted without deleting anything}
                            {--force : Skip the confirmation prompt (required in non-interactive consoles)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Permanently delete a user and everything they created (teams, tournaments, matches) from the database';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $user = User::find($this->argument('id'));

        if (! $user) {
            $this->error("User {$this->argument('id')} not found.");

            return self::FAILURE;
        }

        // Teams the user created are only SET NULL by the schema, so we delete
        // them explicitly. Tournaments cascade via organizer_id, but we delete
        // them explicitly too so it happens inside the same transaction and so
        // we can clean up their logo files.
        $createdTeams = $user->createdTeams()->get();
        $tournaments = Tournament::where('organizer_id', $user->id)->get();

        // Collect storage files to remove *after* the DB transaction commits.
        $files = collect()
            ->when($user->avatar_path, fn ($c) => $c->push($user->avatar_path))
            ->merge($createdTeams->pluck('logo_path')->filter())
            ->merge($tournaments->pluck('logo_path')->filter())
            ->values();

        $this->info("About to purge user #{$user->id} — {$user->name} <{$user->email}>");
        $this->table(['What', 'Count / Value'], [
            ['Teams created (deleted, cascades to all members/matches)', $createdTeams->count()],
            ['Tournaments organized (deleted, cascades to matches/rounds/groups)', $tournaments->count()],
            ['Matches created by user', DB::table('matches')->where('created_by', $user->id)->count()],
            ['Team memberships', $user->teams()->count()],
            ['Storage files to remove', $files->count()],
        ]);

        if ($this->option('dry-run')) {
            $this->warn('Dry run — nothing was deleted.');

            return self::SUCCESS;
        }

        if (! $this->option('force')
            && ! $this->confirm('This is permanent and cannot be undone. Have you taken a DB backup and want to continue?')) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($user, $createdTeams, $tournaments) {
            // Explicit deletes so DB cascades fire for members, matches, etc.
            $createdTeams->each(fn ($team) => $team->delete());
            $tournaments->each(fn ($tournament) => $tournament->delete());

            // Polymorphic / no-FK leftovers the DB cascade won't touch.
            DB::table('notifications')
                ->where('notifiable_type', $user->getMorphClass())
                ->where('notifiable_id', $user->id)
                ->delete();

            DB::table(config('webpush.table_name', 'push_subscriptions'))
                ->where('subscribable_type', $user->getMorphClass())
                ->where('subscribable_id', $user->id)
                ->delete();

            DB::table('sessions')->where('user_id', $user->id)->delete();

            // Finally the user; remaining CASCADE / SET NULL FKs fire here.
            $user->delete();
        });

        // Remove storage objects only after the transaction succeeded.
        $disk = Storage::disk(config('filesystems.default'));
        foreach ($files as $path) {
            if ($disk->exists($path)) {
                $disk->delete($path);
            }
        }

        $this->info("User #{$user->id} and all associated data have been permanently deleted.");

        return self::SUCCESS;
    }
}
