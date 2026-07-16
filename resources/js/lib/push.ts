/* Browser Web Push helpers.
 *
 * Wraps service-worker registration, PushManager subscribe/unsubscribe, and the
 * server sync calls. All functions are safe to call in unsupported browsers —
 * they return a state indicating push is unavailable rather than throwing.
 */

import { store, destroy } from '@/routes/push/subscriptions';

export type PushState = {
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
};

// Mirrors the CSRF header approach used by use-notifications.ts: read the live
// XSRF-TOKEN cookie (Laravel rotates it) rather than a stale meta tag.
function mutationHeaders(): HeadersInit {
    const xsrfToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken ? decodeURIComponent(xsrfToken) : '',
    };
}

export function isPushSupported(): boolean {
    return (
        typeof window !== 'undefined' &&
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window
    );
}

// VAPID public keys are base64url; PushManager needs a Uint8Array.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
        output[i] = raw.charCodeAt(i);
    }
    return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (!isPushSupported()) return null;
    // app.tsx registers /sw.js on load; `ready` resolves once it's active.
    return navigator.serviceWorker.ready;
}

export async function getPushState(): Promise<PushState> {
    if (!isPushSupported()) {
        return { supported: false, permission: 'denied', subscribed: false };
    }

    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    return {
        supported: true,
        permission: Notification.permission,
        subscribed: !!subscription,
    };
}

export async function subscribeToPush(
    vapidPublicKey: string,
): Promise<PushState> {
    if (!isPushSupported()) {
        return { supported: false, permission: 'denied', subscribed: false };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        return { supported: true, permission, subscribed: false };
    }

    const registration = await getRegistration();
    if (!registration) {
        return { supported: false, permission, subscribed: false };
    }

    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
            vapidPublicKey,
        ) as BufferSource,
    });

    const json = subscription.toJSON();
    const response = await fetch(store().url, {
        method: 'POST',
        headers: mutationHeaders(),
        credentials: 'same-origin',
        body: JSON.stringify({
            endpoint: json.endpoint,
            keys: json.keys,
        }),
    });

    if (!response.ok) {
        // Roll back the local subscription so state stays consistent.
        await subscription.unsubscribe();
        throw new Error('Failed to save push subscription');
    }

    return { supported: true, permission, subscribed: true };
}

export async function unsubscribeFromPush(): Promise<PushState> {
    if (!isPushSupported()) {
        return { supported: false, permission: 'denied', subscribed: false };
    }

    const registration = await getRegistration();
    const subscription = await registration?.pushManager.getSubscription();

    if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await fetch(destroy().url, {
            method: 'DELETE',
            headers: mutationHeaders(),
            credentials: 'same-origin',
            body: JSON.stringify({ endpoint }),
        });
    }

    return {
        supported: true,
        permission: Notification.permission,
        subscribed: false,
    };
}
