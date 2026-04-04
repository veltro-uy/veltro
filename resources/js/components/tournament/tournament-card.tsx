import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { VariantBadge } from '@/components/variant-badge';
import { cn } from '@/lib/utils';
import type { Tournament } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, Calendar, Trophy, Users } from 'lucide-react';

interface TournamentCardProps {
    tournament: Tournament;
    className?: string;
}

const statusConfig = {
    draft: { label: 'Borrador', variant: 'secondary' as const },
    registration_open: {
        label: 'Inscripción Abierta',
        variant: 'default' as const,
    },
    in_progress: { label: 'En Progreso', variant: 'default' as const },
    completed: { label: 'Completado', variant: 'outline' as const },
    cancelled: { label: 'Cancelado', variant: 'destructive' as const },
};

const getCapacityColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'text-destructive';
    if (percentage >= 80) return 'text-orange-500';
    return 'text-muted-foreground';
};

export const TournamentCard = ({
    tournament,
    className,
}: TournamentCardProps) => {
    const config = statusConfig[tournament.status];
    const registeredCount = tournament.registered_teams_count || 0;

    return (
        <Card
            className={cn(
                'group flex flex-col transition-all hover:border-primary/20 hover:shadow-lg',
                className,
            )}
        >
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <Avatar className="size-10 rounded-lg">
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
                        <CardTitle className="line-clamp-1 text-lg">
                            {tournament.name}
                        </CardTitle>
                        <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge
                                variant={config.variant}
                                className="text-xs"
                            >
                                {config.label}
                            </Badge>
                            <VariantBadge variant={tournament.variant} />
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
                {tournament.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {tournament.description}
                    </p>
                )}

                <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                Equipos
                            </span>
                        </div>
                        <span
                            className={`text-sm font-bold ${getCapacityColor(registeredCount, tournament.max_teams)}`}
                        >
                            {registeredCount}/{tournament.max_teams}
                        </span>
                    </div>

                    {tournament.starts_at && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
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

                    <Button asChild variant="outline" className="w-full">
                        <Link href={`/tournaments/${tournament.id}`}>
                            Ver Torneo
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
