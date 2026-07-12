import { TournamentCard } from '@/components/tournament/tournament-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import tournamentsRoute from '@/routes/tournaments';
import type { BreadcrumbItem, Tournament, TournamentStatus } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Trophy,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Torneos',
        href: '/tournaments',
    },
];

type TournamentStatusFilter = TournamentStatus | 'all';

interface PageProps {
    tournaments: {
        data: Tournament[];
        current_page: number;
        last_page: number;
        from: number | null;
        to: number | null;
        per_page: number;
        total: number;
    };
    statusCounts: Record<TournamentStatusFilter, number>;
    filters: {
        status: TournamentStatusFilter;
        variant: string;
        search: string;
        sort: string;
    };
}

const statusOptions: Array<{
    value: TournamentStatusFilter;
    label: string;
}> = [
    { value: 'all', label: 'Todos' },
    { value: 'registration_open', label: 'Inscripción' },
    { value: 'in_progress', label: 'En juego' },
    { value: 'completed', label: 'Finalizados' },
    { value: 'draft', label: 'Borradores' },
    { value: 'cancelled', label: 'Cancelados' },
];

const cleanFilters = (
    filters: PageProps['filters'] & { page?: number | null },
) => ({
    status: filters.status === 'all' ? undefined : filters.status,
    variant: filters.variant === 'all' ? undefined : filters.variant,
    search: filters.search.trim() === '' ? undefined : filters.search.trim(),
    sort: filters.sort === 'newest' ? undefined : filters.sort,
    page: filters.page ?? undefined,
});

export default function TournamentsIndex({
    tournaments,
    statusCounts,
    filters,
}: PageProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');

    const updateFilters = useCallback(
        (
            updates: Partial<PageProps['filters']> & { page?: number | null },
            options: { replace?: boolean } = {},
        ) => {
            const nextFilters = {
                ...filters,
                ...updates,
            };

            router.get(
                tournamentsRoute.index.url(),
                cleanFilters(nextFilters),
                {
                    preserveScroll: true,
                    preserveState: true,
                    replace: options.replace ?? true,
                },
            );
        },
        [filters],
    );

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (searchQuery !== (filters.search ?? '')) {
                updateFilters({ search: searchQuery, page: null });
            }
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [filters.search, searchQuery, updateFilters]);

    const activeFilterCount = useMemo(
        () =>
            [
                filters.status !== 'all',
                filters.variant !== 'all',
                filters.search.trim() !== '',
                filters.sort !== 'newest',
            ].filter(Boolean).length,
        [filters],
    );

    const pageNumbers = useMemo(() => {
        const start = Math.max(1, tournaments.current_page - 2);
        const end = Math.min(
            tournaments.last_page,
            tournaments.current_page + 2,
        );

        return Array.from(
            { length: end - start + 1 },
            (_, index) => start + index,
        );
    }, [tournaments.current_page, tournaments.last_page]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Torneos" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Hero header */}
                <div className="relative -mx-4 -mt-4 overflow-hidden px-4 pt-6 pb-2 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-8">
                    <div
                        aria-hidden
                        className="bg-pitch-glow pointer-events-none absolute inset-0 -z-10"
                    />
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="font-display text-sm font-bold tracking-[0.18em] text-primary uppercase">
                                Competí
                            </p>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                Torneos
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                {tournaments.total === 1
                                    ? '1 torneo abierto a la comunidad.'
                                    : `${tournaments.total} torneos abiertos a la comunidad.`}
                            </p>
                        </div>
                        <Button asChild>
                            <Link href={tournamentsRoute.create.url()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Crear torneo
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Status filter chips */}
                <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                    {statusOptions.map((option) => {
                        const isActive = filters.status === option.value;
                        const count = statusCounts[option.value] ?? 0;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                    updateFilters({
                                        status: option.value,
                                        page: null,
                                    })
                                }
                                className={cn(
                                    'flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                                )}
                            >
                                {option.label}
                                <span
                                    className={cn(
                                        'rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums',
                                        isActive
                                            ? 'bg-primary/15 text-primary'
                                            : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    {count}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Filter bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                            placeholder="Buscar por nombre o descripción"
                            className="pl-9"
                        />
                    </div>

                    <Select
                        value={filters.variant}
                        onValueChange={(variant) =>
                            updateFilters({ variant, page: null })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-44">
                            <SelectValue placeholder="Variante" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas</SelectItem>
                            <SelectItem value="football_11">
                                Fútbol 11
                            </SelectItem>
                            <SelectItem value="football_7">Fútbol 7</SelectItem>
                            <SelectItem value="football_5">Fútbol 5</SelectItem>
                            <SelectItem value="futsal">Futsal</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.sort}
                        onValueChange={(sort) =>
                            updateFilters({ sort, page: null })
                        }
                    >
                        <SelectTrigger className="w-full sm:w-48">
                            <ArrowUpDown className="size-4 text-muted-foreground" />
                            <SelectValue placeholder="Orden" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">
                                Más recientes
                            </SelectItem>
                            <SelectItem value="start_soon">
                                Próximos a iniciar
                            </SelectItem>
                            <SelectItem value="name">Nombre</SelectItem>
                        </SelectContent>
                    </Select>

                    {activeFilterCount > 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            className="gap-2 sm:ml-auto"
                            onClick={() => {
                                setSearchQuery('');
                                updateFilters({
                                    status: 'all',
                                    variant: 'all',
                                    search: '',
                                    sort: 'newest',
                                    page: null,
                                });
                            }}
                        >
                            <X className="size-4" />
                            Limpiar
                        </Button>
                    )}
                </div>

                {/* Results */}
                {tournaments.data.length === 0 ? (
                    <div className="relative flex min-h-80 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-dashed border-border p-8 text-center">
                        <div
                            aria-hidden
                            className="bg-pitch-glow pointer-events-none absolute inset-0"
                        />
                        <div className="relative flex flex-col items-center gap-4">
                            <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                                <Trophy className="size-8 text-primary" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-lg font-semibold">
                                    {activeFilterCount > 0
                                        ? 'No hay torneos para estos filtros'
                                        : 'Todavía no hay torneos'}
                                </h2>
                                <p className="max-w-md text-sm text-muted-foreground">
                                    {activeFilterCount > 0
                                        ? 'Ajustá la búsqueda o limpiá los filtros para ver más resultados.'
                                        : 'Sé el primero en organizar un torneo para la comunidad.'}
                                </p>
                            </div>
                            <Button asChild>
                                <Link href={tournamentsRoute.create.url()}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Crear torneo
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {tournaments.data.map((tournament) => (
                            <TournamentCard
                                key={tournament.id}
                                tournament={tournament}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {tournaments.last_page > 1 && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {tournaments.from} a {tournaments.to} de{' '}
                            {tournaments.total}
                        </p>

                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={tournaments.current_page === 1}
                                onClick={() =>
                                    updateFilters({
                                        page: tournaments.current_page - 1,
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
                                        page === tournaments.current_page
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size="sm"
                                    className="min-w-9"
                                    onClick={() => updateFilters({ page })}
                                >
                                    {page}
                                </Button>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={
                                    tournaments.current_page ===
                                    tournaments.last_page
                                }
                                onClick={() =>
                                    updateFilters({
                                        page: tournaments.current_page + 1,
                                    })
                                }
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
