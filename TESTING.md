# Testing Guide

Short reference for the test suite (Pest + PHPUnit).

## What’s here
- Framework: Pest (on PHPUnit) with `tests/Pest.php` extending `Tests\TestCase` and `RefreshDatabase` for Feature tests.
- Config: `phpunit.xml` sets SQLite in-memory DB, array cache/session/queue/mail, bcrypt rounds = 4, and defines Feature/Unit suites.
- Base: `tests/TestCase.php` available for shared helpers.

## How to run
- All tests: `composer test` (or `php artisan test`)
- Suites: `php artisan test --testsuite=Feature` | `--testsuite=Unit`
- Single file: `php artisan test tests/Feature/Auth/AuthenticationTest.php`
- Single test: `php artisan test --filter="users can authenticate using the login screen"`
- Coverage: `php artisan test --coverage`

## Structure
```
tests/
├─ Feature/
│  ├─ Auth/
│  ├─ Settings/
│  └─ ExampleTest.php
├─ Unit/
│  └─ ExampleTest.php
├─ Pest.php
└─ TestCase.php
```

## What each file checks (high level)
- Auth
  - `AuthenticationTest.php`: login page, success login, invalid password, logout, rate limiting, 2FA redirect.
  - `RegistrationTest.php`: registration page + full signup flow.
  - `EmailVerificationTest.php`: verify notice, signed URL success, bad hash/id, already-verified redirects.
  - `PasswordConfirmationTest.php`: confirm-password page + auth requirement.
  - `PasswordResetTest.php`: request link, email send, reset form/token, success reset, invalid token.
  - `TwoFactorChallengeTest.php`: 2FA challenge access rules and rendering.
  - `VerificationNotificationTest.php`: send/not-send verification emails based on status.
- Dashboard
  - `DashboardTest.php`: guests redirected, authenticated users allowed.
- Settings
  - `ProfileUpdateTest.php`: profile view/update, email verification preservation, delete account, OAuth users without password, Inertia `hasPassword` prop.
  - `PasswordUpdateTest.php`: password change, validation, OAuth first-password flow, intended redirect, Inertia props.
  - `TwoFactorAuthenticationTest.php`: 2FA settings access, password confirmation gating, disabled-feature forbidden, OAuth password-setup redirect, successful access once password set.
- Examples
  - `Feature/ExampleTest.php` and `Unit/ExampleTest.php`: simple placeholders/smoke checks.

## Special considerations
- OAuth users: created with `password => null` and `google_id`; must set a password before delete/2FA; can set first password without current password.
- 2FA flags: tests skip when Fortify 2FA disabled (`Features::canManageTwoFactorAuthentication()`); configs tweaked per scenario.
- Inertia assertions: `assertInertia` checks component names/props (e.g., `settings/profile`, `settings/password`, `settings/two-factor`).
- Rate limiting: manual increment of rate limiter to assert 429 responses on login abuse.
- Sessions: uses `login.id`, `needs_password_setup`, `intended_url`, `auth.password_confirmed_at` to drive flows.

## Writing tests here
- Use factories (`User::factory()`, modifiers like `unverified()`, `withoutTwoFactor()`).
- Prefer Arrange/Act/Assert, descriptive `test('...')` names.
- Fake external effects: `Notification::fake()`, `Event::fake()`.
- Keep Feature tests idempotent; rely on `RefreshDatabase` instead of manual cleanup.

