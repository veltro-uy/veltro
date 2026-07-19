import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import { VariantBadge } from '@/components/variant-badge';
import { useMatchCountdown } from '@/hooks/use-match-countdown';
import { formatDate, formatTime } from '@/lib/datetime';
import matches from '@/routes/matches';
import teams from '@/routes/teams';
import type { FootballMatch, Team } from '@/types';
import { Link } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin, Plus, Search, Users } from 'lucide-react';

function TeamSide({ team }: { team?: Team }) {
    if (!team) {
        return (
            <div className="flex flex-1 flex-col items-center gap-2">
                <div className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 sm:size-20">
                    <span className="text-xl text-muted-foreground/50">?</span>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                    Buscando rival
                </p>
            </div>
        );
    }
    return (
        <div className="flex flex-1 flex-col items-center gap-2">
            <TeamAvatar name={team.name} logoUrl={team.logo_url} size="2xl" />
            <h3 className="line-clamp-2 text-center text-sm font-bold sm:text-base">
                {team.name}
            </h3>
        </div>
    );
}

/**
 * The home page's focal element. Shows the user's next match with a live
 * countdown, or an inviting call-to-action when there's nothing scheduled.
 */
export function NextMatchSpotlight({
    match,
    hasTeams,
}: {
    match?: FootballMatch;
    hasTeams: boolean;
}) {
    const { countdown, hasStarted } = useMatchCountdown(
        match?.scheduled_at ?? null,
    );

    if (!match) {
        return (
            <div className="relative overflow-hidden rounded-2xl border border-dashed border-border p-8 text-center sm:p-10">
                <div
                    aria-hidden
                    className="bg-pitch-glow pointer-events-none absolute inset-0"
                />
                <div className="relative flex flex-col items-center gap-4">
                    <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                        <CalendarDays className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <p className="font-display text-xs font-bold tracking-[0.18em] text-primary uppercase">
                            {hasTeams ? 'Próximo partido' : 'Tu primer paso'}
                        </p>
                        <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                            {hasTeams
                                ? 'No tenés partidos próximos'
                                : 'Sumate a la acción'}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {hasTeams
                                ? 'Publicá un partido o buscá un rival disponible para jugar.'
                                : 'Creá o unite a un equipo para empezar a jugar partidos.'}
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        {hasTeams ? (
                            <>
                                <Button asChild>
                                    <Link href={matches.create().url}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Publicar partido
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link
                                        href={
                                            matches.index({
                                                query: { view: 'find' },
                                            }).url
                                        }
                                    >
                                        <Search className="mr-2 h-4 w-4" />
                                        Buscar rival
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button asChild>
                                    <Link href={teams.create().url}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Crear equipo
                                    </Link>
                                </Button>
                                <Button asChild variant="outline">
                                    <Link
                                        href={
                                            teams.index({
                                                query: { view: 'discover' },
                                            }).url
                                        }
                                    >
                                        <Users className="mr-2 h-4 w-4" />
                                        Descubrir equipos
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 p-6 sm:p-8">
            <div
                aria-hidden
                className="bg-pitch-glow pointer-events-none absolute inset-0 -z-10"
            />
            <div
                aria-hidden
                className="bg-grain pointer-events-none absolute inset-0 -z-10 opacity-[0.12]"
            />

            <p className="font-display text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Próximo partido
            </p>

            <div className="mt-5 flex items-center justify-between gap-3 sm:gap-8">
                <TeamSide team={match.home_team} />

                <div className="flex min-w-[92px] flex-col items-center gap-2">
                    {hasStarted ? (
                        <span className="font-display text-lg font-bold text-orange-500">
                            En juego
                        </span>
                    ) : countdown ? (
                        <div className="text-center">
                            <p className="font-display text-2xl font-bold tabular-nums sm:text-3xl">
                                {countdown}
                            </p>
                            <p className="mt-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                                para el inicio
                            </p>
                        </div>
                    ) : (
                        <span className="text-2xl font-bold text-muted-foreground">
                            vs
                        </span>
                    )}
                    <VariantBadge variant={match.variant} />
                </div>

                <TeamSide team={match.away_team} />
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(match.scheduled_at, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                    })}
                </span>
                <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {formatTime(match.scheduled_at, {
                        hour: 'numeric',
                        minute: '2-digit',
                    })}
                </span>
                {match.location && (
                    <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        <span className="line-clamp-1 max-w-[220px]">
                            {match.location}
                        </span>
                    </span>
                )}
            </div>

            <div className="mt-6 flex justify-center">
                <Button asChild>
                    <Link href={matches.show(match.public_id).url}>
                        Ver partido y confirmar disponibilidad
                    </Link>
                </Button>
            </div>
        </div>
    );
}
