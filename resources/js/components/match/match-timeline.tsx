import type { MatchEvent } from '@/components/match/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getEventVisual } from '@/lib/match-format';
import { cn } from '@/lib/utils';

interface MatchTimelineProps {
    events: MatchEvent[];
    homeTeamId: number;
    emptyMessage?: string;
}

/**
 * Read-only, merged, minute-ordered feed of every match event. Home-team events
 * sit on the left of a central spine, away-team events on the right — mirroring
 * the hero's home-left/away-right convention. Goal recording and deletion live
 * in the hero's per-crest `GoalScorersList`; this component never mutates.
 */
export function MatchTimeline({
    events,
    homeTeamId,
    emptyMessage = 'El partido aún no comenzó. Los eventos aparecerán acá.',
}: MatchTimelineProps) {
    const ordered = [...events].sort(
        (a, b) => (a.minute ?? 0) - (b.minute ?? 0),
    );

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
                    <div className="relative">
                        {/* Central spine */}
                        <span
                            aria-hidden
                            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border"
                        />
                        <ol className="relative space-y-3">
                            {ordered.map((event) => {
                                const isHome =
                                    Number(event.team_id) ===
                                    Number(homeTeamId);
                                const {
                                    icon: Icon,
                                    label,
                                    colorClass,
                                } = getEventVisual(event.event_type);

                                return (
                                    <li
                                        key={event.id}
                                        className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
                                    >
                                        {/* Home side */}
                                        <div className="flex justify-end">
                                            {isHome && (
                                                <EventChip
                                                    icon={Icon}
                                                    colorClass={colorClass}
                                                    label={label}
                                                    name={event.user?.name}
                                                    description={
                                                        event.description
                                                    }
                                                    align="right"
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
                                                    icon={Icon}
                                                    colorClass={colorClass}
                                                    label={label}
                                                    name={event.user?.name}
                                                    description={
                                                        event.description
                                                    }
                                                    align="left"
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
        </Card>
    );
}

interface EventChipProps {
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
    label: string;
    name?: string;
    description?: string;
    align: 'left' | 'right';
}

function EventChip({
    icon: Icon,
    colorClass,
    label,
    name,
    description,
    align,
}: EventChipProps) {
    return (
        <div
            className={cn(
                'inline-flex max-w-full items-center gap-2 rounded-lg border bg-card px-3 py-1.5',
                align === 'right' && 'flex-row-reverse text-right',
            )}
        >
            <Icon className={cn('h-4 w-4 shrink-0', colorClass)} />
            <div className="min-w-0">
                <p
                    className={cn(
                        'truncate text-sm font-medium',
                        !name && 'text-muted-foreground italic',
                    )}
                >
                    {name ?? 'Sin asignar'}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                    {description ? `${label} · ${description}` : label}
                </p>
            </div>
        </div>
    );
}
