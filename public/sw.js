/* Veltro service worker — Web Push delivery.
 *
 * Kept intentionally minimal: it only handles push display and click routing.
 * It is served from the web root (/sw.js) so its scope covers the whole app.
 */

self.addEventListener('install', () => {
    // Activate immediately so pushes work on first subscribe without a reload.
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    let payload = {};
    try {
        payload = event.data.json();
    } catch {
        payload = { title: 'Veltro', body: event.data.text() };
    }

    const title = payload.title || 'Veltro';
    const options = {
        body: payload.body || '',
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        tag: payload.tag,
        data: payload.data || {},
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    const url = event.notification.data && event.notification.data.url;
    const target = url || '/';

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus an existing tab on the same origin if we can.
                for (const client of clientList) {
                    if ('focus' in client) {
                        client.focus();
                        if ('navigate' in client && url) {
                            return client.navigate(target);
                        }
                        return undefined;
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(target);
                }
                return undefined;
            }),
    );
});
