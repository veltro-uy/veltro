# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Veltro is a web platform for amateur football teams in Uruguay to manage teams, organize matches, track statistics, and connect with other teams. Built with Laravel 12 + React 19 + Inertia.js, using TypeScript and Tailwind CSS.

## Essential Commands

### Development

```bash
# Start development server (Laravel + Queue + Vite)
composer dev

# Start development with SSR
composer dev:ssr

# Build assets for production
bun run build

# Build with SSR support
bun run build:ssr

# Run frontend type checking
bun run types

# Lint and format code
bun run lint
bun run format
./vendor/bin/pint  # PHP formatting
```

### Testing

```bash
# Run all tests
composer test
# or
php artisan test

# Run specific test file
php artisan test tests/Feature/Auth/LoginTest.php

# Run with coverage
php artisan test --coverage
```

### Database

```bash
# Run migrations
php artisan migrate

# Refresh database with seeders
php artisan migrate:fresh --seed

# Generate Wayfinder routes (after adding/changing routes)
php artisan wayfinder:generate
```

### Scheduled Tasks

```bash
# Run scheduler once (for testing)
php artisan schedule:run

# Run specific scheduled command
php artisan availability:send-reminders

# Keep scheduler running in development
php artisan schedule:work

# List all scheduled tasks
php artisan schedule:list
```

## Architecture

### Backend Stack

- **Laravel 12** (PHP 8.2+) with Fortify for authentication
- **Inertia.js 2.0** for server-driven SPA architecture
- **MySQL 8.0** database
- **Pest PHP** for testing
- **Queue system** for background jobs (notifications, emails)

### Frontend Stack

- **React 19** with TypeScript 5.7
- **Shadcn UI** (Radix UI primitives) for components
- **Tailwind CSS 4.0** for styling
- **Vite 7** for bundling
- **Wayfinder** for type-safe Laravel routes in TypeScript
- **Bun** as package manager

### Key Architectural Patterns

**1. Inertia.js Server-Driven Architecture**

State lives on the server (database). Controllers pass props to React pages:

```php
return Inertia::render('matches/show', [
    'match' => $match,
    'canEdit' => $team->isLeader($user->id),
]);
```

Shared data (available on all pages) is configured in `app/Http/Middleware/HandleInertiaRequests.php::share()`. This includes:
- App name
- Authenticated user (`auth.user`)
- UI state (`sidebarOpen`)
- Random quote

**2. Type-Safe Routing with Wayfinder**

Laravel routes are auto-generated into TypeScript helpers:

```typescript
import matches from '@/routes/matches';
router.get(matches.show(123).url); // Type-safe!
```

After adding/modifying routes, regenerate: `php artisan wayfinder:generate`

**3. Service Layer Pattern**

Controllers are thin. Business logic lives in service classes:

```php
// Controller
public function __construct(private readonly MatchService $matchService) {}

public function store(Request $request)
{
    $match = $this->matchService->createMatch($request->validated());
    return redirect()->route('matches.show', $match);
}
```

**4. Authorization via Model Methods**

Role-based access control using model helper methods:

```php
// In Team model
public function isCaptain(int $userId): bool
public function isLeader(int $userId): bool // Captain or Co-Captain
public function hasMember(int $userId): bool

// In controller
if (!$team->isLeader($user->id)) {
    abort(403, 'Unauthorized');
}
```

Pass authorization flags to frontend:

```php
Inertia::render('page', [
    'canEdit' => $team->isLeader($user->id),
]);
```

**5. TypeScript Type System**

Types are manually maintained in `resources/js/types/index.d.ts` to match backend models:

```typescript
export interface User {
    id: number;
    name: string;
    email: string;
    two_factor_enabled?: boolean;
}
```

No runtime validation—types are for IDE support and compile-time checking. Server validation uses Laravel Form Requests.

## Authentication System

**Multi-Method Authentication:**
- Email/password via Laravel Fortify
- Google OAuth via Laravel Socialite
- Two-Factor Authentication (2FA) support

**Critical Security Feature:**
Google OAuth users are checked for 2FA. If enabled, they must complete 2FA challenge even after OAuth login. See `GoogleAuthController::handleGoogleCallback()`.

**2FA Flow:**
1. User enables 2FA in settings (requires password confirmation)
2. QR code generated for authenticator app
3. Recovery codes provided for backup
4. On login, redirect to `/two-factor.login` challenge page

**Key Files:**
- `app/Http/Controllers/Auth/GoogleAuthController.php`
- `app/Providers/FortifyServiceProvider.php`
- `config/fortify.php`

## Team Role System

Three roles with distinct permissions:

- **Captain**: Full control (edit, delete team, transfer captaincy)
- **Co-Captain**: Team management except delete/transfer
- **Player**: Basic member (view, participate)

Stored in `team_members` pivot table with `role` enum.

**Authorization Pattern:**
```php
// Check in controller
if (!$team->isLeader($request->user()->id)) {
    abort(403);
}

// Pass to frontend
Inertia::render('teams/edit', [
    'team' => $team,
    'isLeader' => $team->isLeader($user->id),
    'isCaptain' => $team->isCaptain($user->id),
]);
```

## Match Availability Feature

**Purpose:** Track player availability for upcoming matches with automated reminders.

**Database Schema:**
- `match_availability` table with unique constraint: `(match_id, user_id, team_id)`
- Status enum: `pending`, `available`, `maybe`, `unavailable`
- Timestamps: `confirmed_at`, `reminded_at`

**Flow:**
1. When match is created, pending availability records generated for all team members
2. Players select status via `AvailabilitySelector` component on match page
3. Leaders see statistics via `AvailabilityStats` and `AvailabilityList` components
4. Automated command sends reminders 48 hours before match to players with `pending` status

**Scheduled Task:**
```php
// In routes/console.php
Schedule::command('availability:send-reminders')->everyThirtyMinutes();
```

**Key Files:**
- `app/Models/MatchAvailability.php` (model with scopes)
- `app/Http/Controllers/MatchAvailabilityController.php`
- `app/Console/Commands/SendAvailabilityReminders.php`
- `resources/js/components/availability-*.tsx` (3 components)

## Rate Limiting

Comprehensive rate limiting configured in `app/Providers/FortifyServiceProvider.php`:

- **Auth routes**: 5 req/min (login, 2FA)
- **Public routes**: 30 req/min
- **OAuth**: 10 req/min
- **Authenticated routes**: 60 req/min
- **Settings writes**: 6 req/min
- **Settings reads**: 60 req/min

Each route group has independent rate limiter to prevent conflicts.

## Route Organization

Routes are split across multiple files:

- `routes/web.php` - Public pages, auth routes
- `routes/teams.php` - Team management
- `routes/matches.php` - Match operations
- `routes/settings.php` - User settings, profile, 2FA
- `routes/console.php` - Scheduled tasks

All route files are loaded in `bootstrap/app.php`.

## Notification System

**Queued Email Notifications:**
Notifications implement `ShouldQueue` for async processing via database queue.

```php
class AvailabilityReminderNotification extends Notification implements ShouldQueue
{
    public function via(): array
    {
        return ['mail'];
    }

    public function toMail(): MailMessage
    {
        return (new MailMessage)
            ->subject('Match Reminder')
            ->action('Confirm Availability', $url);
    }
}
```

Queue worker runs via `composer dev` (or manually: `php artisan queue:listen`).

## Frontend Component Patterns

**1. Inertia Page Components**

Located in `resources/js/pages/`. Receive props from controller:

```typescript
interface Props {
    match: Match;
    isLeader: boolean;
}

export default function Show({ match, isLeader }: Props) {
    // Component logic
}
```

**2. Reusable Components**

Located in `resources/js/components/`. Use Shadcn UI primitives:

```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
```

**3. Form Handling**

Use Inertia router for submissions:

```typescript
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

const handleSubmit = () => {
    router.post(matches.update(id).url, data, {
        preserveScroll: true,
        onSuccess: () => toast.success('Saved!'),
        onError: () => toast.error('Failed'),
    });
};
```

**4. Flash Messages**

Handle server flash messages in page components:

```typescript
const { flash } = usePage<{ flash: { success?: string } }>().props;

useEffect(() => {
    if (flash?.success) toast.success(flash.success);
}, [flash]);
```

**5. Navigation**

Use Inertia Link component for SPA navigation:

```typescript
import { Link } from '@inertiajs/react';
import matches from '@/routes/matches';

<Link href={matches.show(id).url}>View Match</Link>
```

## Development Workflow

### Adding a New Feature

**Backend:**
1. Create migration with proper indexes and foreign keys
2. Create model with relationships and helper methods
3. Create service class for business logic (if complex)
4. Create controller (keep thin, delegate to service)
5. Add routes in appropriate route file
6. Add tests in `tests/Feature/`
7. Add rate limiter if needed

**Frontend:**
1. Define TypeScript interfaces in `resources/js/types/index.d.ts`
2. Create reusable components in `resources/js/components/`
3. Create page component in `resources/js/pages/`
4. Run `php artisan wayfinder:generate` for type-safe routes
5. Import route helpers for navigation

**After Changes:**
```bash
# Format code
./vendor/bin/pint
bun run format

# Run tests
composer test

# Check types
bun run types
```

### Database Changes

Always use migrations. Never modify the database directly:

```bash
php artisan make:migration create_example_table
# Edit migration file
php artisan migrate
```

For testing, use factories defined in `database/factories/`.

### Testing Guidelines

- Write feature tests for all new endpoints
- Test authorization (ensure non-authorized users get 403)
- Use factories for model creation
- Tests use SQLite in-memory database (configured in `phpunit.xml`)
- Run tests before committing: `composer test`

## Common Pitfalls

**1. Missing Eager Loading**

Avoid N+1 queries by eager loading relationships:

```php
// Bad
$teams = Team::all();
foreach ($teams as $team) {
    echo $team->captain->name; // N+1!
}

// Good
$teams = Team::with('captain')->get();
```

**2. Forgetting Authorization Checks**

Always check permissions before destructive operations:

```php
// Check in controller before update/delete
if (!$team->isLeader($user->id)) {
    abort(403);
}
```

**3. Not Regenerating Wayfinder Routes**

After adding/changing routes, regenerate TypeScript helpers:

```bash
php artisan wayfinder:generate
```

**4. Hard-Coding Routes in Frontend**

Use Wayfinder helpers instead of hard-coded URLs:

```typescript
// Bad
router.get(`/matches/${id}`);

// Good
import matches from '@/routes/matches';
router.get(matches.show(id).url);
```

**5. Blocking Operations in Controllers**

Use queued jobs for slow operations (emails, notifications, API calls):

```php
// Notifications implement ShouldQueue
$user->notify(new AvailabilityReminderNotification($match));
```

## Docker Setup (Laravel Sail)

Optional Docker environment via Laravel Sail:

```bash
# Start containers
./vendor/bin/sail up -d

# Run commands
./vendor/bin/sail artisan migrate
./vendor/bin/sail composer install
./vendor/bin/sail bun install

# Stop containers
./vendor/bin/sail down
```

Services: Laravel app (port 80), MySQL 8.0 (port 3307), Vite (port 5173).

When using Sail, set `DB_HOST=mysql` in `.env`.

## Project-Specific Context

**Target Audience:** Amateur football teams in Uruguay

**Supported Variants:**
- Fútbol 11 (11v11)
- Fútbol 7 (7v7)
- Fútbol 5 (5v5)
- Futsal

**Match Flow:**
1. Home team creates match (sets availability, date, location)
2. Match appears on dashboard (public or private)
3. Away team requests to play
4. Home team accepts → match confirmed
5. Both teams track player availability
6. After match time, leaders can update scores

**Key Business Rules:**
- Only team leaders can create/manage matches
- Team capacity varies by variant (11, 7, 5 players)
- Players can only confirm availability for their own team
- Reminders sent 48 hours before match
- Teams must have minimum players available (varies by variant)
