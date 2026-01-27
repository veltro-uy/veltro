import { Bell } from 'lucide-react';

import { NotificationList } from '@/components/notification-list';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';

export function NotificationBell() {
    const { unreadCount } = useNotifications();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 hover:bg-accent"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background ring-2 ring-background">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                    <span className="sr-only">
                        Notificaciones{' '}
                        {unreadCount > 0 && `(${unreadCount} sin leer)`}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <NotificationList />
        </DropdownMenu>
    );
}
