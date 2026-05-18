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
import { UserAvatar } from '@/components/user-avatar';
import AppLayout from '@/layouts/app-layout';
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
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CalendarClock,
    Check,
    Info,
    Loader2,
    MapPin,
    Pencil,
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
    const date = new Date(value);
    return date.toLocaleString('es-UY', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
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

function daysUntil(date: string): number {
    const now = new Date();
    const target = new Date(date);
    const diffMs = target.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatCountdown(prefix: string, days: number): string {
    if (days < 0) return `${prefix} hace ${Math.abs(days)} días`;
    if (days === 0) return `${prefix} hoy`;
    if (days === 1) return `${prefix} mañana`;
    return `${prefix} en ${days} días`;
}

const breadcrumbs = (tournament: Tournament): BreadcrumbItem[] => [
    { title: 'Torneos', href: tournaments.index().url },
    { title: tournament.name, href: tournaments.show(tournament.id).url },
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
        tournament.status === 'registration_open' &&
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

    const hasBracket =
        (tournament.status === 'in_progress' ||
            tournament.status === 'completed') &&
        tournament.rounds &&
        tournament.rounds.length > 0;

    let countdownLabel: string | null = null;
    if (
        tournament.status === 'registration_open' &&
        tournament.registration_deadline
    ) {
        countdownLabel = formatCountdown(
            'Inscripción cierra',
            daysUntil(tournament.registration_deadline),
        );
    } else if (tournament.status === 'draft' && tournament.starts_at) {
        countdownLabel = formatCountdown(
            'Comienza',
            daysUntil(tournament.starts_at),
        );
    } else if (tournament.status === 'in_progress' && tournament.ends_at) {
        countdownLabel = formatCountdown(
            'Finaliza',
            daysUntil(tournament.ends_at),
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs(tournament)}>
            <Head title={tournament.name} />

            <div className="mx-auto flex h-full w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
                <TournamentHeader
                    tournament={tournament}
                    approvedTeamsCount={approvedTeams.length}
                    countdownLabel={countdownLabel}
                    permissions={permissions}
                    processing={processing}
                    onOpenRegistration={() => setShowOpenRegDialog(true)}
                    onStart={() => setShowStartDialog(true)}
                    onCancel={() => setShowCancelDialog(true)}
                    onDelete={() => setShowDeleteDialog(true)}
                />

                <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
                    <div className="min-w-0 space-y-6">
                        {/* Group draw (group_stage_knockout, pre-start) */}
                        {tournament.format === 'group_stage_knockout' &&
                            permissions.canDrawGroups &&
                            tournament.groups &&
                            tournament.groups.length > 0 &&
                            (tournament.status === 'draft' ||
                                tournament.status === 'registration_open') && (
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

                        {/* Bracket / Standings / Groups */}
                        {hasBracket ? (
                            <>
                                {tournament.format === 'league' && standings ? (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>
                                                Tabla de Posiciones
                                            </CardTitle>
                                            <CardDescription>
                                                Clasificación general del torneo
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <StandingsTable
                                                rows={standings}
                                                highlightTopN={1}
                                            />
                                        </CardContent>
                                    </Card>
                                ) : tournament.format ===
                                  'group_stage_knockout' ? (
                                    <>
                                        {tournament.groups &&
                                            groupStandings && (
                                                <section className="space-y-4">
                                                    <h2 className="text-lg font-semibold">
                                                        {tournament.phase ===
                                                            'knockout' ||
                                                        tournament.phase ===
                                                            'completed'
                                                            ? 'Tablas Finales de Grupos'
                                                            : 'Fase de Grupos'}
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
                                            )}
                                        {(tournament.phase === 'knockout' ||
                                            tournament.phase ===
                                                'completed') && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>
                                                        Bracket
                                                    </CardTitle>
                                                    <CardDescription>
                                                        Cruces de eliminación
                                                        directa
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <TournamentBracket
                                                        rounds={tournament.rounds.filter(
                                                            (r) =>
                                                                !r.matches?.some(
                                                                    (m) =>
                                                                        m.tournament_group_id !=
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
                                            <CardTitle>Bracket</CardTitle>
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
                                )}

                                <Card>
                                    <CardHeader className="border-b">
                                        <CardTitle className="text-base">
                                            Programación de partidos
                                        </CardTitle>
                                        <CardDescription>
                                            {permissions.canScheduleMatches
                                                ? 'Definí la fecha, hora y cancha de cada partido.'
                                                : 'Fechas y canchas confirmadas por el organizador.'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {tournament.rounds.map((round) => (
                                            <div
                                                key={round.id}
                                                className="space-y-2.5"
                                            >
                                                <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                                    {round.name}
                                                </h3>
                                                <div className="space-y-2">
                                                    {(round.matches?.length ??
                                                        0) === 0 ? (
                                                        <p className="text-sm text-muted-foreground">
                                                            Sin partidos
                                                        </p>
                                                    ) : (
                                                        round.matches!.map(
                                                            (match) => {
                                                                const home =
                                                                    match
                                                                        .home_team
                                                                        ?.name ??
                                                                    'Por definir';
                                                                const away =
                                                                    match
                                                                        .away_team
                                                                        ?.name ??
                                                                    'Por definir';
                                                                const isLocked =
                                                                    match.status ===
                                                                        'in_progress' ||
                                                                    match.status ===
                                                                        'completed';
                                                                const canEditMatch =
                                                                    permissions.canScheduleMatches &&
                                                                    !isLocked;
                                                                return (
                                                                    <div
                                                                        key={
                                                                            match.id
                                                                        }
                                                                        className={cn(
                                                                            'flex flex-col gap-3 rounded-lg border bg-card/40 p-3 transition-colors sm:flex-row sm:items-center sm:justify-between',
                                                                            canEditMatch &&
                                                                                'hover:border-primary/30 hover:bg-muted/20',
                                                                        )}
                                                                    >
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="truncate text-sm font-medium">
                                                                                {
                                                                                    home
                                                                                }{' '}
                                                                                <span className="text-muted-foreground">
                                                                                    vs
                                                                                </span>{' '}
                                                                                {
                                                                                    away
                                                                                }
                                                                            </p>
                                                                            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                                                                <span className="flex items-center gap-1">
                                                                                    <CalendarClock className="size-3.5" />
                                                                                    {match.scheduled_at ? (
                                                                                        formatScheduledAt(
                                                                                            match.scheduled_at,
                                                                                        )
                                                                                    ) : (
                                                                                        <Badge
                                                                                            variant="outline"
                                                                                            className="font-normal"
                                                                                        >
                                                                                            Sin
                                                                                            programar
                                                                                        </Badge>
                                                                                    )}
                                                                                </span>
                                                                                <span className="flex items-center gap-1">
                                                                                    <MapPin className="size-3.5" />
                                                                                    {match.location ??
                                                                                        'Por definir'}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                        {canEditMatch && (
                                                                            <Button
                                                                                size="sm"
                                                                                variant="outline"
                                                                                onClick={() =>
                                                                                    setScheduleMatch(
                                                                                        match,
                                                                                    )
                                                                                }
                                                                                className="w-full gap-1.5 sm:w-auto"
                                                                            >
                                                                                <Pencil className="size-3.5" />
                                                                                {match.scheduled_at
                                                                                    ? 'Editar'
                                                                                    : 'Programar'}
                                                                            </Button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            (tournament.status === 'draft' ||
                                tournament.status === 'registration_open') && (
                                <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
                                    <Trophy className="size-8 text-muted-foreground" />
                                    <p className="text-sm font-medium">
                                        El bracket se generará cuando el torneo
                                        comience
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Necesitas al menos{' '}
                                        {tournament.min_teams} equipos aprobados
                                    </p>
                                </div>
                            )
                        )}

                        {/* Pending Teams (organizer only) */}
                        {permissions.canApprove && pendingTeams.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">
                                        Equipos Pendientes (
                                        {pendingTeams.length})
                                    </CardTitle>
                                    <CardDescription>
                                        Revisa y aprueba las solicitudes de
                                        registro
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {pendingTeams.map((tt) => {
                                            const team = tt.team!;
                                            const memberCount =
                                                team.team_members?.length ?? 0;
                                            return (
                                                <div
                                                    key={tt.id}
                                                    className="flex items-center justify-between rounded-lg border p-3"
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
                                                                {new Date(
                                                                    tt.registered_at,
                                                                ).toLocaleDateString(
                                                                    'es-UY',
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
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
                                                            className="gap-1"
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
                                                            className="gap-1"
                                                        >
                                                            <X className="size-3" />
                                                            Rechazar
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Approved Teams */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">
                                    Equipos Confirmados ({approvedTeams.length})
                                </CardTitle>
                                <CardDescription>
                                    Equipos que participarán en el torneo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {approvedTeams.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        No hay equipos confirmados aún
                                    </div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {approvedTeams.map((tt) => {
                                            const team = tt.team!;
                                            const memberCount =
                                                team.team_members?.length ?? 0;
                                            const captain =
                                                team.team_members?.find(
                                                    (m) => m.role === 'captain',
                                                )?.user?.name;
                                            return (
                                                <div
                                                    key={tt.id}
                                                    className="flex items-center gap-3 rounded-lg border p-3"
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
                    </div>

                    <div className="order-first space-y-4 xl:sticky xl:top-20 xl:order-none">
                        {/* Tournament Info */}
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
                                                name={tournament.organizer.name}
                                                avatarUrl={
                                                    tournament.organizer
                                                        .avatar_url
                                                }
                                                size="md"
                                            />
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {tournament.organizer.name}
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
                                            {new Date(
                                                tournament.registration_deadline,
                                            ).toLocaleDateString('es-UY', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </SidebarLabel>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Registration + User Status */}
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
                                                        userRegistration.team!
                                                            .name
                                                    }
                                                    logoUrl={
                                                        userRegistration.team!
                                                            .logo_url
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
                                                        No tienes equipos con
                                                        esta variante
                                                    </p>
                                                    <Link
                                                        href={teams.index().url}
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
                                                        onValueChange={(v) =>
                                                            setSelectedTeamId(
                                                                parseInt(v),
                                                            )
                                                        }
                                                        disabled={processing}
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
                                                        onClick={handleRegister}
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

                        {/* Notices */}
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
                                            Necesitas {tournament.min_teams} o
                                            más equipos aprobados, y la cantidad
                                            debe ser potencia de 2 (4, 8, 16,
                                            32, 64).
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

                        {tournament.status === 'registration_open' &&
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
                                            capitán o co-capitán de un equipo
                                            con la variante {tournament.variant}
                                            .
                                        </p>
                                        <Link href={teams.create().url}>
                                            <Button size="sm" variant="outline">
                                                Ver Mis Equipos
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
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
