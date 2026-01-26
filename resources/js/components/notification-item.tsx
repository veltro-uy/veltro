import { router } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    CheckCircle,
    Clock,
    Target,
    Trash2,
    Trophy,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { type ComponentType } from 'react';

import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: (id: string) => void;
    onDelete: (id: string) => void;
}

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
    Trophy,
    CheckCircle,
    XCircle,
    X,
    Target,
    Clock,
    Users,
};

const iconColorMap: Record<string, string> = {
    match_request_received: 'text-emerald-600 dark:text-emerald-500',
    match_request_accepted: 'text-green-600 dark:text-green-500',
    match_request_rejected: 'text-red-600 dark:text-red-500',
    match_cancelled: 'text-orange-600 dark:text-orange-500',
    match_score_updated: 'text-amber-600 dark:text-amber-500',
    availability_reminder: 'text-sky-600 dark:text-sky-500',
    team_invitation: 'text-violet-600 dark:text-violet-500',
};

const iconBgMap: Record<string, string> = {
    match_request_received: 'bg-emerald-50 dark:bg-emerald-950/20',
    match_request_accepted: 'bg-green-50 dark:bg-green-950/20',
    match_request_rejected: 'bg-red-50 dark:bg-red-950/20',
    match_cancelled: 'bg-orange-50 dark:bg-orange-950/20',
    match_score_updated: 'bg-amber-50 dark:bg-amber-950/20',
    availability_reminder: 'bg-sky-50 dark:bg-sky-950/20',
    team_invitation: 'bg-violet-50 dark:bg-violet-950/20',
};

export function NotificationItem({
    notification,
    onMarkAsRead,
    onDelete,
}: NotificationItemProps) {
    const Icon = iconMap[notification.data.icon] || Trophy;
    const isUnread = !notification.read_at;

    const handleClick = () => {
        if (isUnread) {
            onMarkAsRead(notification.id);
        }
        router.visit(notification.data.action_url);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(notification.id);
    };

    return (
        <div
            className={cn(
                'group relative flex items-start gap-3.5 border-b px-4 py-3.5 transition-all hover:bg-muted/40',
                isUnread
                    ? 'border-l-2 border-l-foreground bg-muted/30 hover:bg-muted/50'
                    : 'border-l-2 border-l-transparent',
            )}
        >
            <div
                className={cn(
                    'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full',
                    iconBgMap[notification.data.type] ||
                        'bg-muted dark:bg-muted/50',
                )}
            >
                <Icon
                    className={cn(
                        'h-5 w-5',
                        iconColorMap[notification.data.type] ||
                            'text-muted-foreground',
                    )}
                />
            </div>

            <button
                type="button"
                onClick={handleClick}
                className="min-w-0 flex-1 cursor-pointer text-left"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                        <p
                            className={cn(
                                'text-sm leading-tight',
                                isUnread
                                    ? 'font-semibold text-foreground'
                                    : 'font-medium text-foreground/90',
                            )}
                        >
                            {notification.data.title}
                        </p>
                        <p className="text-sm leading-snug text-muted-foreground">
                            {notification.data.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                            {formatDistanceToNow(
                                new Date(notification.created_at),
                                {
                                    addSuffix: true,
                                    locale: es,
                                },
                            )}
                        </p>
                    </div>
                    {isUnread && (
                        <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-foreground ring-2 ring-background" />
                    )}
                </div>
            </button>

            <TooltipProvider delayDuration={0}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">
                                Eliminar notificación
                            </span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Eliminar</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}
