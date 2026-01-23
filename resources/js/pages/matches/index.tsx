import { CreateMatchModal } from '@/components/create-match-modal';
import { MatchCard } from '@/components/match-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AppLayout from '@/layouts/app-layout';
import matches from '@/routes/matches';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Calendar, History, Search, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';

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

interface Match {
    id: number;
    home_team_id: number;
    away_team_id?: number;
    variant: string;
    scheduled_at: string;
    location: string;
    match_type: string;
    status: string;
    home_score?: number;
    away_score?: number;
    notes?: string;
    home_team: Team;
    away_team?: Team;
}

interface Props {
    myMatches: Match[];
    availableMatches: Match[];
    teams: Team[];
}

export default function Index({ myMatches, availableMatches, teams }: Props) {
    const [activeView, setActiveView] = useState<'my-matches' | 'find-matches'>(
        'my-matches',
    );
    const [matchesTab, setMatchesTab] = useState<'upcoming' | 'history'>(
        'upcoming',
    );
    const [searchQuery, setSearchQuery] = useState('');

    // Split matches into upcoming and past
    const { upcomingMatches, pastMatches } = useMemo(() => {
        const now = new Date();
        const upcoming: Match[] = [];
        const past: Match[] = [];

        for (const match of myMatches) {
            const matchDate = new Date(match.scheduled_at);
            // Consider a match as "past" if it's completed OR if the scheduled time has passed
            if (
                match.status === 'completed' ||
                match.status === 'cancelled' ||
                matchDate < now
            ) {
                past.push(match);
            } else {
                upcoming.push(match);
            }
        }

        // Sort upcoming by date ascending (soonest first)
        upcoming.sort(
            (a, b) =>
                new Date(a.scheduled_at).getTime() -
                new Date(b.scheduled_at).getTime(),
        );
        // Sort past by date descending (most recent first)
        past.sort(
            (a, b) =>
                new Date(b.scheduled_at).getTime() -
                new Date(a.scheduled_at).getTime(),
        );

        return { upcomingMatches: upcoming, pastMatches: past };
    }, [myMatches]);

    const filteredAvailableMatches = useMemo(() => {
        return availableMatches.filter((match) => {
            return (
                match.home_team.name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                match.location.toLowerCase().includes(searchQuery.toLowerCase())
            );
        });
    }, [availableMatches, searchQuery]);

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
                    <CreateMatchModal teams={teams} />
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
                                {filteredAvailableMatches.length}
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
                                        <Trophy className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold">
                                            Aún no hay partidos
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Publica un partido disponible o
                                            busca partidos disponibles
                                        </p>
                                    </div>
                                    <CreateMatchModal teams={teams} />
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
                                        <CreateMatchModal teams={teams} />
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

                        {availableMatches.length === 0 ? (
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
                                            No hay partidos disponibles en este
                                            momento
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : filteredAvailableMatches.length === 0 ? (
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
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredAvailableMatches.map((match) => (
                                    <MatchCard key={match.id} match={match} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
