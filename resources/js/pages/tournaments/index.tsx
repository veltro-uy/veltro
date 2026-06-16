import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { VariantBadge } from '@/components/variant-badge';
import AppLayout from '@/layouts/app-layout';
import { formatDate as formatDateTz } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import tournamentsRoute from '@/routes/tournaments';
import type { BreadcrumbItem, Tournament, TournamentStatus } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowUpDown,
    Calendar,
    ChevronLeft,
    ChevronRight,
    CircleDot,
    Plus,
    Search,
    Trophy,
    Users,
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

const statusConfig: Record<
    TournamentStatus,
    {
        label: string;
        className: string;
        variant: 'default' | 'secondary' | 'outline' | 'destructive';
    }
> = {
    draft: {
        label: 'Borrador',
        variant: 'secondary',
        className: 'bg-muted text-muted-foreground',
    },
    registration_open: {
        label: 'Inscripción abierta',
        variant: 'secondary',
        className: 'bg-primary/10 text-primary',
    },
    in_progress: {
        label: 'En juego',
        variant: 'secondary',
        className: 'bg-primary/10 text-primary',
    },
    completed: {
        label: 'Finalizado',
        variant: 'outline',
        className: 'text-muted-foreground',
    },
    cancelled: {
        label: 'Cancelado',
        variant: 'destructive',
        className: '',
    },
};

const formatDate = (value?: string) => {
    if (!value) return 'Sin fecha';

    return formatDateTz(value, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

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
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                            Torneos
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {tournaments.total === 1
                                ? '1 torneo encontrado'
                                : `${tournaments.total} torneos encontrados`}
                        </p>
                    </div>

                    <Button asChild className="w-full gap-2 sm:w-fit">
                        <Link href={tournamentsRoute.create.url()}>
                            <Plus className="size-4" />
                            Crear torneo
                        </Link>
                    </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                    {statusOptions.map((option) => {
                        const isActive = filters.status === option.value;

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
                                    'flex min-h-20 flex-col justify-between rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/50',
                                    isActive &&
                                        'border-primary bg-primary/5 ring-1 ring-primary/15',
                                )}
                            >
                                <span className="flex items-center justify-between gap-2 text-sm font-medium">
                                    {option.label}
                                    {isActive && (
                                        <CircleDot className="size-4 text-primary" />
                                    )}
                                </span>
                                <span
                                    className={cn(
                                        'text-2xl leading-none font-semibold',
                                        isActive
                                            ? 'text-primary'
                                            : option.value === 'cancelled'
                                              ? 'text-destructive'
                                              : 'text-foreground',
                                    )}
                                >
                                    {statusCounts[option.value] ?? 0}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-3 rounded-lg border bg-background p-3 lg:flex-row lg:items-center">
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
                        <SelectTrigger className="w-full lg:w-44">
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
                        <SelectTrigger className="w-full lg:w-48">
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
                            className="gap-2 lg:ml-auto"
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

                {tournaments.data.length === 0 ? (
                    <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-8 text-center">
                        <div className="rounded-full bg-muted p-4">
                            <Trophy className="size-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold">
                                No hay torneos para mostrar
                            </h2>
                            <p className="max-w-md text-sm text-muted-foreground">
                                Ajusta la búsqueda o limpia los filtros para ver
                                más resultados.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-hidden rounded-lg border bg-background">
                        <div className="hidden grid-cols-[minmax(0,1.7fr)_150px_150px_150px_120px] gap-4 border-b bg-muted/40 px-4 py-3 text-xs font-medium text-muted-foreground lg:grid">
                            <span>Torneo</span>
                            <span>Estado</span>
                            <span>Equipos</span>
                            <span>Inicio</span>
                            <span className="text-right">Acción</span>
                        </div>

                        <div className="divide-y">
                            {tournaments.data.map((tournament) => {
                                const status = statusConfig[tournament.status];
                                const registeredTeams =
                                    tournament.registered_teams_count ?? 0;
                                const capacity = Math.min(
                                    100,
                                    Math.round(
                                        (registeredTeams /
                                            tournament.max_teams) *
                                            100,
                                    ),
                                );

                                return (
                                    <div
                                        key={tournament.id}
                                        className="grid gap-4 px-4 py-4 transition-colors hover:bg-muted/30 lg:grid-cols-[minmax(0,1.7fr)_150px_150px_150px_120px] lg:items-center"
                                    >
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                                                {tournament.logo_url ? (
                                                    <img
                                                        src={
                                                            tournament.logo_url
                                                        }
                                                        alt={tournament.name}
                                                        className="size-full object-cover"
                                                        loading="lazy"
                                                    />
                                                ) : (
                                                    <div className="flex size-full items-center justify-center bg-muted text-muted-foreground">
                                                        <Trophy className="size-5" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 space-y-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Link
                                                        href={tournamentsRoute.show.url(
                                                            tournament.id,
                                                        )}
                                                        className="min-w-0 text-base font-semibold hover:underline"
                                                    >
                                                        <span className="line-clamp-1">
                                                            {tournament.name}
                                                        </span>
                                                    </Link>
                                                    <VariantBadge
                                                        variant={
                                                            tournament.variant
                                                        }
                                                        className="border-border bg-muted text-muted-foreground hover:bg-muted [&>svg]:text-muted-foreground"
                                                    />
                                                </div>
                                                {tournament.description && (
                                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                                        {tournament.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <Badge
                                                variant={status.variant}
                                                className={status.className}
                                            >
                                                {status.label}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-3 text-sm">
                                                <span className="inline-flex items-center gap-2 text-muted-foreground">
                                                    <Users className="size-4" />
                                                    Equipos
                                                </span>
                                                <span className="font-medium">
                                                    {registeredTeams}/
                                                    {tournament.max_teams}
                                                </span>
                                            </div>
                                            <Progress value={capacity} />
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="size-4" />
                                            <span>
                                                {formatDate(
                                                    tournament.starts_at,
                                                )}
                                            </span>
                                        </div>

                                        <Button
                                            asChild
                                            variant="outline"
                                            size="sm"
                                            className="w-full lg:w-auto"
                                        >
                                            <Link
                                                href={tournamentsRoute.show.url(
                                                    tournament.id,
                                                )}
                                            >
                                                Ver torneo
                                            </Link>
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

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
