# Veltro

Veltro is a Laravel, React, and Inertia platform for amateur football teams in Uruguay. Teams can manage rosters, discover opponents, schedule matches, track player availability, record results, run tournaments, and build player profiles with comments and commendations.

## Tech Stack

- **Backend:** Laravel 12, PHP 8.2+, Laravel Fortify, Socialite, Wayfinder
- **Frontend:** React 19, TypeScript, Inertia 2, Tailwind CSS 4, Radix/Shadcn-style components
- **Data:** MySQL 8 in development/production, SQLite in tests
- **Tooling:** Bun, Vite, Pest, Pint, Prettier, ESLint

## Core Features

- Email/password auth, Google OAuth, email verification, and two-factor auth
- Team creation, discovery, join requests, invitations, member roles, and logos
- Match creation, opponent requests, lineups, availability tracking, score/event recording
- Tournament formats: single elimination, league, and group stage plus knockout
- User profiles with match/team stats, comments, commendations, avatars, and public profile pages
- Notifications, scheduled availability reminders, rate limiting, dark mode, and responsive UI

## Requirements

- PHP 8.2+
- Composer
- Node.js 20.19+ or 22.12+
- Bun
- MySQL 8.0+

Docker/Sail is available through `compose.yaml`, but local PHP/MySQL/Bun works fine.

## Setup

```bash
composer install
bun install
cp .env.example .env
php artisan key:generate
php artisan migrate
bun run build
```

Configure at least these values in `.env`:

```env
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=veltro
DB_USERNAME=root
DB_PASSWORD=

QUEUE_CONNECTION=database
```

Optional Google OAuth:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost/auth/google/callback
```

## Development

Start the standard local stack:

```bash
composer dev
```

Start with Inertia SSR:

```bash
composer dev:ssr
```

Frontend-only Vite server:

```bash
bun run dev
```

Common commands:

```bash
bun run build          # production frontend build
bun run build:ssr      # client and SSR builds
bun run types          # TypeScript checks
bun run format         # Prettier write for resources/
bun run format:check   # Prettier check for resources/
bun run lint           # ESLint with fixes
./vendor/bin/pint      # PHP formatting
php artisan test       # PHP test suite
```

After adding or changing Laravel routes, regenerate Wayfinder output:

```bash
php artisan wayfinder:generate
```

## Project Structure

```text
app/
  Http/Controllers/      Thin HTTP controllers
  Http/Middleware/       Auth, onboarding, appearance, and request middleware
  Http/Requests/         Form request validation
  Models/                Eloquent models
  Notifications/         User notification classes
  Policies/              Authorization policies
  Services/              Business logic and tournament/match/team services

resources/js/
  components/            Shared React components
  components/ui/         Reusable UI primitives
  hooks/                 React hooks
  layouts/               App, auth, and settings layouts
  pages/                 Inertia pages
  routes/                Generated Wayfinder route helpers
  types/                 Shared TypeScript types

routes/
  web.php                Home, dashboard, profiles, auth-adjacent routes
  teams.php              Teams, members, invitations, join requests
  matches.php            Matches, requests, lineups, events, availability
  tournaments.php        Tournaments, registrations, groups, scheduling
  settings.php           Profile, password, appearance, 2FA
  notifications.php      Notification API endpoints

tests/
  Feature/               HTTP and workflow tests
  Unit/                  Isolated service tests
```

## Testing

Run the full suite:

```bash
composer test
```

Run focused tests:

```bash
php artisan test tests/Feature/TeamTest.php
php artisan test tests/Feature/Tournament
php artisan test tests/Unit/Services/StandingsServiceTest.php
```

Before merging substantial work, run:

```bash
bun run types
bun run format:check
bun run build
php artisan test
```

See [TESTING.md](TESTING.md) for additional testing notes.

## Operations

The scheduler sends availability reminders for upcoming matches:

```bash
php artisan schedule:list
php artisan schedule:run
php artisan availability:send-reminders
```

Production cron:

```bash
* * * * * cd /path/to/veltro && php artisan schedule:run >> /dev/null 2>&1
```

Additional operational docs:

- [RATE_LIMITING.md](RATE_LIMITING.md)
- [PRODUCTION_STORAGE_SETUP.md](PRODUCTION_STORAGE_SETUP.md)

## Docker / Sail

Start containers:

```bash
./vendor/bin/sail up -d
```

Run commands through Sail:

```bash
./vendor/bin/sail artisan migrate
./vendor/bin/sail composer install
./vendor/bin/sail bun install
```

When using Sail, set:

```env
DB_HOST=mysql
DB_PORT=3306
```

## Conventions

- Keep controllers thin; put business behavior in services.
- Prefer generated Wayfinder helpers from `resources/js/routes` over hardcoded internal URLs.
- Keep generated frontend route files synchronized with backend route changes.
- Use Pest for PHP tests, Pint for PHP formatting, and Prettier/TypeScript checks for frontend work.
- Do not commit `.env`, secrets, or local build artifacts.

