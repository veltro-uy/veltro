import type { MatchEvent, MatchPageTeam } from '@/components/match/types';
import { TeamAvatar } from '@/components/team-avatar';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEventVisual } from '@/lib/match-format';
import { cn } from '@/lib/utils';
import matchEvents from '@/routes/match-events';
import { router } from '@inertiajs/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

type TimelineTeam = Pick<MatchPageTeam, 'id' | 'name' | 'logo_url'>;

interface MatchTimelineProps {
    events: MatchEvent[];
    homeTeam: TimelineTeam;
    awayTeam?: TimelineTeam;
    isHomeLeader: boolean;
    isAwayLeader: boolean;
    matchStatus: string;
    emptyMessage?: string;
}

/**
 * Merged, minute-ordered feed of every match event. Home-team events sit on the
 * left of a central spine, away-team events on the right — mirroring the hero's
 * home-left/away-right convention. This is the single event view: goals are
 * recorded from the hero's score buttons and deleted from here by the relevant
 * team's leader.
 */
export function MatchTimeline({
    events,
    homeTeam,
    awayTeam,
    isHomeLeader,
    isAwayLeader,
    matchStatus,
    emptyMessage = 'El partido aún no comenzó. Los eventos aparecerán acá.',
}: MatchTimelineProps) {
    const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

    const ordered = [...events].sort(
        (a, b) => (a.minute ?? 0) - (b.minute ?? 0),
    );

    const canDelete =
        matchStatus === 'in_progress' || matchStatus === 'completed';

    const handleDelete = () => {
        if (goalToDelete === null) return;
        router.delete(matchEvents.destroy(goalToDelete).url, {
            preserveScroll: true,
            onSuccess: () => {
                setGoalToDelete(null);
                toast.success('Gol eliminado exitosamente');
            },
            onError: () => {
                setGoalToDelete(null);
                toast.error('Error al eliminar el gol');
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cronología</CardTitle>
            </CardHeader>
            <CardContent>
                {ordered.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                        {emptyMessage}
                    </p>
                ) : (
                    <div className="relative mx-auto max-w-xl">
                        {/* Central spine */}
                        <span
                            aria-hidden
                            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border"
                        />
                        <ol className="relative space-y-3">
                            {ordered.map((event) => {
                                const isHome =
                                    Number(event.team_id) ===
                                    Number(homeTeam.id);
                                const team = isHome ? homeTeam : awayTeam;
                                const visual = getEventVisual(event.event_type);
                                const deletable =
                                    canDelete &&
                                    event.event_type === 'goal' &&
                                    (isHome ? isHomeLeader : isAwayLeader);

                                return (
                                    <li
                                        key={event.id}
                                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
                                    >
                                        {/* Home side */}
                                        <div className="flex justify-end">
                                            {isHome && (
                                                <EventChip
                                                    visual={visual}
                                                    name={event.user?.name}
                                                    description={
                                                        event.description
                                                    }
                                                    team={team}
                                                    side="home"
                                                    deletable={deletable}
                                                    onDelete={() =>
                                                        setGoalToDelete(
                                                            event.id,
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>

                                        {/* Minute marker on the spine */}
                                        <span className="z-10 rounded-full border bg-background px-2 py-0.5 text-xs font-semibold tabular-nums">
                                            {event.minute != null
                                                ? `${event.minute}'`
                                                : '·'}
                                        </span>

                                        {/* Away side */}
                                        <div className="flex justify-start">
                                            {!isHome && (
                                                <EventChip
                                                    visual={visual}
                                                    name={event.user?.name}
                                                    description={
                                                        event.description
                                                    }
                                                    team={team}
                                                    side="away"
                                                    deletable={deletable}
                                                    onDelete={() =>
                                                        setGoalToDelete(
                                                            event.id,
                                                        )
                                                    }
                                                />
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                )}
            </CardContent>

            <AlertDialog
                open={goalToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setGoalToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Gol</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar este gol? Esta
                            acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}

interface EventChipProps {
    visual: ReturnType<typeof getEventVisual>;
    name?: string;
    description?: string;
    team?: TimelineTeam;
    side: 'home' | 'away';
    deletable: boolean;
    onDelete: () => void;
}

function EventChip({
    visual,
    name,
    description,
    team,
    side,
    deletable,
    onDelete,
}: EventChipProps) {
    const { icon: Icon, label, colorClass } = visual;
    const isHome = side === 'home';

    return (
        <div
            className={cn(
                'group inline-flex max-w-full items-center gap-2 rounded-lg border bg-card px-2.5 py-1.5',
                isHome && 'flex-row-reverse text-right',
            )}
        >
            {team && (
                <TeamAvatar
                    name={team.name}
                    logoUrl={team.logo_url}
                    size="sm"
                    className="h-6 w-6 shrink-0"
                />
            )}
            <div className="min-w-0">
                <p
                    className={cn(
                        'flex items-center gap-1 text-sm font-medium',
                        isHome && 'flex-row-reverse',
                        !name && 'text-muted-foreground italic',
                    )}
                >
                    <Icon className={cn('h-3.5 w-3.5 shrink-0', colorClass)} />
                    <span className="truncate">{name ?? 'Sin asignar'}</span>
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {description ? `${label} · ${description}` : label}
                </p>
            </div>
            {deletable && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label="Eliminar gol"
                    onClick={onDelete}
                >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
            )}
        </div>
    );
}
