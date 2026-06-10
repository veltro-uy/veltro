/**
 * Build headers carrying Laravel's CSRF token for manual `fetch` requests.
 *
 * Inertia navigates as a SPA, so the server-rendered `<meta name="csrf-token">`
 * is only set on the initial full page load and goes stale whenever the session
 * token rotates (e.g. after login/logout). The `XSRF-TOKEN` cookie, however, is
 * refreshed by Laravel on every response, so we read it first and fall back to
 * the meta tag. Laravel's VerifyCsrfToken middleware accepts the (encrypted)
 * cookie value via the `X-XSRF-TOKEN` header and the raw token via `X-CSRF-TOKEN`.
 */
export function csrfHeaders(): Record<string, string> {
    const xsrfCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='));

    if (xsrfCookie) {
        return {
            'X-XSRF-TOKEN': decodeURIComponent(xsrfCookie.split('=')[1]),
        };
    }

    const metaToken =
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
            ?.content ?? '';

    return { 'X-CSRF-TOKEN': metaToken };
}
