/**
 * Shared tournament presentation metadata. Keeps status styling and capacity
 * coloring in one place so the index cards, the detail hero, and any future
 * surface read as one system (mirrors the approach in `lib/variants.ts`).
 */
import type { TournamentStatus } from '@/types';

export interface TournamentStatusMeta {
    label: string;
    /** Classes for a status <Badge> (brand-tinted). */
    badgeClassName: string;
    /** Classes for a small status dot. */
    dotClassName: string;
}

export const TOURNAMENT_STATUS_META: Record<
    TournamentStatus,
    TournamentStatusMeta
> = {
    draft: {
        label: 'Borrador',
        badgeClassName: 'bg-muted text-muted-foreground',
        dotClassName: 'bg-muted-foreground',
    },
    registration_open: {
        label: 'Inscripción abierta',
        badgeClassName: 'bg-primary/10 text-primary',
        dotClassName: 'bg-primary',
    },
    in_progress: {
        label: 'En juego',
        badgeClassName: 'bg-primary/10 text-primary',
        dotClassName: 'bg-primary',
    },
    completed: {
        label: 'Finalizado',
        badgeClassName: 'bg-muted text-muted-foreground',
        dotClassName: 'bg-muted-foreground',
    },
    cancelled: {
        label: 'Cancelado',
        badgeClassName: 'bg-destructive/10 text-destructive',
        dotClassName: 'bg-destructive',
    },
};

/** Human label for a tournament format. */
export const TOURNAMENT_FORMAT_LABELS: Record<string, string> = {
    single_elimination: 'Eliminación directa',
    league: 'Liga',
    group_stage_knockout: 'Grupos + Eliminación',
};

export function tournamentFormatLabel(format: string): string {
    return TOURNAMENT_FORMAT_LABELS[format] ?? format;
}

/**
 * Brand capacity-bar color for a registered/max ratio — same thresholds as the
 * teams `CapacityBar`: red when full, orange when nearly full, brand otherwise.
 */
export function tournamentCapacityColor(current: number, max: number): string {
    const pct = max > 0 ? (current / max) * 100 : 0;
    if (pct >= 100) return 'bg-destructive';
    if (pct >= 80) return 'bg-orange-500';
    return 'bg-primary';
}
