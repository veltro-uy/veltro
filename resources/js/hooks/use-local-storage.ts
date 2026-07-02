import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * Custom event used to notify same-document subscribers of a write (the native
 * `storage` event only fires in *other* tabs).
 */
const WRITE_EVENT = 'veltro:local-storage';

function subscribe(callback: () => void) {
    if (typeof window === 'undefined') return () => {};

    window.addEventListener('storage', callback);
    window.addEventListener(WRITE_EVENT, callback);

    return () => {
        window.removeEventListener('storage', callback);
        window.removeEventListener(WRITE_EVENT, callback);
    };
}

/**
 * Persist a piece of state in `localStorage`.
 *
 * SSR-safe: the server snapshot is always `null` (the project supports
 * server-side rendering via `composer dev:ssr`, where `window` is undefined),
 * so the component renders `initialValue` on the server and React re-syncs to
 * the stored value after hydration. Writes are ignored gracefully if storage is
 * unavailable (e.g. private mode). Pass a stable `initialValue`.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
    // The raw stored string is a stable snapshot; parsing happens in `useMemo`
    // so `useSyncExternalStore` doesn't loop on a fresh object each read.
    const raw = useSyncExternalStore(
        subscribe,
        () => {
            try {
                return window.localStorage.getItem(key);
            } catch {
                return null;
            }
        },
        () => null,
    );

    const value = useMemo<T>(() => {
        if (raw === null) return initialValue;
        try {
            return JSON.parse(raw) as T;
        } catch {
            return initialValue;
        }
    }, [raw, initialValue]);

    const setValue = useCallback(
        (next: T | ((prev: T) => T)) => {
            if (typeof window === 'undefined') return;

            try {
                const current = window.localStorage.getItem(key);
                const prev =
                    current === null
                        ? initialValue
                        : (JSON.parse(current) as T);
                const resolved =
                    next instanceof Function ? next(prev) : next;

                window.localStorage.setItem(key, JSON.stringify(resolved));
                window.dispatchEvent(new Event(WRITE_EVENT));
            } catch {
                // Ignore read/write failures (quota, private mode, etc.).
            }
        },
        [key, initialValue],
    );

    return [value, setValue] as const;
}
