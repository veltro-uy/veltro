import { TeamAvatar } from '@/components/team-avatar';
import { TournamentBracket } from '@/components/tournament/tournament-bracket';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/user-avatar';
import { VariantBadge } from '@/components/variant-badge';
import AppLayout from '@/layouts/app-layout';
import tournamentMatches from '@/routes/tournaments/matches';
import type {
    BreadcrumbItem,
    FootballMatch,
    Team,
    Tournament,
    TournamentTeam,
} from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Calendar,
    CalendarClock,
    Check,
    Clock,
    Edit,
    Info,
    Loader2,
    MapPin,
    Pencil,
    Play,
    Trash2,
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
    };
    userTeams: Team[];
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
        canStart: boolean;
        canCancel: boolean;
        canApprove: boolean;
        canScheduleMatches: boolean;
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

function toLocalDatetimeInputValue(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function ScheduleMatchDialog({
    match,
    tournamentId,
    open,
    onOpenChange,
}: {
    match: FootballMatch | null;
    tournamentId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {match && (
                    <ScheduleMatchForm
                        key={match.id}
                        match={match}
                        tournamentId={tournamentId}
                        onClose={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function ScheduleMatchForm({
    match,
    tournamentId,
    onClose,
}: {
    match: FootballMatch;
    tournamentId: number;
    onClose: () => void;
}) {
    const [scheduledAt, setScheduledAt] = useState(() =>
        toLocalDatetimeInputValue(match.scheduled_at),
    );
    const [location, setLocation] = useState(() => match.location ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.patch(
            tournamentMatches.update([tournamentId, match.id]).url,
            {
                scheduled_at: scheduledAt || null,
                location: location.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Revisá los datos del partido.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const homeName = match.home_team?.name ?? 'Por definir';
    const awayName = match.away_team?.name ?? 'Por definir';

    return (
        <>
            <DialogHeader>
                <DialogTitle>Programar partido</DialogTitle>
                <DialogDescription>
                    {homeName} vs {awayName}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduled_at">Fecha y hora</Label>
                    <Input
                        id="scheduled_at"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                    />
                    {errors.scheduled_at && (
                        <p className="text-sm text-destructive">
                            {errors.scheduled_at}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location">Cancha</Label>
                    <Input
                        id="location"
                        type="text"
                        placeholder="Ej: Cancha 3 — Complejo Norte"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        maxLength={255}
                    />
                    {errors.location && (
                        <p className="text-sm text-destructive">
                            {errors.location}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            'Guardar'
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}

const statusConfig = {
    draft: { label: 'Borrador', variant: 'secondary' as const },
    registration_open: {
        label: 'Inscripción Abierta',
        variant: 'default' as const,
    },
    in_progress: { label: 'En Progreso', variant: 'default' as const },
    completed: { label: 'Completado', variant: 'outline' as const },
    cancelled: { label: 'Cancelado', variant: 'destructive' as const },
};

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
    { title: 'Torneos', href: '/tournaments' },
    { title: tournament.name, href: `/tournaments/${tournament.id}` },
];

export default function TournamentShow({
    tournament,
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
            `/tournaments/${tournament.id}/open-registration`,
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
            `/tournaments/${tournament.id}/register`,
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
            `/tournament-registrations/${registrationId}/approve`,
            'No se pudo aprobar el equipo',
        );
    };

    const handleReject = (registrationId: number) => {
        runAction(
            'post',
            `/tournament-registrations/${registrationId}/reject`,
            'No se pudo rechazar el equipo',
        );
    };

    const handleWithdraw = () => {
        if (withdrawId === null) return;
        runAction(
            'delete',
            `/tournament-registrations/${withdrawId}`,
            'No se pudo retirar la inscripción',
        );
        setWithdrawId(null);
    };

    const handleStart = () => {
        runAction(
            'post',
            `/tournaments/${tournament.id}/start`,
            'No se pudo iniciar el torneo',
        );
        setShowStartDialog(false);
    };

    const handleCancel = () => {
        runAction(
            'post',
            `/tournaments/${tournament.id}/cancel`,
            'No se pudo cancelar el torneo',
        );
        setShowCancelDialog(false);
    };

    const handleDelete = () => {
        runAction(
            'delete',
            `/tournaments/${tournament.id}`,
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

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-1 gap-4">
                        <Avatar className="size-14 rounded-lg">
                            {tournament.logo_url && (
                                <AvatarImage
                                    src={tournament.logo_url}
                                    alt={tournament.name}
                                />
                            )}
                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                                <Trophy className="size-7" />
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold tracking-tight">
                                    {tournament.name}
                                </h1>
                                <Badge
                                    variant={
                                        statusConfig[tournament.status].variant
                                    }
                                >
                                    {statusConfig[tournament.status].label}
                                </Badge>
                            </div>
                            {tournament.description && (
                                <p className="text-muted-foreground">
                                    {tournament.description}
                                </p>
                            )}
                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                <VariantBadge variant={tournament.variant} />
                                {tournament.starts_at && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="size-4" />
                                        <span>
                                            {new Date(
                                                tournament.starts_at,
                                            ).toLocaleDateString('es-UY', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                )}
                                {countdownLabel && (
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="size-4" />
                                        <span>{countdownLabel}</span>
                                    </div>
                                )}
                            </div>
                            <div className="max-w-md space-y-1.5 pt-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="size-3.5" />
                                        <span className="font-medium text-foreground">
                                            {approvedTeams.length}
                                        </span>
                                        {' / '}
                                        {tournament.max_teams} equipos
                                    </span>
                                    <span>mín. {tournament.min_teams}</span>
                                </div>
                                <Progress
                                    value={
                                        (approvedTeams.length /
                                            tournament.max_teams) *
                                        100
                                    }
                                    className="h-1.5"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        {permissions.canEdit && (
                            <Link href={`/tournaments/${tournament.id}/edit`}>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Edit className="size-4" />
                                    Editar
                                </Button>
                            </Link>
                        )}
                        {permissions.canEdit &&
                            tournament.status === 'draft' && (
                                <Button
                                    onClick={() => setShowOpenRegDialog(true)}
                                    disabled={processing}
                                    size="sm"
                                    className="gap-2"
                                >
                                    <Users className="size-4" />
                                    Abrir Inscripción
                                </Button>
                            )}
                        {permissions.canStart && (
                            <Button
                                onClick={() => setShowStartDialog(true)}
                                disabled={processing}
                                size="sm"
                                className="gap-2"
                            >
                                <Play className="size-4" />
                                Iniciar Torneo
                            </Button>
                        )}
                        {permissions.canCancel && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowCancelDialog(true)}
                                disabled={processing}
                                size="sm"
                                className="gap-2"
                            >
                                <X className="size-4" />
                                Cancelar
                            </Button>
                        )}
                        {permissions.canDelete && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={processing}
                                size="sm"
                                className="gap-2"
                            >
                                <Trash2 className="size-4" />
                                Eliminar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Two-column layout */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left column — main content */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Bracket */}
                        {hasBracket ? (
                            <>
                                <section className="space-y-4">
                                    <h2 className="text-lg font-semibold">
                                        Bracket
                                    </h2>
                                    <TournamentBracket
                                        rounds={tournament.rounds}
                                    />
                                </section>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">
                                            Programación de partidos
                                        </CardTitle>
                                        <CardDescription>
                                            {permissions.canScheduleMatches
                                                ? 'Definí la fecha, hora y cancha de cada partido.'
                                                : 'Fechas y canchas confirmadas por el organizador.'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {tournament.rounds.map((round) => (
                                            <div
                                                key={round.id}
                                                className="space-y-2"
                                            >
                                                <h3 className="text-sm font-medium text-muted-foreground">
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
                                                                        className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
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
                                                                                className="gap-1.5"
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

                    {/* Right column — sidebar */}
                    <div className="space-y-6">
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
                                                    <Link href="/teams">
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
                                        <Link href="/teams">
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

            <AlertDialog
                open={showOpenRegDialog}
                onOpenChange={setShowOpenRegDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Abrir Inscripción</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Abrir la inscripción del torneo? Los equipos podrán
                            registrarse después de esto.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleOpenRegistration}>
                            Abrir Inscripción
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={showStartDialog}
                onOpenChange={setShowStartDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Iniciar Torneo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas iniciar el torneo? Se
                            generará el bracket y no se podrán agregar más
                            equipos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStart}>
                            Iniciar Torneo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Torneo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas cancelar el torneo? Esta
                            acción puede afectar a los equipos inscriptos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Volver</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancel}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Cancelar Torneo
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Torneo</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas eliminar este torneo?
                            Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <ScheduleMatchDialog
                tournamentId={tournament.id}
                match={scheduleMatch}
                open={scheduleMatch !== null}
                onOpenChange={(open) => !open && setScheduleMatch(null)}
            />

            <AlertDialog
                open={withdrawId !== null}
                onOpenChange={(open) => !open && setWithdrawId(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirar Inscripción</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que deseas retirar la inscripción
                            de tu equipo del torneo?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleWithdraw}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Retirar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
