/**
 * Canonical date-time handling for Veltro.
 *
 * The app is Uruguay-only, and `config/app.php` pins the backend timezone to
 * `America/Montevideo`. So every match/tournament time means **Uruguay local
 * time**, regardless of the viewer's device timezone. All input pre-fills and
 * displays go through these helpers so the result is consistent and
 * device-/SSR-independent (we never rely on the runtime's local timezone).
 *
 * Submit paths send the raw `datetime-local` string (naive wall-clock). Because
 * the backend timezone is `America/Montevideo`, it parses that as Uruguay time
 * and stores the correct instant — so no conversion is needed on submit, as
 * long as the field always shows Montevideo wall-clock (which `toDateTimeLocal`
 * guarantees).
 */
export const APP_TIME_ZONE = 'America/Montevideo';

const DATE_LOCALE = 'es-UY';

/**
 * Convert a UTC/ISO instant to a `datetime-local` value ("YYYY-MM-DDTHH:mm")
 * expressed in the app timezone. Returns '' for null/empty input.
 */
export function toDateTimeLocal(value: string | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).formatToParts(date);

    const get = (type: string) =>
        parts.find((part) => part.type === type)?.value ?? '';

    // Some runtimes emit '24' for midnight; normalize to '00'.
    const hour = get('hour') === '24' ? '00' : get('hour');

    return `${get('year')}-${get('month')}-${get('day')}T${hour}:${get('minute')}`;
}

/**
 * Current time as a `datetime-local` value in the app timezone — for `min`
 * attributes on date pickers.
 */
export function nowDateTimeLocal(): string {
    return toDateTimeLocal(new Date().toISOString());
}

/** Format an instant as a date in the app timezone. */
export function formatDate(
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    },
): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString(DATE_LOCALE, {
        timeZone: APP_TIME_ZONE,
        ...options,
    });
}

/** Format an instant as a time (HH:mm) in the app timezone. */
export function formatTime(
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
    },
): string {
    if (!value) return '';
    return new Date(value).toLocaleTimeString(DATE_LOCALE, {
        timeZone: APP_TIME_ZONE,
        ...options,
    });
}

/** Format an instant as a combined date + time in the app timezone. */
export function formatDateTime(
    value: string | null | undefined,
    options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    },
): string {
    if (!value) return '';
    return new Date(value).toLocaleString(DATE_LOCALE, {
        timeZone: APP_TIME_ZONE,
        ...options,
    });
}
