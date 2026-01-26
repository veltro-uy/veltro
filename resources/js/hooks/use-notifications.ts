import { router, usePage } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

import type { Notification, PaginatedNotifications, SharedData } from '@/types';

interface UseNotificationsReturn {
    unreadCount: number;
    notifications: Notification[];
    isLoading: boolean;
    hasMore: boolean;
    fetchNotifications: () => Promise<void>;
    loadMore: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    clearRead: () => Promise<void>;
    refresh: () => Promise<void>;
}

const POLLING_INTERVAL = 45000; // 45 seconds

export function useNotifications(): UseNotificationsReturn {
    const page = usePage<SharedData>();
    const isAuthenticated = !!page.props.auth?.user;

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Poll for unread count
    const fetchUnreadCount = useCallback(async () => {
        if (!isAuthenticated) return;

        try {
            const response = await fetch('/notifications/unread-count', {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            // Only parse JSON for successful responses with correct content type
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const data = await response.json();
                    setUnreadCount(data.count);
                }
            }
        } catch (error) {
            // Silently ignore errors when not authenticated or during navigation
            console.error('Failed to fetch unread count:', error);
        }
    }, [isAuthenticated]);

    // Fetch notifications with pagination
    const fetchNotifications = useCallback(async (page = 1) => {
        if (!isAuthenticated) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/notifications?page=${page}`, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            // Only parse JSON for successful responses with correct content type
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType?.includes('application/json')) {
                    const data: PaginatedNotifications = await response.json();
                    if (page === 1) {
                        setNotifications(data.data);
                    } else {
                        setNotifications((prev) => [...prev, ...data.data]);
                    }
                    setCurrentPage(data.current_page);
                    setHasMore(data.current_page < data.last_page);
                }
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            toast.error('Error al cargar notificaciones');
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated]);

    // Load more notifications
    const loadMore = useCallback(async () => {
        if (!isLoading && hasMore) {
            await fetchNotifications(currentPage + 1);
        }
    }, [currentPage, hasMore, isLoading, fetchNotifications]);

    // Mark single notification as read
    const markAsRead = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) =>
                        n.id === id
                            ? { ...n, read_at: new Date().toISOString() }
                            : n,
                    ),
                );
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            const response = await fetch('/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setNotifications((prev) =>
                    prev.map((n) => ({
                        ...n,
                        read_at: new Date().toISOString(),
                    })),
                );
                setUnreadCount(0);
                toast.success('Todas las notificaciones marcadas como leídas');
            }
        } catch (error) {
            console.error('Failed to mark all as read:', error);
            toast.error('Error al marcar todas como leídas');
        }
    }, []);

    // Delete single notification
    const deleteNotification = useCallback(async (id: string) => {
        try {
            const response = await fetch(`/notifications/${id}`, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((n) => n.id !== id));
                toast.success('Notificación eliminada');
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Error al eliminar notificación');
        }
    }, []);

    // Clear all read notifications
    const clearRead = useCallback(async () => {
        try {
            const response = await fetch('/notifications/clear-read', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setNotifications((prev) => prev.filter((n) => !n.read_at));
                toast.success('Notificaciones leídas eliminadas');
            }
        } catch (error) {
            console.error('Failed to clear read notifications:', error);
            toast.error('Error al eliminar notificaciones');
        }
    }, []);

    // Refresh both count and notifications
    const refresh = useCallback(async () => {
        await Promise.all([fetchUnreadCount(), fetchNotifications(1)]);
    }, [fetchUnreadCount, fetchNotifications]);

    // Setup polling for unread count (only when authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;

        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, POLLING_INTERVAL);
        return () => clearInterval(interval);
    }, [fetchUnreadCount, isAuthenticated]);

    // Listen for custom refresh events (only when authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;

        const handleRefresh = () => {
            void refresh();
        };

        window.addEventListener('notifications:refresh', handleRefresh);
        return () =>
            window.removeEventListener('notifications:refresh', handleRefresh);
    }, [refresh, isAuthenticated]);

    // Listen for Inertia navigation to refresh notifications (only when authenticated)
    useEffect(() => {
        if (!isAuthenticated) return;

        const removeListener = router.on('finish', () => {
            // Small delay to ensure navigation is fully complete
            setTimeout(() => {
                void fetchUnreadCount();
            }, 100);
        });

        return () => removeListener();
    }, [fetchUnreadCount, isAuthenticated]);

    return {
        unreadCount,
        notifications,
        isLoading,
        hasMore,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearRead,
        refresh,
    };
}
