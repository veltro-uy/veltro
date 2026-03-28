import { TournamentCard } from '@/components/tournament/tournament-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Tournament } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    Award,
    Calendar,
    CheckCircle2,
    Filter,
    Plus,
    Search,
    Sparkles,
    Trophy,
    Users,
    Zap,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Torneos',
        href: '/tournaments',
    },
];

interface PageProps {
    tournaments: {
        data: Tournament[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        status: string;
        variant: string;
    };
}

export default function TournamentsIndex({ tournaments, filters }: PageProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const handleVariantChange = (variant: string) => {
        router.get(
            '/tournaments',
            { ...filters, variant },
            { preserveState: true },
        );
    };

    // Categorize tournaments
    const categorizedTournaments = useMemo(() => {
        const all = tournaments.data;
        const registrationOpen = all.filter(
            (t) => t.status === 'registration_open',
        );
        const inProgress = all.filter((t) => t.status === 'in_progress');
        const completed = all.filter((t) => t.status === 'completed');
        const upcoming = registrationOpen;

        return {
            all,
            upcoming,
            active: inProgress,
            past: completed,
        };
    }, [tournaments.data]);

    // Search and filter
    const filteredTournaments = useMemo(() => {
        let tournamentsToFilter =
            activeTab === 'all'
                ? categorizedTournaments.all
                : categorizedTournaments[
                      activeTab as keyof typeof categorizedTournaments
                  ];

        if (searchQuery.trim()) {
            tournamentsToFilter = tournamentsToFilter.filter(
                (t) =>
                    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    t.description
                        ?.toLowerCase()
                        .includes(searchQuery.toLowerCase()),
            );
        }

        return tournamentsToFilter;
    }, [categorizedTournaments, activeTab, searchQuery]);

    // Stats for hero section
    const stats = useMemo(() => {
        return {
            total: tournaments.data.length,
            upcoming: categorizedTournaments.upcoming.length,
            active: categorizedTournaments.active.length,
            completed: categorizedTournaments.past.length,
        };
    }, [tournaments.data, categorizedTournaments]);

    // Featured tournaments (up to 2 registration_open or in_progress)
    const featuredTournaments = useMemo(() => {
        return tournaments.data
            .filter(
                (t) =>
                    t.status === 'registration_open' ||
                    t.status === 'in_progress',
            )
            .slice(0, 2);
    }, [tournaments.data]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Torneos" />

            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Header Section */}
                <div className="flex flex-col gap-6">
                    {/* Title and Action */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-primary/10 p-2.5">
                                    <Trophy className="size-7 text-primary" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-bold tracking-tight">
                                        Torneos
                                    </h1>
                                    <p className="text-base text-muted-foreground">
                                        Compite y demuestra tu talento
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Link href="/tournaments/create">
                            <Button size="lg" className="gap-2 shadow-md">
                                <Plus className="size-4" />
                                Crear Torneo
                            </Button>
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="border-primary/20 transition-all hover:shadow-md">
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="rounded-xl bg-primary/10 p-3">
                                    <Trophy className="size-6 text-primary" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-3xl font-bold">
                                        {stats.total}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Total
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-blue-500/20 transition-all hover:shadow-md">
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="rounded-xl bg-blue-500/10 p-3">
                                    <Calendar className="size-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-3xl font-bold">
                                        {stats.upcoming}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Abiertos
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-orange-500/20 transition-all hover:shadow-md">
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="rounded-xl bg-orange-500/10 p-3">
                                    <Zap className="size-6 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-3xl font-bold">
                                        {stats.active}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Activos
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-green-500/20 transition-all hover:shadow-md">
                            <CardContent className="flex items-center gap-4 p-5">
                                <div className="rounded-xl bg-green-500/10 p-3">
                                    <CheckCircle2 className="size-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-3xl font-bold">
                                        {stats.completed}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Finalizados
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Featured Tournaments */}
                {featuredTournaments.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Sparkles className="size-5 text-primary" />
                            <h2 className="text-xl font-semibold">
                                Destacados
                            </h2>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {featuredTournaments.map((tournament) => (
                                <Card
                                    key={tournament.id}
                                    className="group relative overflow-hidden border-primary/30 transition-all hover:shadow-lg"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                                    <CardContent className="relative p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                                                        <Sparkles className="size-3" />
                                                        {tournament.status ===
                                                        'registration_open'
                                                            ? 'ABIERTO'
                                                            : 'EN VIVO'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="mb-1.5 text-xl leading-tight font-bold">
                                                        {tournament.name}
                                                    </h3>
                                                    {tournament.description && (
                                                        <p className="line-clamp-2 text-sm text-muted-foreground">
                                                            {
                                                                tournament.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1.5">
                                                        <Users className="size-4 text-muted-foreground" />
                                                        <span className="font-medium">
                                                            {tournament.registered_teams_count ||
                                                                0}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            /{' '}
                                                            {
                                                                tournament.max_teams
                                                            }
                                                        </span>
                                                    </div>
                                                    {tournament.starts_at && (
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Calendar className="size-4" />
                                                            <span>
                                                                {new Date(
                                                                    tournament.starts_at,
                                                                ).toLocaleDateString(
                                                                    'es-UY',
                                                                    {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                    },
                                                                )}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Link
                                                href={`/tournaments/${tournament.id}`}
                                            >
                                                <Button
                                                    variant="outline"
                                                    className="gap-2 shadow-sm"
                                                >
                                                    Ver más
                                                    <Trophy className="size-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search, Filters and Tabs Section */}
                <div className="space-y-4">
                    {/* Search and Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar torneos por nombre..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Select
                                        value={filters.variant}
                                        onValueChange={handleVariantChange}
                                    >
                                        <SelectTrigger className="w-full sm:w-[180px]">
                                            <Filter className="mr-2 size-4" />
                                            <SelectValue placeholder="Variante" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Todas
                                            </SelectItem>
                                            <SelectItem value="football_11">
                                                Fútbol 11
                                            </SelectItem>
                                            <SelectItem value="football_7">
                                                Fútbol 7
                                            </SelectItem>
                                            <SelectItem value="football_5">
                                                Fútbol 5
                                            </SelectItem>
                                            <SelectItem value="futsal">
                                                Futsal
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabs with Tournaments */}
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
                        <TabsList className="grid w-full grid-cols-4 p-1">
                            <TabsTrigger value="all" className="gap-2">
                                <span className="hidden sm:inline">Todos</span>
                                <span className="sm:hidden">Todo</span>
                                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-xs font-bold text-primary">
                                    {categorizedTournaments.all.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="upcoming" className="gap-2">
                                <span className="hidden sm:inline">
                                    Próximos
                                </span>
                                <span className="sm:hidden">Próx.</span>
                                <span className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                                    {categorizedTournaments.upcoming.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="active" className="gap-2">
                                <span className="hidden sm:inline">
                                    Activos
                                </span>
                                <span className="sm:hidden">Actv.</span>
                                <span className="rounded-md bg-orange-500/10 px-1.5 py-0.5 text-xs font-bold text-orange-600 dark:text-orange-400">
                                    {categorizedTournaments.active.length}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="past" className="gap-2">
                                <span className="hidden sm:inline">
                                    Pasados
                                </span>
                                <span className="sm:hidden">Pas.</span>
                                <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-bold">
                                    {categorizedTournaments.past.length}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        <div className="mt-6">
                            {filteredTournaments.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="flex flex-col items-center justify-center py-16">
                                        <div className="mb-4 rounded-2xl bg-muted p-6">
                                            <Award className="size-12 text-muted-foreground" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="mb-2 text-lg font-semibold">
                                                No se encontraron torneos
                                            </h3>
                                            <p className="mb-4 text-sm text-muted-foreground">
                                                {searchQuery
                                                    ? 'Intenta con otra búsqueda o ajusta los filtros'
                                                    : 'No hay torneos disponibles en esta categoría'}
                                            </p>
                                            {activeTab === 'all' &&
                                                !searchQuery &&
                                                tournaments.data.length ===
                                                    0 && (
                                                    <Link href="/tournaments/create">
                                                        <Button className="gap-2">
                                                            <Plus className="size-4" />
                                                            Crear Primer Torneo
                                                        </Button>
                                                    </Link>
                                                )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <TabsContent value={activeTab} className="mt-0">
                                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {filteredTournaments.map(
                                            (tournament) => (
                                                <TournamentCard
                                                    key={tournament.id}
                                                    tournament={tournament}
                                                />
                                            ),
                                        )}
                                    </div>
                                </TabsContent>
                            )}
                        </div>
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
