# Repository Guidelines

## Project Structure & Module Organization

Veltro is a Laravel 12 + React 19 + Inertia.js application. Backend code lives in `app/`, with controllers under `app/Http/Controllers`, models in `app/Models`, services in `app/Services`, policies in `app/Policies`, and notifications in `app/Notifications`. Routes are split across `routes/web.php`, `routes/teams.php`, `routes/matches.php`, `routes/tournaments.php`, and related route files. Frontend source is in `resources/js`: pages in `pages/`, shared components in `components/`, layouts in `layouts/`, hooks in `hooks/`, and types in `types/`. Styles are in `resources/css/app.css`. Tests are in `tests/Feature` and `tests/Unit`.

## Build, Test, and Development Commands

- Do not run `composer dev`: the user keeps the local Laravel, queue, and Vite stack running in another terminal.
- `composer dev:ssr`: run the local stack with Inertia SSR.
- `bun run build`: build production frontend assets.
- `bun run build:ssr`: build client and SSR bundles.
- `bun run types`: run TypeScript checks.
- `bun run format` / `bun run format:check`: format or verify `resources/` with Prettier.
- `bun run lint`: run ESLint with fixes.
- `composer test` or `php artisan test`: run the PHP test suite.
- `./vendor/bin/pint`: format PHP code.

After adding or changing Laravel routes, regenerate Wayfinder output with `php artisan wayfinder:generate`.

## Coding Style & Naming Conventions

Use Prettier for frontend formatting and Pint for PHP formatting. Follow existing TypeScript patterns: React components use PascalCase, hooks use `use-*` naming, and page files use lowercase route-oriented names such as `resources/js/pages/teams/show.tsx`. Keep controllers thin and place business logic in service classes. Prefer Wayfinder route helpers from `resources/js/routes` over hardcoded app URLs.

## Testing Guidelines

The backend test suite uses Pest. Put integration and HTTP behavior tests in `tests/Feature`, and isolated service or utility tests in `tests/Unit`. Name tests after the feature or behavior, for example `TournamentRegistrationTest.php` or `StandingsServiceTest.php`. Run targeted tests with `php artisan test tests/Feature/TeamTest.php`; run the full suite before merging with `composer test`.

## Commit & Pull Request Guidelines

Recent history uses conventional prefixes such as `feat:`, `fix:`, and `chore:`. Keep commit subjects imperative and scoped to one change. Pull requests should include a short summary, linked issue or ticket when available, test results, and screenshots for user-facing UI changes.

## Security & Configuration Tips

Do not commit `.env` or secrets. Keep generated frontend route files in sync with backend routes. For auth, authorization, and team-role changes, verify both server-side policy/model checks and frontend permission flags.
