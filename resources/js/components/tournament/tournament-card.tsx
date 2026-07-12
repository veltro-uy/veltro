import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VariantBadge } from '@/components/variant-badge';
import { formatDate } from '@/lib/datetime';
import {
    TOURNAMENT_STATUS_META,
    tournamentCapacityColor,
} from '@/lib/tournament';
import { cn } from '@/lib/utils';
import tournaments from '@/routes/tournaments';
import type { Tournament } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, Calendar, Trophy, Users } from 'lucide-react';

interface TournamentCardProps {
    tournament: Tournament;
    className?: string;
}

export const TournamentCard = ({
    tournament,
    className,
}: TournamentCardProps) => {
    const status = TOURNAMENT_STATUS_META[tournament.status];
    const registered = tournament.registered_teams_count ?? 0;
    const max = tournament.max_teams;
    const pct =
        max > 0 ? Math.min(100, Math.round((registered / max) * 100)) : 0;
    const isFull = registered >= max;

    return (
        <Card
            className={cn(
                'group flex flex-col overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
                className,
            )}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <Avatar className="size-12 rounded-lg">
                        {tournament.logo_url && (
                            <AvatarImage
                                src={tournament.logo_url}
                                alt={tournament.name}
                            />
                        )}
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                            <Trophy className="size-5" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-1 text-base">
                            {tournament.name}
                        </CardTitle>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge
                                variant="secondary"
                                className={status.badgeClassName}
                            >
                                {status.label}
                            </Badge>
                            <VariantBadge variant={tournament.variant} />
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
                {tournament.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {tournament.description}
                    </p>
                ) : (
                    <p className="text-sm text-muted-foreground/60 italic">
                        Sin descripción
                    </p>
                )}

                {/* Capacity */}
                <div>
                    <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            Equipos
                        </span>
                        <span className="font-semibold tabular-nums">
                            {registered}
                            <span className="text-muted-foreground">
                                /{max}
                            </span>
                            {isFull && (
                                <span className="ml-1 font-medium text-destructive">
                                    · Completo
                                </span>
                            )}
                        </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                tournamentCapacityColor(registered, max),
                            )}
                            style={{ width: `${Math.max(pct, 4)}%` }}
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {tournament.starts_at ? (
                        <>
                            <Calendar className="h-4 w-4" />
                            <span>
                                {formatDate(tournament.starts_at, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </span>
                        </>
                    ) : (
                        <>
                            <Trophy className="h-4 w-4" />
                            <span>Fecha por definir</span>
                        </>
                    )}
                </div>

                <Button asChild variant="outline" className="mt-auto w-full">
                    <Link href={tournaments.show(tournament.id).url}>
                        Ver torneo
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
};
