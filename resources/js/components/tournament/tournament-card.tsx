import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { VariantBadge } from '@/components/variant-badge';
import { cn } from '@/lib/utils';
import type { Tournament } from '@/types';
import { Link } from '@inertiajs/react';
import { Calendar, Crown, TrendingUp, Trophy, Users } from 'lucide-react';

interface TournamentCardProps {
    tournament: Tournament;
    className?: string;
}

const statusConfig = {
    draft: {
        label: 'Borrador',
        variant: 'secondary' as const,
    },
    registration_open: {
        label: 'Inscripción Abierta',
        variant: 'default' as const,
    },
    in_progress: {
        label: 'En Progreso',
        variant: 'default' as const,
    },
    completed: {
        label: 'Completado',
        variant: 'outline' as const,
    },
    cancelled: {
        label: 'Cancelado',
        variant: 'destructive' as const,
    },
};

export const TournamentCard = ({
    tournament,
    className,
}: TournamentCardProps) => {
    const config = statusConfig[tournament.status];
    const registrationProgress =
        tournament.max_teams > 0
            ? ((tournament.registered_teams_count || 0) /
                  tournament.max_teams) *
              100
            : 0;
    const isAlmostFull = registrationProgress >= 80;
    const isFull = registrationProgress >= 100;

    return (
        <Link href={`/tournaments/${tournament.id}`}>
            <Card
                className={cn(
                    'group relative h-full transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg',
                    className,
                )}
            >
                {/* Status indicator strip - subtle */}
                {tournament.status === 'registration_open' && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-500" />
                )}
                {tournament.status === 'in_progress' && (
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-orange-500" />
                )}

                <CardHeader className="space-y-3 pb-4">
                    <div className="flex items-start justify-between gap-3">
                        <CardTitle className="line-clamp-2 text-lg leading-tight">
                            {tournament.name}
                        </CardTitle>
                        <div className="flex-shrink-0">
                            {tournament.status === 'completed' ? (
                                <div className="rounded-lg bg-yellow-500/10 p-2">
                                    <Crown className="size-5 text-yellow-600 dark:text-yellow-500" />
                                </div>
                            ) : tournament.status === 'in_progress' ? (
                                <div className="rounded-lg bg-orange-500/10 p-2">
                                    <TrendingUp className="size-5 text-orange-600 dark:text-orange-400" />
                                </div>
                            ) : (
                                <div className="rounded-lg bg-primary/10 p-2 transition-colors group-hover:bg-primary/20">
                                    <Trophy className="size-5 text-primary" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Badge variant={config.variant} className="text-xs">
                            {config.label}
                        </Badge>
                        <VariantBadge variant={tournament.variant} />
                        {isAlmostFull && !isFull && (
                            <Badge
                                variant="outline"
                                className="border-orange-500/50 text-xs text-orange-700 dark:text-orange-400"
                            >
                                Casi lleno
                            </Badge>
                        )}
                        {isFull && (
                            <Badge
                                variant="outline"
                                className="border-red-500/50 text-xs text-red-700 dark:text-red-400"
                            >
                                Completo
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                    {tournament.description && (
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                            {tournament.description}
                        </p>
                    )}

                    {/* Registration progress */}
                    {tournament.status !== 'completed' &&
                        tournament.status !== 'cancelled' && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">
                                        Inscripciones
                                    </span>
                                    <span className="font-medium">
                                        {tournament.registered_teams_count || 0}{' '}
                                        / {tournament.max_teams}
                                    </span>
                                </div>
                                <Progress
                                    value={registrationProgress}
                                    className="h-1.5"
                                />
                            </div>
                        )}

                    <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm">
                            <div className="rounded-lg bg-primary/10 p-1.5">
                                <Users className="size-3.5 text-primary" />
                            </div>
                            <span className="text-muted-foreground">
                                <span className="font-semibold text-foreground">
                                    {tournament.registered_teams_count || 0}
                                </span>{' '}
                                equipos registrados
                            </span>
                        </div>

                        {tournament.starts_at && (
                            <div className="flex items-center gap-2.5 text-sm">
                                <div className="rounded-lg bg-blue-500/10 p-1.5">
                                    <Calendar className="size-3.5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-muted-foreground">
                                    {new Date(
                                        tournament.starts_at,
                                    ).toLocaleDateString('es-UY', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}

                        {tournament.organizer && (
                            <div className="flex items-center gap-2.5 pt-1">
                                <div className="flex size-6 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                                    {tournament.organizer.name
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                                <span className="truncate text-xs text-muted-foreground">
                                    Por {tournament.organizer.name}
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};
