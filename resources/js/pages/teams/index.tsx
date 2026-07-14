import { TeamCard } from '@/components/team-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FilterChip, ViewTab } from '@/components/view-tab';
import { useNavigationPending } from '@/hooks/use-navigation-pending';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { VARIANTS } from '@/lib/variants';
import teams from '@/routes/teams';
import type { BreadcrumbItem, Team } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    Compass,
    Plus,
    Search,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const variantFilters: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'Todas' },
    ...VARIANTS.map((v) => ({ value: v.value, label: v.label })),
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Equipos',
        href: teams.index().url,
    },
];

interface PaginatedTeams {
    data: Team[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    per_page: number;
    total: number;
}

interface Props {
    myTeams: Team[];
    discoverTeams: PaginatedTeams;
    filters: {
        search: string;
        variant: string;
    };
}

export default function Index({ myTeams, discoverTeams, filters }: Props) {
    const page = usePage<{ auth: { user: { id: number } } }>();
    const { auth } = page.props;
    const initialView = new URLSearchParams(page.url.split('?')[1] ?? '').get(
        'view',
    );
    const [activeView, setActiveView] = useState<'my-teams' | 'discover'>(
        initialView === 'discover' ? 'discover' : 'my-teams',
    );
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');
    const selectedVariant = filters.variant ?? 'all';
    const [isPending, pendingHandlers] = useNavigationPending();

    const updateFilters = useCallback(
        (updates: {
            search?: string;
            variant?: string;
            page?: number | null;
        }) => {
            const search =
                updates.search !== undefined ? updates.search : filters.search;
            const variant =
                updates.variant !== undefined
                    ? updates.variant
                    : filters.variant;

            router.get(
                teams.index().url,
                {
                    view: 'discover',
                    search: search.trim() === '' ? undefined : search.trim(),
                    variant: variant === 'all' ? undefined : variant,
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
        [filters.search, filters.variant, pendingHandlers],
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
        const start = Math.max(1, discoverTeams.current_page - 2);
        const end = Math.min(
            discoverTeams.last_page,
            discoverTeams.current_page + 2,
        );

        return Array.from(
            { length: end - start + 1 },
            (_, index) => start + index,
        );
    }, [discoverTeams.current_page, discoverTeams.last_page]);

    const hasActiveFilters =
        (filters.search ?? '') !== '' || (filters.variant ?? 'all') !== 'all';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Equipos" />
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
                                Comunidad
                            </p>
                            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                Equipos
                            </h1>
                            <p className="mt-1 text-muted-foreground">
                                Gestioná tus equipos y descubrí nuevos rivales.
                            </p>
                        </div>
                        <Button asChild>
                            <Link href={teams.create().url}>
                                <Plus className="mr-2 h-4 w-4" />
                                Crear Equipo
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* View tabs + discover toolbar */}
                <div className="flex flex-col gap-4">
                    {/* Tab row — fixed height across both views for a stable underline */}
                    <div className="flex items-center gap-5 border-b border-border sm:gap-6">
                        <ViewTab
                            icon={Users}
                            label="Mis Equipos"
                            count={myTeams.length}
                            active={activeView === 'my-teams'}
                            onClick={() => setActiveView('my-teams')}
                        />
                        <ViewTab
                            icon={Compass}
                            label="Descubrir"
                            count={discoverTeams.total}
                            active={activeView === 'discover'}
                            onClick={() => setActiveView('discover')}
                        />
                    </div>

                    {activeView === 'discover' && (
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 py-1 sm:flex-wrap sm:overflow-visible">
                                {variantFilters.map((chip) => (
                                    <FilterChip
                                        key={chip.value}
                                        label={chip.label}
                                        active={selectedVariant === chip.value}
                                        disabled={isPending}
                                        onClick={() =>
                                            updateFilters({
                                                variant: chip.value,
                                                page: null,
                                            })
                                        }
                                    />
                                ))}
                            </div>

                            <div className="relative w-full sm:w-72">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar equipos por nombre..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* My Teams View */}
                {activeView === 'my-teams' && (
                    <div className="space-y-6">
                        {myTeams.length === 0 ? (
                            <div className="relative overflow-hidden rounded-2xl border border-dashed border-border p-10 text-center">
                                <div
                                    aria-hidden
                                    className="bg-pitch-glow pointer-events-none absolute inset-0"
                                />
                                <div className="relative flex flex-col items-center gap-4">
                                    <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                                        <Users className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            Aún no tenés equipos
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Creá tu primer equipo o descubrí
                                            equipos para unirte.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                setActiveView('discover')
                                            }
                                        >
                                            <Search className="mr-2 h-4 w-4" />
                                            Descubrir Equipos
                                        </Button>
                                        <Button asChild>
                                            <Link href={teams.create().url}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Crear Equipo
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {myTeams.map((team) => (
                                    <TeamCard
                                        key={team.id}
                                        team={team}
                                        mode="mine"
                                        currentUserId={auth.user.id}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Discover Teams View */}
                {activeView === 'discover' && (
                    <div className="space-y-6">
                        {/* Results */}
                        {discoverTeams.total === 0 ? (
                            <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border py-14 text-center">
                                <div className="rounded-full bg-muted p-4">
                                    <Search className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        {hasActiveFilters
                                            ? 'No se encontraron equipos'
                                            : 'No hay equipos disponibles'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {hasActiveFilters
                                            ? 'Probá ajustar tu búsqueda o el filtro de variante.'
                                            : 'No hay equipos disponibles para unirse en este momento.'}
                                    </p>
                                </div>
                                {hasActiveFilters && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearchQuery('');
                                            updateFilters({
                                                search: '',
                                                variant: 'all',
                                                page: null,
                                            });
                                        }}
                                    >
                                        Limpiar filtros
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                <div
                                    className={cn(
                                        'grid gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3',
                                        isPending &&
                                            'pointer-events-none opacity-50',
                                    )}
                                >
                                    {discoverTeams.data.map((team) => (
                                        <TeamCard
                                            key={team.id}
                                            team={team}
                                            mode="discover"
                                            currentUserId={auth.user.id}
                                        />
                                    ))}
                                </div>

                                {discoverTeams.last_page > 1 && (
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="text-sm text-muted-foreground">
                                            Mostrando {discoverTeams.from} a{' '}
                                            {discoverTeams.to} de{' '}
                                            {discoverTeams.total}
                                        </p>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={
                                                    isPending ||
                                                    discoverTeams.current_page ===
                                                        1
                                                }
                                                onClick={() =>
                                                    updateFilters({
                                                        page:
                                                            discoverTeams.current_page -
                                                            1,
                                                    })
                                                }
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>

                                            {pageNumbers.map((pageNumber) => (
                                                <Button
                                                    key={pageNumber}
                                                    type="button"
                                                    variant={
                                                        pageNumber ===
                                                        discoverTeams.current_page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    className="min-w-9"
                                                    disabled={isPending}
                                                    onClick={() =>
                                                        updateFilters({
                                                            page: pageNumber,
                                                        })
                                                    }
                                                >
                                                    {pageNumber}
                                                </Button>
                                            ))}

                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                disabled={
                                                    isPending ||
                                                    discoverTeams.current_page ===
                                                        discoverTeams.last_page
                                                }
                                                onClick={() =>
                                                    updateFilters({
                                                        page:
                                                            discoverTeams.current_page +
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
