import { Bell, Check, Loader2, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { NotificationItem } from '@/components/notification-item';
import { Button } from '@/components/ui/button';
import {
    DropdownMenuContent,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationList() {
    const {
        notifications,
        isLoading,
        hasMore,
        fetchNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearRead,
    } = useNotifications();

    const [hasOpened, setHasOpened] = useState(false);
    const hasUnread = notifications.some((n) => !n.read_at);

    useEffect(() => {
        if (!hasOpened && notifications.length === 0) {
            void fetchNotifications();
            setHasOpened(true);
        }
    }, [hasOpened, notifications.length, fetchNotifications]);

    const handleLoadMore = () => void loadMore();
    const handleMarkAllAsRead = () => void markAllAsRead();
    const handleClearRead = () => void clearRead();

    return (
        <DropdownMenuContent
            align="end"
            className="w-[420px] max-w-[calc(100vw-2rem)] p-0"
        >
            <div className="flex items-center justify-between border-b bg-muted/50 px-4 py-3.5">
                <h3 className="text-base font-semibold text-foreground">
                    Notificaciones
                </h3>
                <div className="flex gap-1">
                    {hasUnread && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs hover:bg-background"
                            onClick={handleMarkAllAsRead}
                        >
                            <Check className="mr-1.5 h-3.5 w-3.5" />
                            Marcar todas
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-xs hover:bg-background"
                            onClick={handleClearRead}
                        >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Limpiar leídas
                        </Button>
                    )}
                </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto">
                {notifications.length === 0 && !isLoading && (
                    <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                            <Bell className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-foreground">
                            No hay notificaciones
                        </p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                            Te notificaremos cuando haya actualizaciones
                            importantes
                        </p>
                    </div>
                )}

                {notifications.map((notification) => (
                    <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={markAsRead}
                        onDelete={deleteNotification}
                    />
                ))}

                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {!isLoading && hasMore && (
                    <>
                        <DropdownMenuSeparator />
                        <div className="p-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full hover:bg-muted"
                                onClick={handleLoadMore}
                            >
                                Cargar más
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </DropdownMenuContent>
    );
}
