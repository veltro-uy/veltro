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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Tournament } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Plus, Search, Trophy, Zap } from 'lucide-react';
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

    const categorizedTournaments = useMemo(() => {
        const all = tournaments.data;
        const upcoming = all.filter((t) => t.status === 'registration_open');
        const active = all.filter((t) => t.status === 'in_progress');
        const past = all.filter((t) => t.status === 'completed');

        return { all, upcoming, active, past };
    }, [tournaments.data]);

    const filteredTournaments = useMemo(() => {
        const source =
            activeTab === 'all'
                ? categorizedTournaments.all
                : categorizedTournaments[
                      activeTab as keyof typeof categorizedTournaments
                  ];

        if (!searchQuery.trim()) return source;

        return source.filter(
            (t) =>
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        );
    }, [categorizedTournaments, activeTab, searchQuery]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Torneos" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Torneos
                        </h1>
                        <p className="text-muted-foreground">
                            Compite y demuestra tu talento
                        </p>
                    </div>
                    <Link href="/tournaments/create">
                        <Button className="gap-2">
                            <Plus className="size-4" />
                            Crear Torneo
                        </Button>
                    </Link>
                </div>

                {/* Toggle Group + Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <ToggleGroup
                        type="single"
                        value={activeTab}
                        onValueChange={(value) => {
                            if (value) setActiveTab(value);
                        }}
                        className="justify-start"
                    >
                        <ToggleGroupItem
                            value="all"
                            aria-label="Todos"
                            className="gap-2"
                        >
                            <Trophy className="h-4 w-4" />
                            Todos
                            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {categorizedTournaments.all.length}
                            </span>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="upcoming"
                            aria-label="Abiertos"
                            className="gap-2"
                        >
                            <Calendar className="h-4 w-4" />
                            Abiertos
                            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {categorizedTournaments.upcoming.length}
                            </span>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="active"
                            aria-label="Activos"
                            className="gap-2"
                        >
                            <Zap className="h-4 w-4" />
                            Activos
                            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                                {categorizedTournaments.active.length}
                            </span>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="past"
                            aria-label="Pasados"
                            className="gap-2"
                        >
                            Pasados
                            <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                                {categorizedTournaments.past.length}
                            </span>
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                {/* Search and Variant Filter */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Buscar torneos por nombre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={filters.variant}
                        onValueChange={handleVariantChange}
                    >
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Variante" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">
                                Todas las variantes
                            </SelectItem>
                            <SelectItem value="football_11">
                                Fútbol 11
                            </SelectItem>
                            <SelectItem value="football_7">Fútbol 7</SelectItem>
                            <SelectItem value="football_5">Fútbol 5</SelectItem>
                            <SelectItem value="futsal">Futsal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Tournament Grid */}
                {filteredTournaments.length === 0 ? (
                    <Card className="flex flex-col items-center justify-center py-12">
                        <CardContent className="flex flex-col items-center gap-4 pt-6">
                            <div className="rounded-full bg-muted p-4">
                                <Trophy className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-semibold">
                                    No se encontraron torneos
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {searchQuery
                                        ? 'Intenta con otra búsqueda o ajusta los filtros'
                                        : 'No hay torneos disponibles en esta categoría'}
                                </p>
                            </div>
                            {activeTab === 'all' &&
                                !searchQuery &&
                                tournaments.data.length === 0 && (
                                    <Link href="/tournaments/create">
                                        <Button className="gap-2">
                                            <Plus className="size-4" />
                                            Crear Primer Torneo
                                        </Button>
                                    </Link>
                                )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredTournaments.map((tournament) => (
                            <TournamentCard
                                key={tournament.id}
                                tournament={tournament}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
