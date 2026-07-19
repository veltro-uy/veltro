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
 * Minute-ordered feed of every match event as a single vertical rail. Each row
 * shows the minute, an event icon, the player, and the team crest — reading
 * top-to-bottom like a match commentary. This is the single event view: goals
 * are recorded from the hero's score buttons and deleted from here by the
 * relevant team's leader.
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
                    <ol>
                        {ordered.map((event, index) => {
                            const isHome =
                                Number(event.team_id) === Number(homeTeam.id);
                            const team = isHome ? homeTeam : awayTeam;
                            const {
                                icon: Icon,
                                label,
                                colorClass,
                            } = getEventVisual(event.event_type);
                            const deletable =
                                canDelete &&
                                event.event_type === 'goal' &&
                                (isHome ? isHomeLeader : isAwayLeader);

                            return (
                                <li
                                    key={event.id}
                                    className="flex items-stretch gap-3"
                                >
                                    {/* Minute */}
                                    <div className="flex w-10 shrink-0 items-center justify-end">
                                        <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                                            {event.minute != null
                                                ? `${event.minute}'`
                                                : '·'}
                                        </span>
                                    </div>

                                    {/* Rail with node */}
                                    <div className="relative flex w-3 shrink-0 flex-col items-center">
                                        <span
                                            className={cn(
                                                'w-px flex-1 bg-border',
                                                index === 0 && 'opacity-0',
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'my-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-background bg-current',
                                                colorClass,
                                            )}
                                        />
                                        <span
                                            className={cn(
                                                'w-px flex-1 bg-border',
                                                index === ordered.length - 1 &&
                                                    'opacity-0',
                                            )}
                                        />
                                    </div>

                                    {/* Event card */}
                                    <div className="group my-1.5 flex flex-1 items-center gap-2.5 rounded-xl border bg-card px-3 py-2 transition-colors hover:bg-muted/40">
                                        <Icon
                                            className={cn(
                                                'h-4 w-4 shrink-0',
                                                colorClass,
                                            )}
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p
                                                className={cn(
                                                    'truncate text-sm font-medium',
                                                    !event.user &&
                                                        'text-muted-foreground italic',
                                                )}
                                            >
                                                {event.user?.name ??
                                                    'Sin asignar'}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {event.description
                                                    ? `${label} · ${event.description}`
                                                    : label}
                                            </p>
                                        </div>
                                        {team && (
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="hidden max-w-[7rem] truncate text-xs text-muted-foreground sm:inline">
                                                    {team.name}
                                                </span>
                                                <TeamAvatar
                                                    name={team.name}
                                                    logoUrl={team.logo_url}
                                                    size="sm"
                                                    className="h-6 w-6"
                                                />
                                            </div>
                                        )}
                                        {deletable && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                                                aria-label="Eliminar gol"
                                                onClick={() =>
                                                    setGoalToDelete(event.id)
                                                }
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ol>
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
