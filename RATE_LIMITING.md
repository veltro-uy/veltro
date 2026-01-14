# Rate Limiting Configuration

This document describes the rate limiting implementation for the Veltro application.

## Overview

Rate limiting is implemented to protect against abuse, DoS attacks, and excessive API usage. The application uses Laravel's built-in rate limiting features with custom named rate limiters for different route groups.

## Rate Limiters

### Authentication Routes (Laravel Fortify)

| Route | Limiter Name | Limit | Key |
|-------|-------------|-------|-----|
| Login POST | `login` | 5 requests/minute | email + IP |
| Two-Factor POST | `two-factor` | 5 requests/minute | session login.id |
| Email Verification | N/A | 6 requests/minute | user ID or IP |

### Public Routes

| Route | Limiter Name | Limit | Key |
|-------|-------------|-------|-----|
| Home page | `public` | 30 requests/minute | IP address |

### OAuth Routes

| Route | Limiter Name | Limit | Key |
|-------|-------------|-------|-----|
| Google OAuth redirect | `oauth` | 10 requests/minute | IP address |
| Google OAuth callback | `oauth` | 10 requests/minute | IP address |

### Authenticated Routes

| Route Group | Limiter Name | Limit | Key |
|------------|-------------|-------|-----|
| Dashboard | `dashboard` | 60 requests/minute | user ID or IP |
| Teams | `teams` | 60 requests/minute | user ID or IP |
| Matches | `matches` | 60 requests/minute | user ID or IP |

### Settings Routes

| Route Type | Limiter Name | Limit | Key |
|-----------|-------------|-------|-----|
| Read operations (GET) | `settings-read` | 60 requests/minute | user ID or IP |
| Write operations (POST/PUT/DELETE) | `settings-write` | 6 requests/minute | user ID or IP |

## Implementation Details

### Rate Limiter Configuration

Rate limiters are configured in `app/Providers/FortifyServiceProvider.php` in the `configureRateLimiting()` method.

```php
RateLimiter::for('public', function (Request $request) {
    return Limit::perMinute(30)->by($request->ip());
});

RateLimiter::for('oauth', function (Request $request) {
    return Limit::perMinute(10)->by($request->ip());
});

RateLimiter::for('dashboard', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()?->id ?? $request->ip());
});
```

### Route Application

Rate limiters are applied using middleware in route files:

```php
// routes/web.php
Route::get('/', function () {
    return Inertia::render('landing-page');
})->middleware('throttle:public');

// routes/teams.php
Route::middleware(['auth', 'verified', 'throttle:teams'])->group(function () {
    // Team routes
});

// routes/settings.php
Route::get('settings/profile', [ProfileController::class, 'edit'])
    ->middleware('throttle:settings-read');
Route::patch('settings/profile', [ProfileController::class, 'update'])
    ->middleware('throttle:settings-write');
```

## Independence

Each named rate limiter maintains its own counter, ensuring that:

1. Exhausting the rate limit on one route group (e.g., teams) does NOT affect other route groups (e.g., matches)
2. Settings read operations (60/min) are independent from settings write operations (6/min)
3. Authenticated users are tracked by user ID, while guests are tracked by IP address

## Response When Rate Limited

When a rate limit is exceeded, Laravel returns:

- **Status Code**: 429 (Too Many Requests)
- **Headers**:
  - `X-RateLimit-Limit`: Maximum number of requests allowed
  - `X-RateLimit-Remaining`: Number of requests remaining
  - `Retry-After`: Number of seconds until the limit resets

## Testing

Rate limiting is tested in `tests/Feature/RateLimitingTest.php` with 12 tests covering:

- Public route rate limiting
- OAuth route rate limiting
- Authenticated route rate limiting
- Settings route rate limiting (read vs write)
- Rate limiter independence

Run tests with:

```bash
php artisan test tests/Feature/RateLimitingTest.php
```

## Customization

To modify rate limits:

1. Update the rate limiter configuration in `app/Providers/FortifyServiceProvider.php`
2. Change `Limit::perMinute(X)` to your desired limit
3. Run tests to ensure the changes work as expected

### Example: Increasing Team Route Limit

```php
RateLimiter::for('teams', function (Request $request) {
    return Limit::perMinute(120)->by($request->user()?->id ?? $request->ip());
});
```

## Security Considerations

1. **OAuth Routes**: Limited to 10/min to prevent OAuth flow abuse
2. **Authentication Routes**: Fortify routes are strictly limited to 5/min to prevent brute force attacks
3. **Settings Write Operations**: Limited to 6/min to prevent abuse of sensitive operations (profile updates, password changes, account deletion)
4. **IP-based Limiting**: Used for public and OAuth routes to prevent unauthenticated abuse

## Monitoring

To monitor rate limiting in production:

1. Check application logs for 429 responses
2. Monitor `X-RateLimit-*` headers in responses
3. Consider implementing alerts for excessive rate limiting (may indicate an attack or misconfiguration)

## Related Issues

- GitHub Issue #3: Missing Rate Limiting on All Routes (Resolved)
