import { StandingsSkeleton } from '@/components/loading-skeletons';
import { TeamAvatar } from '@/components/team-avatar';
import { GroupDraw } from '@/components/tournament/group-draw';
import { GroupsGrid } from '@/components/tournament/groups-grid';
import { ScheduleMatchDialog } from '@/components/tournament/schedule-match-dialog';
import { StandingsTable } from '@/components/tournament/standings-table';
import { TournamentActionDialogs } from '@/components/tournament/tournament-action-dialogs';
import { TournamentBracket } from '@/components/tournament/tournament-bracket';
import { TournamentHeader } from '@/components/tournament/tournament-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/user-avatar';
import AppLayout from '@/layouts/app-layout';
import { calendarDaysUntil, formatDate, formatDateTime } from '@/lib/datetime';
import {
    tournamentCapacityColor,
    tournamentFormatLabel,
    tournamentStatusMeta,
} from '@/lib/tournament';
import { cn } from '@/lib/utils';
import teams from '@/routes/teams';
import tournamentRegistrations from '@/routes/tournament-registrations';
import tournaments from '@/routes/tournaments';
import type {
    BreadcrumbItem,
    FootballMatch,
    StandingRow,
    Team,
    Tournament,
    TournamentGroup,
    TournamentTeam,
} from '@/types';
import { Deferred, Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    ChartNoAxesColumnIncreasing,
    Check,
    Info,
    ListChecks,
    Loader2,
    MapPin,
    Pencil,
    Settings,
    Swords,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface PageProps {
    tournament: Tournament & {
        tournament_teams: (TournamentTeam & { team: Team })[];
        rounds: Array<{
            id: number;
            round_number: number;
            name: string;
            matches: FootballMatch[];
        }>;
        groups?: TournamentGroup[];
    };
    standings: StandingRow[] | null;
    groupStandings: Record<number, StandingRow[]> | null;
    userTeams: Team[];
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
        canStart: boolean;
        canCancel: boolean;
        canApprove: boolean;
        canScheduleMatches: boolean;
        canDrawGroups: boolean;
    };
}

function formatScheduledAt(value: string | null): string {
    if (!value) return 'Sin programar';
    return formatDateTime(value, {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function matchSortValue(match: FootballMatch): number {
    if (match.status === 'completed') return 2;
    if (!match.scheduled_at) return 1;
    return 0;
}

function sortMatchesUpcomingFirst(matches: FootballMatch[]): FootballMatch[] {
    return [...matches].sort((a, b) => {
        const statusDifference = matchSortValue(a) - matchSortValue(b);
        if (statusDifference !== 0) return statusDifference;

        const aDate = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
        const bDate = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;

        return a.status === 'completed' ? bDate - aDate : aDate - bDate;
    });
}

const teamStatusConfig: Record<
    string,
    {
        label: string;
        variant: 'default' | 'secondary' | 'outline' | 'destructive';
    }
> = {
    pending: { label: 'Pendiente', variant: 'secondary' },
    approved: { label: 'Aprobado', variant: 'default' },
    rejected: { label: 'Rechazado', variant: 'destructive' },
    withdrawn: { label: 'Retirado', variant: 'outline' },
};

function StatTile({
    icon: Icon,
    label,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-border/80">
            <div className="mb-2.5 flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="size-3.5" />
                </span>
                <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    {label}
                </span>
            </div>
            {children}
        </div>
    );
}

function MatchSide({
    team,
    align,
}: {
    team?: Team | null;
    align: 'start' | 'end';
}) {
    const name = team?.name ?? 'Por definir';
    return (
        <div
            className={cn(
                'flex min-w-0 flex-1 items-center gap-2.5',
                align === 'end' && 'flex-row-reverse text-right',
            )}
        >
            {team ? (
                <TeamAvatar
                    name={name}
                    logoUrl={team.logo_url}
                    size="sm"
                    className="size-8 shrink-0"
                />
            ) : (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-dashed text-muted-foreground">
                    <Users className="size-3.5" />
                </span>
            )}
            <span
                className={cn(
                    'truncate text-sm font-medium',
                    !team && 'text-muted-foreground',
                )}
            >
                {name}
            </span>
        </div>
    );
}

function ScheduleMatchRow({
    match,
    canEdit,
    onSchedule,
}: {
    match: FootballMatch;
    canEdit: boolean;
    onSchedule: () => void;
}) {
    const scheduled = Boolean(match.scheduled_at);
    return (
        <div
            className={cn(
                'rounded-xl border bg-card/40 p-3.5 transition-colors',
                canEdit && 'hover:border-primary/30 hover:bg-muted/20',
            )}
        >
            <div className="flex items-center gap-3">
                <MatchSide team={match.home_team} align="start" />
                <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    vs
                </span>
                <MatchSide team={match.away_team} align="end" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                <span
                    className={cn(
                        'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
                        scheduled
                            ? 'bg-muted/60 text-foreground'
                            : 'bg-amber-500/10 text-amber-500',
                    )}
                >
                    <CalendarClock className="size-3.5" />
                    {scheduled
                        ? formatScheduledAt(match.scheduled_at)
                        : 'Sin programar'}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {match.location ?? 'Por definir'}
                </span>
                {canEdit && (
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={onSchedule}
                        className="ml-auto h-7 gap-1.5 px-2.5 text-xs"
                    >
                        <Pencil className="size-3.5" />
                        {scheduled ? 'Editar' : 'Programar'}
                    </Button>
                )}
            </div>
        </div>
    );
}

function SidebarLabel({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-medium">{children}</span>
        </div>
    );
}

function formatCountdown(prefix: string, days: number): string {
    if (days < 0) return `${prefix} hace ${Math.abs(days)} días`;
    if (days === 0) return `${prefix} hoy`;
    if (days === 1) return `${prefix} mañana`;
    return `${prefix} en ${days} días`;
}

const breadcrumbs = (tournament: Tournament): BreadcrumbItem[] => [
    { title: 'Torneos', href: tournaments.index().url },
    {
        title: tournament.name,
        href: tournaments.show(tournament.public_id).url,
    },
];

export default function TournamentShow({
    tournament,
    standings,
    groupStandings,
    userTeams,
    permissions,
}: PageProps) {
    const eligibleTeams = userTeams.filter(
        (t) => t.variant === tournament.variant,
    );

    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
        eligibleTeams[0]?.id || null,
    );

    const [showOpenRegDialog, setShowOpenRegDialog] = useState(false);
    const [showStartDialog, setShowStartDialog] = useState(false);
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [withdrawId, setWithdrawId] = useState<number | null>(null);
    const [scheduleMatch, setScheduleMatch] = useState<FootballMatch | null>(
        null,
    );
    const [selectedRoundId, setSelectedRoundId] = useState(() => {
        const activeRound = tournament.rounds.find((round) =>
            round.matches?.some((match) => match.status !== 'completed'),
        );
        const fallbackRound = tournament.rounds.at(-1);

        return String(activeRound?.id ?? fallbackRound?.id ?? '');
    });

    const [processing, setProcessing] = useState(false);
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleErrors = (errors: Record<string, string>, fallback: string) => {
        const msg = errors.error || Object.values(errors)[0] || fallback;
        toast.error(Array.isArray(msg) ? msg[0] : msg);
    };

    const runAction = (
        method: 'post' | 'delete',
        url: string,
        fallbackError: string,
    ) => {
        setProcessing(true);
        const opts = {
            preserveScroll: true,
            onError: (errors: Record<string, string>) =>
                handleErrors(errors, fallbackError),
            onFinish: () => setProcessing(false),
        };
        if (method === 'post') router.post(url, {}, opts);
        else router.delete(url, opts);
    };

    const handleOpenRegistration = () => {
        runAction(
            'post',
            tournaments.openRegistration(tournament.id).url,
            'No se pudo abrir la inscripción',
        );
        setShowOpenRegDialog(false);
    };

    const handleRegister = () => {
        if (!selectedTeamId) {
            toast.error('Por favor selecciona un equipo');
            return;
        }

        router.post(
            tournaments.register(tournament.id).url,
            { team_id: selectedTeamId },
            {
                preserveScroll: true,
                onError: (errors: Record<string, string>) => {
                    const msg =
                        errors.team_id ||
                        errors.error ||
                        'Error al registrar el equipo';
                    toast.error(Array.isArray(msg) ? msg[0] : msg);
                },
            },
        );
    };

    const handleApprove = (registrationId: number) => {
        runAction(
            'post',
            tournamentRegistrations.approve(registrationId).url,
            'No se pudo aprobar el equipo',
        );
    };

    const handleReject = (registrationId: number) => {
        runAction(
            'post',
            tournamentRegistrations.reject(registrationId).url,
            'No se pudo rechazar el equipo',
        );
    };

    const handleWithdraw = () => {
        if (withdrawId === null) return;
        runAction(
            'delete',
            tournamentRegistrations.withdraw(withdrawId).url,
            'No se pudo retirar la inscripción',
        );
        setWithdrawId(null);
    };

    const handleStart = () => {
        runAction(
            'post',
            tournaments.start(tournament.id).url,
            'No se pudo iniciar el torneo',
        );
        setShowStartDialog(false);
    };

    const handleCancel = () => {
        runAction(
            'post',
            tournaments.cancel(tournament.id).url,
            'No se pudo cancelar el torneo',
        );
        setShowCancelDialog(false);
    };

    const handleDelete = () => {
        runAction(
            'delete',
            tournaments.destroy(tournament.id).url,
            'No se pudo eliminar el torneo',
        );
        setShowDeleteDialog(false);
    };

    const canUserRegister =
        tournament.is_registration_open === true &&
        userTeams.length > 0 &&
        !tournament.tournament_teams.some(
            (tt) =>
                userTeams.some((team) => team.id === tt.team_id) &&
                ['pending', 'approved'].includes(tt.status),
        );

    const userRegistration = tournament.tournament_teams.find(
        (tt) =>
            userTeams.some((team) => team.id === tt.team_id) &&
            ['pending', 'approved'].includes(tt.status),
    );

    const approvedTeams = tournament.tournament_teams.filter(
        (tt) => tt.status === 'approved',
    );
    const pendingTeams = tournament.tournament_teams.filter(
        (tt) => tt.status === 'pending',
    );
    const selectedRound =
        tournament.rounds.find(
            (round) => String(round.id) === selectedRoundId,
        ) ?? tournament.rounds.at(-1);
    const selectedMatches = sortMatchesUpcomingFirst(
        selectedRound?.matches ?? [],
    );
    const matchCount = tournament.rounds.reduce(
        (total, round) => total + (round.matches?.length ?? 0),
        0,
    );
    const competitionLabel =
        tournament.format === 'league'
            ? 'Tabla'
            : tournament.format === 'single_elimination'
              ? 'Llaves'
              : 'Competencia';
    const hasOrganizerManagement =
        permissions.canApprove ||
        permissions.canDrawGroups ||
        permissions.canEdit ||
        permissions.canScheduleMatches;

    const hasBracket =
        (tournament.status === 'in_progress' ||
            tournament.status === 'completed') &&
        tournament.rounds &&
        tournament.rounds.length > 0;

    let countdownLabel: string | null = null;
    if (tournament.is_registration_open && tournament.registration_deadline) {
        countdownLabel = formatCountdown(
            'Inscripción cierra',
            calendarDaysUntil(tournament.registration_deadline),
        );
    } else if (tournament.status === 'draft' && tournament.starts_at) {
        countdownLabel = formatCountdown(
            'Comienza',
            calendarDaysUntil(tournament.starts_at),
        );
    } else if (tournament.status === 'in_progress' && tournament.ends_at) {
        countdownLabel = formatCountdown(
            'Finaliza',
            calendarDaysUntil(tournament.ends_at),
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs(tournament)}>
            <Head title={tournament.name} />

            <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
                <TournamentHeader
                    tournament={tournament}
                    countdownLabel={countdownLabel}
                    permissions={permissions}
                    processing={processing}
                    onOpenRegistration={() => setShowOpenRegDialog(true)}
                    onStart={() => setShowStartDialog(true)}
                    onCancel={() => setShowCancelDialog(true)}
                    onDelete={() => setShowDeleteDialog(true)}
                />

                <Tabs defaultValue="overview" className="gap-5">
                    <div className="sticky top-14 z-20 -mx-4 overflow-x-auto border-y bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
                        <TabsList variant="line" className="h-10 w-max">
                            <TabsTrigger value="overview">
                                <Info />
                                Resumen
                            </TabsTrigger>
                            <TabsTrigger value="matches">
                                <Swords />
                                Partidos
                                <span className="rounded-full bg-muted px-1.5 text-xs font-semibold text-foreground">
                                    {matchCount}
                                </span>
                            </TabsTrigger>
                            <TabsTrigger value="competition">
                                <ChartNoAxesColumnIncreasing />
                                {competitionLabel}
                            </TabsTrigger>
                            <TabsTrigger value="teams">
                                <Users />
                                Equipos
                                <span className="rounded-full bg-muted px-1.5 text-xs font-semibold text-foreground">
                                    {approvedTeams.length}
                                </span>
                            </TabsTrigger>
                            {hasOrganizerManagement && (
                                <TabsTrigger value="management">
                                    <Settings />
                                    Gestión
                                    {pendingTeams.length > 0 && (
                                        <span className="rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                            {pendingTeams.length}
                                        </span>
                                    )}
                                </TabsTrigger>
                            )}
                        </TabsList>
                    </div>

                    <TabsContent
                        value="overview"
                        className="space-y-6 focus-visible:outline-none"
                    >
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <StatTile icon={Users} label="Equipos">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl leading-none font-bold tracking-tight tabular-nums">
                                        {approvedTeams.length}
                                    </span>
                                    <span className="text-sm font-medium text-muted-foreground">
                                        / {tournament.max_teams}
                                    </span>
                                    <span className="ml-auto text-[11px] text-muted-foreground">
                                        mín. {tournament.min_teams}
                                    </span>
                                </div>
                                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-500',
                                            tournamentCapacityColor(
                                                approvedTeams.length,
                                                tournament.max_teams,
                                            ),
                                        )}
                                        style={{
                                            width: `${Math.max(
                                                Math.min(
                                                    100,
                                                    Math.round(
                                                        (approvedTeams.length /
                                                            tournament.max_teams) *
                                                            100,
                                                    ),
                                                ),
                                                4,
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </StatTile>

                            <StatTile icon={Trophy} label="Formato">
                                <p className="truncate text-lg leading-tight font-semibold tracking-tight">
                                    {tournamentFormatLabel(tournament.format)}
                                </p>
                            </StatTile>

                            <StatTile icon={Info} label="Estado">
                                <p className="flex items-center gap-2 text-lg leading-tight font-semibold tracking-tight">
                                    {tournament.status === 'in_progress' && (
                                        <span className="relative flex size-2">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/70" />
                                            <span className="relative inline-flex size-2 rounded-full bg-primary" />
                                        </span>
                                    )}
                                    {tournamentStatusMeta(tournament).label}
                                </p>
                            </StatTile>

                            <StatTile icon={CalendarClock} label="Inicio">
                                <p className="text-lg leading-tight font-semibold tracking-tight">
                                    {tournament.starts_at
                                        ? formatDate(tournament.starts_at, {
                                              day: 'numeric',
                                              month: 'short',
                                              year: 'numeric',
                                          })
                                        : 'Por definir'}
                                </p>
                            </StatTile>
                        </div>

                        <div className="grid items-start gap-6 lg:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Información
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {tournament.organizer && (
                                        <>
                                            <div className="flex items-center gap-3">
                                                <UserAvatar
                                                    name={
                                                        tournament.organizer
                                                            .name
                                                    }
                                                    avatarUrl={
                                                        tournament.organizer
                                                            .avatar_url
                                                    }
                                                    size="md"
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {
                                                            tournament.organizer
                                                                .name
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Organizador
                                                    </p>
                                                </div>
                                            </div>
                                            <Separator />
                                        </>
                                    )}
                                    <div className="divide-y">
                                        <SidebarLabel label="Visibilidad">
                                            {tournament.visibility === 'public'
                                                ? 'Público'
                                                : 'Solo invitación'}
                                        </SidebarLabel>
                                        <SidebarLabel label="Equipos">
                                            {tournament.min_teams} –{' '}
                                            {tournament.max_teams}
                                        </SidebarLabel>
                                        {tournament.registration_deadline && (
                                            <SidebarLabel label="Cierre inscripción">
                                                {formatDate(
                                                    tournament.registration_deadline,
                                                    {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    },
                                                )}
                                            </SidebarLabel>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {(userRegistration || canUserRegister) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Inscripción
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {userRegistration && (
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <TeamAvatar
                                                        name={
                                                            userRegistration
                                                                .team!.name
                                                        }
                                                        logoUrl={
                                                            userRegistration
                                                                .team!.logo_url
                                                        }
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {
                                                                userRegistration
                                                                    .team!.name
                                                            }
                                                        </p>
                                                        <Badge
                                                            variant={
                                                                teamStatusConfig[
                                                                    userRegistration
                                                                        .status
                                                                ].variant
                                                            }
                                                            className="mt-0.5"
                                                        >
                                                            {
                                                                teamStatusConfig[
                                                                    userRegistration
                                                                        .status
                                                                ].label
                                                            }
                                                        </Badge>
                                                    </div>
                                                </div>
                                                {userRegistration.status ===
                                                    'pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            setWithdrawId(
                                                                userRegistration.id,
                                                            )
                                                        }
                                                        disabled={processing}
                                                    >
                                                        Retirar
                                                    </Button>
                                                )}
                                            </div>
                                        )}

                                        {canUserRegister && (
                                            <div className="space-y-3">
                                                {eligibleTeams.length === 0 ? (
                                                    <div className="rounded-lg border border-dashed p-3 text-center text-sm">
                                                        <p className="font-medium">
                                                            No tienes equipos
                                                            con esta variante
                                                        </p>
                                                        <Link
                                                            href={
                                                                teams.index()
                                                                    .url
                                                            }
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="mt-2"
                                                            >
                                                                Ver Equipos
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Select
                                                            value={
                                                                selectedTeamId?.toString() ||
                                                                ''
                                                            }
                                                            onValueChange={(
                                                                v,
                                                            ) =>
                                                                setSelectedTeamId(
                                                                    parseInt(v),
                                                                )
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Selecciona equipo" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {eligibleTeams.map(
                                                                    (team) => (
                                                                        <SelectItem
                                                                            key={
                                                                                team.id
                                                                            }
                                                                            value={team.id.toString()}
                                                                        >
                                                                            {
                                                                                team.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <Button
                                                            onClick={
                                                                handleRegister
                                                            }
                                                            disabled={
                                                                !selectedTeamId ||
                                                                processing
                                                            }
                                                            className="w-full gap-2"
                                                        >
                                                            {processing ? (
                                                                <>
                                                                    <Loader2 className="size-4 animate-spin" />
                                                                    Registrando...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Check className="size-4" />
                                                                    Registrar
                                                                </>
                                                            )}
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="grid gap-3 lg:grid-cols-2">
                            {tournament.status === 'draft' &&
                                permissions.canEdit && (
                                    <div className="flex items-start gap-3 rounded-lg border border-dashed p-3">
                                        <Info className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Torneo en borrador
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Abre la inscripción para que los
                                                equipos puedan registrarse.
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {tournament.status === 'registration_open' &&
                                permissions.canApprove &&
                                !permissions.canStart && (
                                    <div className="flex items-start gap-3 rounded-lg border border-dashed p-3">
                                        <Info className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Aún no puedes iniciar el torneo
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Necesitas {tournament.min_teams}{' '}
                                                o más equipos aprobados, y la
                                                cantidad debe ser potencia de 2
                                                (4, 8, 16, 32, 64).
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {tournament.status === 'draft' &&
                                !permissions.canEdit && (
                                    <div className="flex items-start gap-3 rounded-lg border border-dashed p-3">
                                        <Info className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Inscripción no disponible
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                El organizador abrirá las
                                                inscripciones pronto.
                                            </p>
                                        </div>
                                    </div>
                                )}

                            {tournament.is_registration_open &&
                                !canUserRegister &&
                                !userRegistration &&
                                userTeams.length === 0 && (
                                    <div className="flex items-start gap-3 rounded-lg border border-dashed p-3">
                                        <Users className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Necesitas un equipo
                                            </p>
                                            <p className="mb-2 text-xs text-muted-foreground">
                                                Para participar necesitas ser
                                                capitán o co-capitán de un
                                                equipo con la variante{' '}
                                                {tournament.variant}.
                                            </p>
                                            <Link href={teams.create().url}>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    Ver Mis Equipos
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                )}

                            {tournament.status === 'registration_open' &&
                                !tournament.is_registration_open &&
                                !userRegistration && (
                                    <div className="flex items-start gap-3 rounded-lg border border-dashed p-3">
                                        <Info className="mt-0.5 size-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">
                                                Inscripción cerrada
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                El plazo de inscripción
                                                finalizó. El organizador
                                                iniciará el torneo próximamente.
                                            </p>
                                        </div>
                                    </div>
                                )}
                        </div>
                    </TabsContent>

                    <TabsContent
                        value="matches"
                        className="focus-visible:outline-none"
                    >
                        <Card>
                            <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <CardTitle className="text-base">
                                        Programación de partidos
                                    </CardTitle>
                                    <CardDescription>
                                        {permissions.canScheduleMatches
                                            ? 'Definí la fecha, hora y cancha de cada partido.'
                                            : 'Fechas y canchas confirmadas por el organizador.'}
                                    </CardDescription>
                                </div>
                                {tournament.rounds.length > 0 && (
                                    <Select
                                        value={selectedRoundId}
                                        onValueChange={setSelectedRoundId}
                                    >
                                        <SelectTrigger className="w-full sm:w-56">
                                            <SelectValue placeholder="Seleccioná una ronda" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {tournament.rounds.map((round) => (
                                                <SelectItem
                                                    key={round.id}
                                                    value={String(round.id)}
                                                >
                                                    {round.name} ·{' '}
                                                    {round.matches?.length ?? 0}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </CardHeader>
                            <CardContent>
                                {!selectedRound ? (
                                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                                        <CalendarClock className="size-8 text-muted-foreground" />
                                        <p className="font-medium">
                                            Todavía no hay partidos
                                        </p>
                                        <p className="max-w-md text-sm text-muted-foreground">
                                            El calendario aparecerá cuando el
                                            torneo comience y se generen las
                                            rondas.
                                        </p>
                                    </div>
                                ) : selectedMatches.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                                        <Swords className="size-8 text-muted-foreground" />
                                        <p className="font-medium">
                                            {selectedRound.name} no tiene
                                            partidos todavía
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedMatches.map((match) => {
                                            const isLocked =
                                                match.status ===
                                                    'in_progress' ||
                                                match.status === 'completed';
                                            return (
                                                <ScheduleMatchRow
                                                    key={match.id}
                                                    match={match}
                                                    canEdit={
                                                        permissions.canScheduleMatches &&
                                                        !isLocked
                                                    }
                                                    onSchedule={() =>
                                                        setScheduleMatch(match)
                                                    }
                                                />
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent
                        value="competition"
                        className="space-y-6 focus-visible:outline-none"
                    >
                        {hasBracket ? (
                            tournament.format === 'league' ? (
                                <Deferred
                                    data="standings"
                                    fallback={<StandingsSkeleton />}
                                >
                                    {standings ? (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>
                                                    Tabla de posiciones
                                                </CardTitle>
                                                <CardDescription>
                                                    Clasificación general del
                                                    torneo
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <StandingsTable
                                                    rows={standings}
                                                    highlightTopN={1}
                                                />
                                            </CardContent>
                                        </Card>
                                    ) : null}
                                </Deferred>
                            ) : tournament.format === 'group_stage_knockout' ? (
                                <>
                                    {tournament.groups && (
                                        <Deferred
                                            data="groupStandings"
                                            fallback={<StandingsSkeleton />}
                                        >
                                            {groupStandings ? (
                                                <section className="space-y-4">
                                                    <h2 className="text-lg font-semibold">
                                                        {tournament.phase ===
                                                            'knockout' ||
                                                        tournament.phase ===
                                                            'completed'
                                                            ? 'Tablas finales de grupos'
                                                            : 'Fase de grupos'}
                                                    </h2>
                                                    <GroupsGrid
                                                        groups={
                                                            tournament.groups
                                                        }
                                                        standingsByGroup={
                                                            groupStandings
                                                        }
                                                        highlightTopN={2}
                                                    />
                                                </section>
                                            ) : null}
                                        </Deferred>
                                    )}
                                    {(tournament.phase === 'knockout' ||
                                        tournament.phase === 'completed') && (
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Llaves</CardTitle>
                                                <CardDescription>
                                                    Cruces de eliminación
                                                    directa
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <TournamentBracket
                                                    rounds={tournament.rounds.filter(
                                                        (round) =>
                                                            !round.matches?.some(
                                                                (match) =>
                                                                    match.tournament_group_id !=
                                                                    null,
                                                            ),
                                                    )}
                                                />
                                            </CardContent>
                                        </Card>
                                    )}
                                </>
                            ) : (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Llaves</CardTitle>
                                        <CardDescription>
                                            Camino hacia la final del torneo
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <TournamentBracket
                                            rounds={tournament.rounds}
                                        />
                                    </CardContent>
                                </Card>
                            )
                        ) : (
                            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-12 text-center">
                                <Trophy className="size-8 text-muted-foreground" />
                                <p className="font-medium">
                                    La competencia todavía no comenzó
                                </p>
                                <p className="max-w-md text-sm text-muted-foreground">
                                    {tournament.status === 'cancelled'
                                        ? 'El torneo fue cancelado antes de generar la competencia.'
                                        : `La tabla o las llaves aparecerán al iniciar con al menos ${tournament.min_teams} equipos aprobados.`}
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="teams"
                        className="focus-visible:outline-none"
                    >
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Equipos confirmados ({approvedTeams.length})
                                </CardTitle>
                                <CardDescription>
                                    Equipos que participarán en el torneo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {approvedTeams.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 py-12 text-center">
                                        <Users className="size-8 text-muted-foreground" />
                                        <p className="font-medium">
                                            Todavía no hay equipos confirmados
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Las inscripciones aprobadas
                                            aparecerán acá.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {approvedTeams.map((tt) => {
                                            const team = tt.team!;
                                            const memberCount =
                                                team.team_members?.length ?? 0;
                                            const captain =
                                                team.team_members?.find(
                                                    (member) =>
                                                        member.role ===
                                                        'captain',
                                                )?.user?.name;
                                            return (
                                                <div
                                                    key={tt.id}
                                                    className="flex items-center gap-3 rounded-xl border bg-card/40 p-3 transition-colors hover:border-primary/30 hover:bg-muted/20"
                                                >
                                                    <TeamAvatar
                                                        name={team.name}
                                                        logoUrl={team.logo_url}
                                                        size="md"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate font-medium">
                                                            {team.name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {captain
                                                                ? `Cap. ${captain}`
                                                                : `${memberCount} jugador${memberCount === 1 ? '' : 'es'}`}
                                                        </p>
                                                    </div>
                                                    {tt.seed && (
                                                        <Badge
                                                            variant="outline"
                                                            className="shrink-0"
                                                        >
                                                            #{tt.seed}
                                                        </Badge>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {hasOrganizerManagement && (
                        <TabsContent
                            value="management"
                            className="space-y-6 focus-visible:outline-none"
                        >
                            {tournament.format === 'group_stage_knockout' &&
                                permissions.canDrawGroups &&
                                tournament.groups &&
                                tournament.groups.length > 0 &&
                                (tournament.status === 'draft' ||
                                    tournament.status ===
                                        'registration_open') && (
                                    <GroupDraw
                                        tournamentId={tournament.id}
                                        groups={tournament.groups}
                                        approvedTeams={
                                            approvedTeams as (TournamentTeam & {
                                                team: Team;
                                            })[]
                                        }
                                        groupSize={tournament.group_size ?? 4}
                                    />
                                )}

                            {permissions.canApprove &&
                            pendingTeams.length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Equipos pendientes (
                                            {pendingTeams.length})
                                        </CardTitle>
                                        <CardDescription>
                                            Revisá las solicitudes de registro
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {pendingTeams.map((tt) => {
                                            const team = tt.team!;
                                            const memberCount =
                                                team.team_members?.length ?? 0;
                                            return (
                                                <div
                                                    key={tt.id}
                                                    className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <TeamAvatar
                                                            name={team.name}
                                                            logoUrl={
                                                                team.logo_url
                                                            }
                                                            size="sm"
                                                        />
                                                        <div>
                                                            <p className="font-medium">
                                                                {team.name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {memberCount}{' '}
                                                                jugador
                                                                {memberCount ===
                                                                1
                                                                    ? ''
                                                                    : 'es'}
                                                                {
                                                                    ' · Registrado '
                                                                }
                                                                {formatDate(
                                                                    tt.registered_at,
                                                                    {
                                                                        day: 'numeric',
                                                                        month: 'numeric',
                                                                        year: 'numeric',
                                                                    },
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 sm:justify-end">
                                                        <Button
                                                            size="sm"
                                                            onClick={() =>
                                                                handleApprove(
                                                                    tt.id,
                                                                )
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            className="flex-1 gap-1 sm:flex-none"
                                                        >
                                                            <Check className="size-3" />
                                                            Aprobar
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() =>
                                                                handleReject(
                                                                    tt.id,
                                                                )
                                                            }
                                                            disabled={
                                                                processing
                                                            }
                                                            className="flex-1 gap-1 sm:flex-none"
                                                        >
                                                            <X className="size-3" />
                                                            Rechazar
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-12 text-center">
                                    <ListChecks className="size-8 text-muted-foreground" />
                                    <p className="font-medium">
                                        No hay gestiones pendientes
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Las solicitudes nuevas aparecerán acá.
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            <ScheduleMatchDialog
                tournamentId={tournament.id}
                match={scheduleMatch}
                open={scheduleMatch !== null}
                onOpenChange={(open) => !open && setScheduleMatch(null)}
            />

            <TournamentActionDialogs
                openRegistrationOpen={showOpenRegDialog}
                startOpen={showStartDialog}
                cancelOpen={showCancelDialog}
                deleteOpen={showDeleteDialog}
                withdrawOpen={withdrawId !== null}
                onOpenRegistrationOpenChange={setShowOpenRegDialog}
                onStartOpenChange={setShowStartDialog}
                onCancelOpenChange={setShowCancelDialog}
                onDeleteOpenChange={setShowDeleteDialog}
                onWithdrawOpenChange={(open) => !open && setWithdrawId(null)}
                onOpenRegistration={handleOpenRegistration}
                onStart={handleStart}
                onCancel={handleCancel}
                onDelete={handleDelete}
                onWithdraw={handleWithdraw}
            />
        </AppLayout>
    );
}
