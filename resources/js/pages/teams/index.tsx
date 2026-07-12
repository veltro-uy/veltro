import { JoinRequestDialog } from '@/components/join-request-dialog';
import { TeamAvatar } from '@/components/team-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { VariantBadge } from '@/components/variant-badge';
import { useNavigationPending } from '@/hooks/use-navigation-pending';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { variantMaxMembers } from '@/lib/variants';
import teams from '@/routes/teams';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Plus,
    Search,
    Shield,
    Star,
    UserPlus,
    Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Equipos',
        href: teams.index().url,
    },
];

interface TeamMember {
    id: number;
    user_id: number;
    team_id: number;
    role: string;
    status: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
    description?: string;
    team_members: TeamMember[];
    max_members?: number;
}

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

function RoleBadge({ role }: { role: string }) {
    if (role === 'captain') {
        return (
            <Badge variant="default" className="gap-1">
                <Star className="h-3 w-3" />
                Capitán
            </Badge>
        );
    }
    if (role === 'co_captain') {
        return (
            <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Vice-Capitán
            </Badge>
        );
    }
    return <Badge variant="outline">Jugador</Badge>;
}

function CapacityBar({ current, max }: { current: number; max: number }) {
    const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
    const barColor =
        pct >= 100
            ? 'bg-destructive'
            : pct >= 80
              ? 'bg-orange-500'
              : 'bg-primary';

    return (
        <div>
            <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    Plantilla
                </span>
                <span className="font-semibold tabular-nums">
                    {current}
                    <span className="text-muted-foreground">/{max}</span>
                    {current >= max && (
                        <span className="ml-1 font-medium text-destructive">
                            · Completo
                        </span>
                    )}
                </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500',
                        barColor,
                    )}
                    style={{ width: `${Math.max(pct, 4)}%` }}
                />
            </div>
        </div>
    );
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

    const renderTeamCard = (team: Team, mode: 'mine' | 'discover') => {
        const maxMembers = team.max_members ?? variantMaxMembers(team.variant);
        const currentMembers = team.team_members.length;
        const isFull = currentMembers >= maxMembers;
        const userMembership =
            mode === 'mine'
                ? team.team_members.find((m) => m.user_id === auth.user.id)
                : null;

        return (
            <Card
                key={team.id}
                className="group flex flex-col overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                        <TeamAvatar
                            name={team.name}
                            logoUrl={team.logo_url}
                            size="lg"
                        />
                        <div className="min-w-0 flex-1">
                            <CardTitle className="line-clamp-1 text-base">
                                {team.name}
                            </CardTitle>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                <VariantBadge variant={team.variant} />
                                {userMembership && (
                                    <RoleBadge role={userMembership.role} />
                                )}
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                    {team.description ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                            {team.description}
                        </p>
                    ) : (
                        mode === 'discover' && (
                            <p className="text-sm text-muted-foreground/60 italic">
                                Sin descripción
                            </p>
                        )
                    )}

                    <CapacityBar current={currentMembers} max={maxMembers} />

                    <div className="mt-auto flex gap-2 pt-1">
                        {mode === 'mine' ? (
                            <Button
                                asChild
                                variant="outline"
                                className="w-full"
                            >
                                <Link href={teams.show(team.id).url}>
                                    Ver equipo
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        ) : isFull ? (
                            <>
                                <Button disabled className="flex-1">
                                    Completo
                                </Button>
                                <Button asChild variant="outline">
                                    <Link href={teams.show(team.id).url}>
                                        Ver
                                    </Link>
                                </Button>
                            </>
                        ) : (
                            <>
                                <JoinRequestDialog
                                    teamId={team.id}
                                    teamName={team.name}
                                    trigger={
                                        <Button className="flex-1">
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Solicitar
                                        </Button>
                                    }
                                />
                                <Button asChild variant="outline">
                                    <Link href={teams.show(team.id).url}>
                                        Ver
                                    </Link>
                                </Button>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

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

                {/* View switch */}
                <ToggleGroup
                    type="single"
                    value={activeView}
                    onValueChange={(value) => {
                        if (value)
                            setActiveView(value as 'my-teams' | 'discover');
                    }}
                    className="justify-start"
                >
                    <ToggleGroupItem
                        value="my-teams"
                        aria-label="Mis Equipos"
                        className="gap-2"
                    >
                        <Users className="h-4 w-4" />
                        Mis Equipos
                        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {myTeams.length}
                        </span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="discover"
                        aria-label="Descubrir Equipos"
                        className="gap-2"
                    >
                        <Search className="h-4 w-4" />
                        Descubrir
                        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                            {discoverTeams.total}
                        </span>
                    </ToggleGroupItem>
                </ToggleGroup>

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
                                {myTeams.map((team) =>
                                    renderTeamCard(team, 'mine'),
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Discover Teams View */}
                {activeView === 'discover' && (
                    <div className="space-y-6">
                        {/* Filters */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="relative flex-1">
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

                            <Select
                                value={selectedVariant}
                                onValueChange={(value) =>
                                    updateFilters({
                                        variant: value,
                                        page: null,
                                    })
                                }
                            >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="Seleccionar variante" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Todas las variantes
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
                                    {discoverTeams.data.map((team) =>
                                        renderTeamCard(team, 'discover'),
                                    )}
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
