import { NextMatchSpotlight } from '@/components/dashboard/next-match-spotlight';
import { MatchCard } from '@/components/match-card';
import { TeamAvatar } from '@/components/team-avatar';
import { TournamentCard } from '@/components/tournament/tournament-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VariantBadge } from '@/components/variant-badge';
import AppLayout from '@/layouts/app-layout';
import joinRequests from '@/routes/join-requests';
import matches from '@/routes/matches';
import teams from '@/routes/teams';
import tournaments from '@/routes/tournaments';
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
    Award,
    Check,
    CheckCircle2,
    ChevronRight,
    Circle,
    Clock,
    type LucideIcon,
    Plus,
    Search,
    Users,
    X,
} from 'lucide-react';
import { useEffect } from 'react';
import { toast } from 'sonner';

type MyTeam = Team & { team_members_count: number };
type MatchWithHomeTeam = FootballMatch & { home_team: NonNullable<Team> };

interface PageProps {
    myTeams: MyTeam[];
    upcomingMatches: FootballMatch[];
    openMatches: FootballMatch[];
    pendingJoinRequests: JoinRequest[];
    incomingJoinRequests: JoinRequest[];
    discoverTeams: MyTeam[];
    activeTournaments: Tournament[];
    hasTeams: boolean;
    hasPublishedMatch: boolean;
    [key: string]: unknown;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
];

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
            <div className="flex items-center gap-2.5">
                <span aria-hidden className="h-4 w-1 rounded-full bg-primary" />
                <h2 className="font-display text-xl font-bold tracking-wide uppercase">
                    {title}
                </h2>
                {badge !== undefined && badge > 0 && (
                    <Badge variant="secondary" className="text-xs">
                        {badge}
                    </Badge>
                )}
            </div>
            {href && (
                <Link
                    href={href}
                    className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    {linkText}
                    <ArrowRight className="h-3 w-3" />
                </Link>
            )}
        </div>
    );
}

function QuickAction({
    label,
    icon: Icon,
    href,
}: {
    label: string;
    icon: LucideIcon;
    href: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-card"
        >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4.5" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {label}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </Link>
    );
}

function TeamRow({ team }: { team: MyTeam }) {
    return (
        <Link href={teams.show(team.id).url} className="group block">
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
                            <VariantBadge variant={team.variant} />
                            <span className="text-xs text-muted-foreground">
                                <Users className="mr-0.5 inline h-3 w-3" />
                                {team.team_members_count}
                                {team.max_members && `/${team.max_members}`}
                            </span>
                        </div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </CardContent>
            </Card>
        </Link>
    );
}

function NextSteps({
    steps,
}: {
    steps: { label: string; done: boolean; href: string }[];
}) {
    return (
        <section className="space-y-3">
            <SectionHeader title="Siguientes pasos" />
            <Card>
                <CardContent className="divide-y divide-border/60 py-0">
                    {steps.map((step) =>
                        step.done ? (
                            <div
                                key={step.label}
                                className="flex items-center gap-3 py-3"
                            >
                                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                                <span className="flex-1 text-sm text-muted-foreground line-through">
                                    {step.label}
                                </span>
                            </div>
                        ) : (
                            <Link
                                key={step.label}
                                href={step.href}
                                className="group flex items-center gap-3 py-3"
                            >
                                <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                                <span className="flex-1 text-sm font-medium">
                                    {step.label}
                                </span>
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        ),
                    )}
                </CardContent>
            </Card>
        </section>
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
    openMatches,
    pendingJoinRequests,
    incomingJoinRequests,
    discoverTeams,
    activeTournaments,
    hasTeams,
    hasPublishedMatch,
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
        router.delete(joinRequests.cancel(requestId).url, {
            preserveScroll: true,
            onSuccess: () => toast.success('Solicitud cancelada'),
            onError: () => toast.error('Error al cancelar la solicitud'),
        });
    };

    const handleAcceptRequest = (requestId: number) => {
        router.post(
            joinRequests.accept(requestId).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Solicitud aceptada'),
                onError: () => toast.error('Error al aceptar la solicitud'),
            },
        );
    };

    const handleRejectRequest = (requestId: number) => {
        router.post(
            joinRequests.reject(requestId).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Solicitud rechazada'),
                onError: () => toast.error('Error al rechazar la solicitud'),
            },
        );
    };

    const nextMatch = upcomingMatches.find((match) => match.home_team);

    const quickActions: { label: string; icon: LucideIcon; href: string }[] =
        hasTeams
            ? [
                  {
                      label: 'Publicar partido',
                      icon: Plus,
                      href: matches.create().url,
                  },
                  {
                      label: 'Buscar rival',
                      icon: Search,
                      href: matches.index({ query: { view: 'find' } }).url,
                  },
                  {
                      label: 'Descubrir equipos',
                      icon: Users,
                      href: teams.index({ query: { view: 'discover' } }).url,
                  },
                  {
                      label: 'Explorar torneos',
                      icon: Award,
                      href: tournaments.index().url,
                  },
              ]
            : [
                  {
                      label: 'Crear equipo',
                      icon: Plus,
                      href: teams.create().url,
                  },
                  {
                      label: 'Descubrir equipos',
                      icon: Users,
                      href: teams.index({ query: { view: 'discover' } }).url,
                  },
                  {
                      label: 'Explorar torneos',
                      icon: Award,
                      href: tournaments.index().url,
                  },
                  {
                      label: 'Buscar rival',
                      icon: Search,
                      href: matches.index({ query: { view: 'find' } }).url,
                  },
              ];

    const steps = [
        {
            label: 'Crear o unirte a un equipo',
            done: hasTeams,
            href: teams.index({ query: { view: 'discover' } }).url,
        },
        {
            label: 'Publicar tu primer partido',
            done: hasPublishedMatch,
            href: matches.create().url,
        },
        {
            label: 'Sumarte a un torneo',
            done: activeTournaments.length > 0,
            href: tournaments.index().url,
        },
    ];
    const showNextSteps = steps.some((step) => !step.done);

    const leftHasContent =
        openMatches.length > 0 || activeTournaments.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inicio" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Hero greeting */}
                <div className="relative -mx-4 -mt-4 overflow-hidden px-4 pt-6 pb-2 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-8">
                    <div
                        aria-hidden
                        className="bg-pitch-glow pointer-events-none absolute inset-0 -z-10"
                    />
                    <p className="font-display text-sm font-bold tracking-[0.18em] text-primary uppercase">
                        Tu cancha
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        ¡Hola, {firstName}!
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Esto es lo que está pasando en tus equipos
                    </p>
                </div>

                {/* Next-match spotlight */}
                <NextMatchSpotlight match={nextMatch} hasTeams={hasTeams} />

                {/* Quick actions */}
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {quickActions.map((action) => (
                        <QuickAction key={action.label} {...action} />
                    ))}
                </div>

                {/* Content grid */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column */}
                    <div className="space-y-6 lg:col-span-2">
                        {openMatches.length > 0 && (
                            <section className="space-y-3">
                                <SectionHeader
                                    title="Partidos abiertos"
                                    href={
                                        matches.index({
                                            query: { view: 'find' },
                                        }).url
                                    }
                                    linkText="Ver más"
                                />
                                <div className="grid gap-4 md:grid-cols-2">
                                    {openMatches
                                        .filter((match) => match.home_team)
                                        .map((match) => (
                                            <MatchCard
                                                key={match.id}
                                                match={
                                                    match as MatchWithHomeTeam
                                                }
                                            />
                                        ))}
                                </div>
                            </section>
                        )}

                        {activeTournaments.length > 0 && (
                            <section className="space-y-3">
                                <SectionHeader
                                    title="Torneos Activos"
                                    href={tournaments.index().url}
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

                        {/* Discovery fallback so the wide column is never blank */}
                        {!leftHasContent && discoverTeams.length > 0 && (
                            <section className="space-y-3">
                                <SectionHeader
                                    title="Descubrí equipos"
                                    href={
                                        teams.index({
                                            query: { view: 'discover' },
                                        }).url
                                    }
                                    linkText="Ver todos"
                                />
                                <p className="-mt-1 text-sm text-muted-foreground">
                                    Sumate a un equipo o encontrá rivales para
                                    tus próximos partidos.
                                </p>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {discoverTeams.map((team) => (
                                        <TeamRow key={team.id} team={team} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Right rail */}
                    <div className="space-y-6">
                        {myTeams.length > 0 && (
                            <section className="space-y-3">
                                <SectionHeader
                                    title="Mis Equipos"
                                    href={teams.index().url}
                                    badge={myTeams.length}
                                />
                                <div className="space-y-3">
                                    {myTeams.map((team) => (
                                        <TeamRow key={team.id} team={team} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Incoming requests (leader) */}
                        {incomingJoinRequests.length > 0 && (
                            <section className="space-y-3">
                                <SectionHeader
                                    title="Solicitudes recibidas"
                                    badge={incomingJoinRequests.length}
                                />
                                <div className="space-y-3">
                                    {incomingJoinRequests.map((request) => (
                                        <Card key={request.id}>
                                            <CardContent className="flex items-center gap-3 py-3">
                                                <TeamAvatar
                                                    name={
                                                        request.user?.name ??
                                                        'Jugador'
                                                    }
                                                    logoUrl={
                                                        request.user?.avatar_url
                                                    }
                                                    size="md"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold">
                                                        {request.user?.name}
                                                    </p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        quiere unirse a{' '}
                                                        {request.team?.name}
                                                    </p>
                                                </div>
                                                <div className="flex shrink-0 gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-primary hover:bg-primary/10 hover:text-primary"
                                                        onClick={() =>
                                                            handleAcceptRequest(
                                                                request.id,
                                                            )
                                                        }
                                                        title="Aceptar solicitud"
                                                        aria-label="Aceptar solicitud"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                        onClick={() =>
                                                            handleRejectRequest(
                                                                request.id,
                                                            )
                                                        }
                                                        title="Rechazar solicitud"
                                                        aria-label="Rechazar solicitud"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Outgoing requests */}
                        {pendingJoinRequests.length > 0 && (
                            <section className="space-y-3">
                                <SectionHeader
                                    title="Solicitudes enviadas"
                                    badge={pendingJoinRequests.length}
                                />
                                <div className="space-y-3">
                                    {pendingJoinRequests.map((request) => (
                                        <Card key={request.id}>
                                            <CardContent className="flex items-center gap-3 py-3">
                                                <TeamAvatar
                                                    name={
                                                        request.team?.name ??
                                                        'Equipo'
                                                    }
                                                    logoUrl={
                                                        request.team?.logo_url
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
                                                                    request.team
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

                        {showNextSteps && <NextSteps steps={steps} />}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
