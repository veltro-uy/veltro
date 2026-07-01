import { CreateTeamModal } from '@/components/create-team-modal';
import { TeamAvatar } from '@/components/team-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import teams from '@/routes/teams';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Search,
    Shield,
    Star,
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

const getMaxMembersForVariant = (variant: string): number => {
    switch (variant) {
        case 'football_11':
            return 25;
        case 'football_7':
            return 15;
        case 'football_5':
            return 10;
        case 'futsal':
            return 12;
        default:
            return 25;
    }
};

const getCapacityColor = (current: number, max: number): string => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'text-destructive';
    if (percentage >= 80) return 'text-orange-500';
    return 'text-muted-foreground';
};

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

    const renderTeamCard = (team: Team, showRole: boolean = false) => {
        const maxMembers =
            team.max_members ?? getMaxMembersForVariant(team.variant);
        const currentMembers = team.team_members.length;
        const isFull = currentMembers >= maxMembers;
        const capacityColor = getCapacityColor(currentMembers, maxMembers);

        // Find current user's role in this team
        const userMembership = showRole
            ? team.team_members.find((m) => m.user_id === auth.user.id)
            : null;

        return (
            <Card
                key={team.id}
                className="group transition-all hover:border-primary/20 hover:shadow-lg"
            >
                <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                        <TeamAvatar
                            name={team.name}
                            logoUrl={team.logo_url}
                            size="lg"
                        />
                        <div className="min-w-0 flex-1">
                            <CardTitle className="line-clamp-1 text-lg">
                                {team.name}
                            </CardTitle>
                            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
                                <VariantBadge variant={team.variant} />
                                {userMembership && (
                                    <Badge
                                        variant={
                                            userMembership.role === 'captain'
                                                ? 'default'
                                                : userMembership.role ===
                                                    'co_captain'
                                                  ? 'secondary'
                                                  : 'outline'
                                        }
                                        className="flex items-center gap-1"
                                    >
                                        {userMembership.role === 'captain' ? (
                                            <>
                                                <Star className="h-3 w-3" />
                                                <span>Capitán</span>
                                            </>
                                        ) : userMembership.role ===
                                          'co_captain' ? (
                                            <>
                                                <Shield className="h-3 w-3" />
                                                <span>Vice-Capitán</span>
                                            </>
                                        ) : (
                                            <span>Jugador</span>
                                        )}
                                    </Badge>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {team.description && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">
                            {team.description}
                        </p>
                    )}

                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                                Miembros
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span
                                className={`text-sm font-bold ${capacityColor}`}
                            >
                                {currentMembers}/{maxMembers}
                            </span>
                            {isFull && (
                                <span className="ml-1 text-xs font-medium text-destructive">
                                    (Completo)
                                </span>
                            )}
                        </div>
                    </div>

                    <Button asChild variant="outline" className="w-full">
                        <Link href={teams.show(team.id).url}>
                            Ver Equipo
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Equipos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Equipos
                        </h1>
                        <p className="text-muted-foreground">
                            Gestiona tus equipos y descubre nuevos
                        </p>
                    </div>
                    <CreateTeamModal />
                </div>

                {/* Toggle Group */}
                <div className="flex items-center justify-between gap-4">
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
                </div>

                {/* My Teams View */}
                {activeView === 'my-teams' && (
                    <div className="space-y-6">
                        {myTeams.length === 0 ? (
                            <Card className="flex flex-col items-center justify-center py-12">
                                <CardContent className="flex flex-col items-center gap-4 pt-6">
                                    <div className="rounded-full bg-muted p-4">
                                        <Users className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-semibold">
                                            Aún no tienes equipos
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Crea tu primer equipo o descubre
                                            equipos para unirte
                                        </p>
                                    </div>
                                    <CreateTeamModal />
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {myTeams.map((team) =>
                                    renderTeamCard(team, true),
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
                            {/* Search Input */}
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

                            {/* Variant Filter */}
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
                            hasActiveFilters ? (
                                <Card className="flex flex-col items-center justify-center py-12">
                                    <CardContent className="flex flex-col items-center gap-4 pt-6">
                                        <div className="rounded-full bg-muted p-4">
                                            <Search className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <div className="text-center">
                                            <h3 className="text-lg font-semibold">
                                                No se encontraron equipos
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Intenta ajustar tus criterios de
                                                búsqueda o filtro
                                            </p>
                                        </div>
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
                                            Limpiar Filtros
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
                                                No hay equipos disponibles
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                No hay equipos disponibles para
                                                unirse en este momento
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
                                    {discoverTeams.data.map((team) =>
                                        renderTeamCard(team),
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
