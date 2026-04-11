import { MatchCard } from '@/components/match-card';
import { TeamAvatar } from '@/components/team-avatar';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VariantBadge } from '@/components/variant-badge';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem,
    FootballMatch,
    JoinRequest,
    Team,
    Tournament,
    User,
} from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Calendar,
    Clock,
    Plus,
    Search,
    Users,
    X,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
];

interface PageProps {
    myTeams: (Team & { team_members_count: number })[];
    upcomingMatches: FootballMatch[];
    pendingJoinRequests: JoinRequest[];
    activeTournaments: Tournament[];
    hasTeams: boolean;
    [key: string]: unknown;
}

function SectionHeader({
    title,
    href,
    linkText = 'Ver todos',
    badge,
}: {
    title: string;
    href?: string;
    linkText?: string;
    badge?: number;
}) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{title}</h2>
                {badge !== undefined && badge > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {badge}
                    </Badge>
                )}
            </div>
            {href && (
                <Link
                    href={href}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    {linkText}
                    <ArrowRight className="h-3 w-3" />
                </Link>
            )}
        </div>
    );
}

function formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} sem.`;
    return `Hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) > 1 ? 'es' : ''}`;
}

export default function Dashboard({
    myTeams,
    upcomingMatches,
    pendingJoinRequests,
    activeTournaments,
    hasTeams,
}: PageProps) {
    const { auth, flash } = usePage<{
        auth: { user: User };
        flash: { success?: string };
    }>().props;

    const firstName = auth.user.name.split(' ')[0];

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
    }, [flash]);

    const handleCancelRequest = (requestId: number) => {
        router.delete(`/join-requests/${requestId}`, {
            preserveScroll: true,
            onSuccess: () => toast.success('Solicitud cancelada'),
            onError: () => toast.error('Error al cancelar la solicitud'),
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        ¡Hola, {firstName}!
                    </h1>
                    <p className="text-muted-foreground">
                        Esto es lo que está pasando
                    </p>
                </div>

                {!hasTeams ? (
                    /* Lone Player / New User View */
                    <div className="space-y-6">
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center gap-4 py-10">
                                <div className="rounded-full bg-muted p-4">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold">
                                        Empieza por crear o unirte a un equipo
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Para jugar partidos y participar en
                                        torneos necesitas un equipo
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Link href="/teams">
                                        <Button
                                            variant="outline"
                                            className="gap-2"
                                        >
                                            <Search className="h-4 w-4" />
                                            Descubrir Equipos
                                        </Button>
                                    </Link>
                                    <Link href="/teams">
                                        <Button className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Crear Equipo
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {pendingJoinRequests.length > 0 && (
                            <PendingRequestsSection
                                requests={pendingJoinRequests}
                                onCancel={handleCancelRequest}
                            />
                        )}
                    </div>
                ) : (
                    /* Active Player View — 2 column layout */
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Left column — matches (wider) */}
                        <div className="space-y-6 lg:col-span-2">
                            {/* Upcoming Matches */}
                            <section className="space-y-3">
                                <SectionHeader
                                    title="Próximos Partidos"
                                    href="/matches"
                                />
                                {upcomingMatches.length === 0 ? (
                                    <Card className="border-dashed">
                                        <CardContent className="flex items-center gap-4 py-6">
                                            <div className="rounded-lg bg-muted p-3">
                                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    No hay partidos próximos
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Crea un partido o busca
                                                    rivales disponibles
                                                </p>
                                            </div>
                                            <Link href="/matches">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    Ir a Partidos
                                                </Button>
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {upcomingMatches
                                            .filter((match) => match.home_team)
                                            .map((match) => (
                                                <MatchCard
                                                    key={match.id}
                                                    match={
                                                        match as FootballMatch & {
                                                            home_team: NonNullable<
                                                                FootballMatch['home_team']
                                                            >;
                                                        }
                                                    }
                                                />
                                            ))}
                                    </div>
                                )}
                            </section>

                            {/* Active Tournaments */}
                            {activeTournaments.length > 0 && (
                                <section className="space-y-3">
                                    <SectionHeader
                                        title="Torneos Activos"
                                        href="/tournaments"
                                    />
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {activeTournaments.map((tournament) => (
                                            <TournamentCard
                                                key={tournament.id}
                                                tournament={tournament}
                                            />
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>

                        {/* Right column — teams + requests */}
                        <div className="space-y-6">
                            {/* My Teams */}
                            <section className="space-y-3">
                                <SectionHeader
                                    title="Mis Equipos"
                                    href="/teams"
                                    badge={myTeams.length}
                                />
                                <div className="space-y-3">
                                    {myTeams.map((team) => (
                                        <Link
                                            key={team.id}
                                            href={`/teams/${team.id}`}
                                        >
                                            <Card className="transition-all hover:border-primary/20 hover:shadow-md">
                                                <CardContent className="flex items-center gap-3 py-3">
                                                    <TeamAvatar
                                                        name={team.name}
                                                        logoUrl={team.logo_url}
                                                        size="md"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold">
                                                            {team.name}
                                                        </p>
                                                        <div className="mt-0.5 flex items-center gap-2">
                                                            <VariantBadge
                                                                variant={
                                                                    team.variant
                                                                }
                                                            />
                                                            <span className="text-xs text-muted-foreground">
                                                                <Users className="mr-0.5 inline h-3 w-3" />
                                                                {
                                                                    team.team_members_count
                                                                }
                                                                {team.max_members &&
                                                                    `/${team.max_members}`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                                </CardContent>
                                            </Card>
                                        </Link>
                                    ))}
                                </div>
                            </section>

                            {/* Pending Join Requests */}
                            {pendingJoinRequests.length > 0 && (
                                <section className="space-y-3">
                                    <SectionHeader
                                        title="Solicitudes"
                                        badge={pendingJoinRequests.length}
                                    />
                                    <div className="space-y-3">
                                        {pendingJoinRequests.map((request) => (
                                            <Card key={request.id}>
                                                <CardContent className="flex items-center gap-3 py-3">
                                                    <TeamAvatar
                                                        name={
                                                            request.team
                                                                ?.name ??
                                                            'Equipo'
                                                        }
                                                        logoUrl={
                                                            request.team
                                                                ?.logo_url
                                                        }
                                                        size="md"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-semibold">
                                                            {request.team?.name}
                                                        </p>
                                                        <div className="mt-0.5 flex items-center gap-2">
                                                            {request.team
                                                                ?.variant && (
                                                                <VariantBadge
                                                                    variant={
                                                                        request
                                                                            .team
                                                                            .variant
                                                                    }
                                                                />
                                                            )}
                                                            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                {formatTimeAgo(
                                                                    request.created_at,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                                        onClick={() =>
                                                            handleCancelRequest(
                                                                request.id,
                                                            )
                                                        }
                                                        title="Cancelar solicitud"
                                                        aria-label="Cancelar solicitud"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function PendingRequestsSection({
    requests,
    onCancel,
}: {
    requests: JoinRequest[];
    onCancel: (id: number) => void;
}) {
    return (
        <section className="space-y-3">
            <SectionHeader title="Solicitudes" badge={requests.length} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {requests.map((request) => (
                    <Card key={request.id}>
                        <CardContent className="flex items-center gap-3 py-3">
                            <TeamAvatar
                                name={request.team?.name ?? 'Equipo'}
                                logoUrl={request.team?.logo_url}
                                size="md"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold">
                                    {request.team?.name}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2">
                                    {request.team?.variant && (
                                        <VariantBadge
                                            variant={request.team.variant}
                                        />
                                    )}
                                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {formatTimeAgo(request.created_at)}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => onCancel(request.id)}
                                title="Cancelar solicitud"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}
