import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { VariantBadge } from '@/components/variant-badge';
import { useNavigationPending } from '@/hooks/use-navigation-pending';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import teams from '@/routes/teams';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Search as SearchIcon,
    Users,
} from 'lucide-react';
import type { FormEventHandler } from 'react';
import { useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Equipos',
        href: teams.index().url,
    },
    {
        title: 'Buscar',
        href: teams.search().url,
    },
];

interface TeamMember {
    id: number;
    user_id: number;
    team_id: number;
    role: string;
    status: string;
}

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
    description?: string;
    team_members: TeamMember[];
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
    teams: PaginatedTeams;
    filters?: {
        name?: string;
        variant?: string;
    };
}

export default function SearchTeams({ teams: searchResults, filters }: Props) {
    const [name, setName] = useState(filters?.name || '');
    const [variant, setVariant] = useState(filters?.variant || '');
    const [isPending, pendingHandlers] = useNavigationPending();

    const runSearch = (page?: number) => {
        router.get(
            teams.search().url,
            {
                name: name.trim() === '' ? undefined : name.trim(),
                variant: variant === '' ? undefined : variant,
                page,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                ...pendingHandlers,
            },
        );
    };

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        runSearch();
    };

    const pageNumbers = useMemo(() => {
        const start = Math.max(1, searchResults.current_page - 2);
        const end = Math.min(
            searchResults.last_page,
            searchResults.current_page + 2,
        );

        return Array.from(
            { length: end - start + 1 },
            (_, index) => start + index,
        );
    }, [searchResults.current_page, searchResults.last_page]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Buscar equipos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Buscar equipos
                    </h1>
                    <p className="text-muted-foreground">
                        Encontrá y unite a equipos
                    </p>
                </div>

                {/* Filtros de búsqueda */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros de búsqueda</CardTitle>
                        <CardDescription>
                            Refiná tu búsqueda para encontrar el equipo ideal
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nombre del equipo
                                    </Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        placeholder="Buscar por nombre..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="variant">Variante</Label>
                                    <Select
                                        value={variant}
                                        onValueChange={setVariant}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las variantes" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">
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
                            </div>

                            <Button type="submit">
                                <SearchIcon className="mr-2 h-4 w-4" />
                                Buscar
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Results */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold">
                        Resultados ({searchResults.total})
                    </h2>

                    {searchResults.total === 0 ? (
                        <Card className="flex flex-col items-center justify-center py-12">
                            <CardContent className="flex flex-col items-center gap-4 pt-6">
                                <div className="rounded-full bg-muted p-4">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold">
                                        No se encontraron equipos
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Probá ajustar los filtros de búsqueda
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div
                            className={cn(
                                'grid gap-4 transition-opacity md:grid-cols-2 lg:grid-cols-3',
                                isPending && 'pointer-events-none opacity-50',
                            )}
                        >
                            {searchResults.data.map((team) => (
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
                                                <CardDescription className="mt-1">
                                                    <VariantBadge
                                                        variant={team.variant}
                                                    />
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
                                            <span className="text-sm font-bold">
                                                {team.team_members.length}
                                            </span>
                                        </div>

                                        <Button
                                            asChild
                                            variant="outline"
                                            className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                                        >
                                            <Link
                                                href={teams.show(team.id).url}
                                            >
                                                Ver equipo
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {searchResults.last_page > 1 && (
                        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-muted-foreground">
                                Mostrando {searchResults.from} a{' '}
                                {searchResults.to} de {searchResults.total}
                            </p>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    disabled={
                                        isPending ||
                                        searchResults.current_page === 1
                                    }
                                    onClick={() =>
                                        runSearch(
                                            searchResults.current_page - 1,
                                        )
                                    }
                                >
                                    <ChevronLeft className="size-4" />
                                </Button>

                                {pageNumbers.map((page) => (
                                    <Button
                                        key={page}
                                        type="button"
                                        variant={
                                            page === searchResults.current_page
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                        className="min-w-9"
                                        disabled={isPending}
                                        onClick={() => runSearch(page)}
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
                                        searchResults.current_page ===
                                            searchResults.last_page
                                    }
                                    onClick={() =>
                                        runSearch(
                                            searchResults.current_page + 1,
                                        )
                                    }
                                >
                                    <ChevronRight className="size-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
