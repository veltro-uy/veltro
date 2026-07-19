import { formatDate, formatTime } from '@/lib/datetime';
import {
    ArrowRightLeft,
    Circle,
    Footprints,
    type LucideIcon,
    RectangleVertical,
    Target,
} from 'lucide-react';

export const getMatchStatusColor = (status: string): string => {
    switch (status) {
        case 'available':
            return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
        case 'confirmed':
            return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
        case 'in_progress':
            return 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20';
        case 'completed':
            return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
        case 'cancelled':
            return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
        default:
            return 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
    }
};

export const getMatchStatusText = (status: string): string => {
    switch (status) {
        case 'available':
            return 'Disponible';
        case 'confirmed':
            return 'Confirmado';
        case 'in_progress':
            return 'En Vivo';
        case 'completed':
            return 'Completado';
        case 'cancelled':
            return 'Cancelado';
        default:
            return status;
    }
};

export const formatMatchDate = (dateString: string | null): string => {
    if (!dateString) return 'Por programar';
    return formatDate(dateString, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
};

export const formatMatchTime = (dateString: string | null): string => {
    if (!dateString) return '—';
    return formatTime(dateString, {
        hour: 'numeric',
        minute: '2-digit',
    });
};

export interface EventVisual {
    icon: LucideIcon;
    label: string;
    colorClass: string;
}

/**
 * Maps a match `event_type` to the icon, Spanish label, and colour used to
 * render it in the timeline. Covers every value of the `match_events`
 * `event_type` enum; unknown types fall back to a neutral dot so the timeline
 * never renders blank as new event types are added.
 */
export const getEventVisual = (eventType: string): EventVisual => {
    switch (eventType) {
        case 'goal':
            return { icon: Target, label: 'Gol', colorClass: 'text-green-600' };
        case 'assist':
            return {
                icon: Footprints,
                label: 'Asistencia',
                colorClass: 'text-blue-500',
            };
        case 'yellow_card':
            return {
                icon: RectangleVertical,
                label: 'Tarjeta amarilla',
                colorClass: 'text-yellow-500',
            };
        case 'red_card':
            return {
                icon: RectangleVertical,
                label: 'Tarjeta roja',
                colorClass: 'text-red-600',
            };
        case 'substitution_in':
            return {
                icon: ArrowRightLeft,
                label: 'Entra',
                colorClass: 'text-green-600',
            };
        case 'substitution_out':
            return {
                icon: ArrowRightLeft,
                label: 'Sale',
                colorClass: 'text-orange-500',
            };
        default:
            return {
                icon: Circle,
                label: 'Evento',
                colorClass: 'text-muted-foreground',
            };
    }
};
