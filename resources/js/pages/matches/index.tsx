import { MatchCard } from '@/components/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useNavigationPending } from '@/hooks/use-navigation-pending';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import matches from '@/routes/matches';
import teamsRoute from '@/routes/teams';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    History,
    Plus,
    Search,
    Trophy,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Partidos',
        href: matches.index().url,
    },
];

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
}

function PublishMatchButton({ teams }: { teams: Team[] }) {
    if (teams.length === 0) {
        return (
            <Button disabled>
                <Plus className="mr-2 h-4 w-4" />
                Publicar Partido
            </Button>
        );
    }
    return (
        <Button asChild>
            <Link href={matches.create().url}>
                <Plus className="mr-2 h-4 w-4" />
                Publicar Partido
            </Link>
        </Button>
    );
}

interface Match {
    id: number;
    home_team_id: number;
    away_team_id?: number;
    variant: string;
    scheduled_at: string | null;
    location: string | null;
    match_type: string;
    status: string;
    home_score?: number;
    away_score?: number;
    notes?: string;
    home_team: Team;
    away_team?: Team;
}

interface PaginatedMatches {
    data: Match[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    per_page: number;
    total: number;
}

interface Props {
    myMatches: Match[];
    availableMatches: PaginatedMatches;
    teams: Team[];
    hasTeams: boolean;
    filters: {
        search: string;
    };
}

export default function Index({
    myMatches,
    availableMatches,
    teams,
    hasTeams,
    filters,
}: Props) {
    const [activeView, setActiveView] = useState<'my-matches' | 'find-matches'>(
        'my-matches',
    );
    const [matchesTab, setMatchesTab] = useState<'upcoming' | 'history'>(
        'upcoming',
    );
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');
    const [isPending, pendingHandlers] = useNavigationPending();

    const updateFilters = useCallback(
        (updates: { search?: string; page?: number | null }) => {
            const search =
                updates.search !== undefined ? updates.search : filters.search;

            router.get(
                matches.index().url,
                {
                    search: search.trim() === '' ? undefined : search.trim(),
                    page: updates.page ?? undefined,
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: true,
                    ...pendingHandlers,
                },
            );
        },
        [filters.search, pendingHandlers],
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (searchQuery !== (filters.search ?? '')) {
                updateFilters({ search: searchQuery, page: null });
            }
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters.search, searchQuery, updateFilters]);

    const pageNumbers = useMemo(() => {
        const start = Math.max(1, availableMatches.current_page - 2);
        const end = Math.min(
            availableMatches.last_page,
            availableMatches.current_page + 2,
        );

        return Array.from(
            { length: end - start + 1 },
            (_, index) => start + index,
        );
    }, [availableMatches.current_page, availableMatches.last_page]);

    // Split matches into upcoming and past
    const { upcomingMatches, pastMatches } = useMemo(() => {
        const now = new Date();
        const upcoming: Match[] = [];
        const past: Match[] = [];

        for (const match of myMatches) {
            const matchDate = match.scheduled_at
                ? new Date(match.scheduled_at)
                : null;
            // Consider a match as "past" if it's completed OR if the scheduled time has passed
            if (
                match.status === 'completed' ||
                match.status === 'cancelled' ||
                (matchDate && matchDate < now)
            ) {
                past.push(match);
            } else {
                upcoming.push(match);
            }
        }

        const dateValue = (m: Match) =>
            m.scheduled_at ? new Date(m.scheduled_at).getTime() : Infinity;

        // Sort upcoming by date ascending (soonest first; unscheduled at the end)
        upcoming.sort((a, b) => dateValue(a) - dateValue(b));
        // Sort past by date descending (most recent first)
        past.sort(
            (a, b) =>
                (b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0) -
                (a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0),
        );

        return { upcomingMatches: upcoming, pastMatches: past };
    }, [myMatches]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Partidos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Partidos
                        </h1>
                        <p className="text-muted-foreground">
                            Encuentra rivales y gestiona los partidos de tu
                            equipo
                        </p>
                    </div>
                    <PublishMatchButton teams={teams} />
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <ToggleGroup
                        type="single"
                        value={activeView}
                        onValueChange={(value) => {
                            if (value)
                                setActiveView(
                                    value as 'my-matches' | 'find-matches',
                                );
                        }}
                        className="justify-start"
                    >
                        <ToggleGroupItem
                            value="my-matches"
                            aria-label="Mis Partidos"
                            className="gap-2"
                        >
                            <Trophy className="h-4 w-4" />
                            Mis Partidos
                            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {myMatches.length}
                            </span>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="find-matches"
                            aria-label="Buscar Partidos"
                            className="gap-2"
                        >
                            <Search className="h-4 w-4" />
                            Buscar Partidos
                            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {availableMatches.total}
                            </span>
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {activeView === 'my-matches' && myMatches.length > 0 && (
                        <ToggleGroup
                            type="single"
                            value={matchesTab}
                            onValueChange={(value) => {
                                if (value)
                                    setMatchesTab(
                                        value as 'upcoming' | 'history',
                                    );
                            }}
                        >
                            <ToggleGroupItem
                                value="upcoming"
                                aria-label="Próximos"
                                className="gap-2"
                            >
                                <Calendar className="h-4 w-4" />
                                Próximos
                                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                    {upcomingMatches.length}
                                </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                                value="history"
                                aria-label="Historial"
                                className="gap-2"
                            >
                                <History className="h-4 w-4" />
                                Historial
                                <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                    {pastMatches.length}
                                </span>
                            </ToggleGroupItem>
                        </ToggleGroup>
                    )}
                </div>

                {activeView === 'my-matches' && (
                    <div className="space-y-6">
                        {myMatches.length === 0 ? (
                            <Card className="flex flex-col items-center justify-center py-12">
                                <CardContent className="flex flex-col items-center gap-4 pt-6">
                                    <div className="rounded-full bg-muted p-4">
                                        {hasTeams ? (
                                            <Trophy className="h-8 w-8 text-muted-foreground" />
                                        ) : (
                                            <Users className="h-8 w-8 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold">
                                            {hasTeams
                                                ? 'Aún no hay partidos'
                                                : 'Únete a un equipo para ver partidos'}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {hasTeams
                                                ? 'Publica un partido disponible o busca partidos disponibles'
                                                : 'Necesitas ser parte de un equipo para crear y gestionar partidos'}
                                        </p>
                                    </div>
                                    {hasTeams ? (
                                        <PublishMatchButton teams={teams} />
                                    ) : (
                                        <Link
                                            href={
                                                teamsRoute.index({
                                                    query: { view: 'discover' },
                                                }).url
                                            }
                                        >
                                            <Button
                                                variant="outline"
                                                className="gap-2"
                                            >
                                                <Users className="h-4 w-4" />
                                                Descubrir Equipos
                                            </Button>
                                        </Link>
                                    )}
                                </CardContent>
                            </Card>
                        ) : matchesTab === 'upcoming' ? (
                            upcomingMatches.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center gap-3 py-8">
                                        <Calendar className="h-8 w-8 text-muted-foreground" />
                                        <div className="text-center">
                                            <p className="font-medium">
                                                No hay partidos próximos
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Crea un nuevo partido o busca
                                                rivales
                                            </p>
                                        </div>
                                        <PublishMatchButton teams={teams} />
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {upcomingMatches.map((match) => (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                        />
                                    ))}
                                </div>
                            )
                        ) : pastMatches.length === 0 ? (
                            <Card className="border-dashed">
                                <CardContent className="flex flex-col items-center gap-3 py-8">
                                    <History className="h-8 w-8 text-muted-foreground" />
                                    <div className="text-center">
                                        <p className="font-medium">
                                            No hay partidos en el historial
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Los partidos completados aparecerán
                                            aquí
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pastMatches.map((match) => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeView === 'find-matches' && (
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre de equipo o ubicación..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {availableMatches.total === 0 ? (
                            filters.search ? (
                                <Card className="flex flex-col items-center justify-center py-12">
                                    <CardContent className="flex flex-col items-center gap-4 pt-6">
                                        <div className="rounded-full bg-muted p-4">
                                            <Search className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-semibold">
                                                No se encontraron partidos
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Intenta ajustar tus criterios de
                                                búsqueda
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSearchQuery('')}
                                        >
                                            Limpiar Búsqueda
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="flex flex-col items-center justify-center py-12">
                                    <CardContent className="flex flex-col items-center gap-4 pt-6">
                                        <div className="rounded-full bg-muted p-4">
                                            <Search className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-semibold">
                                                No hay partidos disponibles
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                No hay partidos disponibles en
                                                este momento
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        ) : (
                            <>
                                <div
                                    className={cn(
                                        'grid gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3',
                                        isPending &&
                                            'pointer-events-none opacity-50',
                                    )}
                                >
                                    {availableMatches.data.map((match) => (
                                        <MatchCard
                                            key={match.id}
                                            match={match}
                                        />
                                    ))}
                                </div>

                                {availableMatches.last_page > 1 && (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Mostrando {availableMatches.from} a{' '}
                                            {availableMatches.to} de{' '}
                                            {availableMatches.total}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={
                                                    isPending ||
                                                    availableMatches.current_page ===
                                                        1
                                                }
                                                onClick={() =>
                                                    updateFilters({
                                                        page:
                                                            availableMatches.current_page -
                                                            1,
                                                    })
                                                }
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>

                                            {pageNumbers.map((page) => (
                                                <Button
                                                    key={page}
                                                    type="button"
                                                    variant={
                                                        page ===
                                                        availableMatches.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    className="min-w-9"
                                                    disabled={isPending}
                                                    onClick={() =>
                                                        updateFilters({ page })
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            ))}

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={
                                                    isPending ||
                                                    availableMatches.current_page ===
                                                        availableMatches.last_page
                                                }
                                                onClick={() =>
                                                    updateFilters({
                                                        page:
                                                            availableMatches.current_page +
                                                            1,
                                                    })
                                                }
                                            >
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
