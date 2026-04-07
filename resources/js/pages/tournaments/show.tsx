import { TeamAvatar } from '@/components/team-avatar';
import { TournamentBracket } from '@/components/tournament/tournament-bracket';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { VariantBadge } from '@/components/variant-badge';
import AppLayout from '@/layouts/app-layout';
import type {
    BreadcrumbItem,
    FootballMatch,
    Team,
    Tournament,
    TournamentTeam,
} from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Calendar,
    Check,
    Edit,
    Info,
    Loader2,
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
    };
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

    const { post, delete: destroy, processing } = useForm();
    const { flash } = usePage<{
        flash?: { success?: string; error?: string };
    }>().props;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
    }, [flash]);

    const handleOpenRegistration = () => {
        if (
            confirm(
                '¿Abrir la inscripción del torneo? Los equipos podrán registrarse después de esto.',
            )
        ) {
            post(`/tournaments/${tournament.id}/open-registration`);
        }
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
        post(`/tournament-registrations/${registrationId}/approve`);
    };

    const handleReject = (registrationId: number) => {
        post(`/tournament-registrations/${registrationId}/reject`);
    };

    const handleWithdraw = (registrationId: number) => {
        destroy(`/tournament-registrations/${registrationId}`);
    };

    const handleStart = () => {
        if (
            confirm(
                '¿Estás seguro de que deseas iniciar el torneo? Se generará el bracket y no se podrán agregar más equipos.',
            )
        ) {
            post(`/tournaments/${tournament.id}/start`);
        }
    };

    const handleCancel = () => {
        if (confirm('¿Estás seguro de que deseas cancelar el torneo?')) {
            post(`/tournaments/${tournament.id}/cancel`);
        }
    };

    const handleDelete = () => {
        if (
            confirm(
                '¿Estás seguro de que deseas eliminar este torneo? Esta acción no se puede deshacer.',
            )
        ) {
            destroy(`/tournaments/${tournament.id}`);
        }
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
                                <div className="flex items-center gap-1.5">
                                    <Users className="size-4" />
                                    <span>
                                        <span className="font-medium text-foreground">
                                            {approvedTeams.length}
                                        </span>
                                        {' / '}
                                        {tournament.max_teams} equipos
                                    </span>
                                </div>
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
                                    onClick={handleOpenRegistration}
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
                                onClick={handleStart}
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
                                onClick={handleCancel}
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
                                onClick={handleDelete}
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
                            <section className="space-y-4">
                                <h2 className="text-lg font-semibold">
                                    Bracket
                                </h2>
                                <TournamentBracket rounds={tournament.rounds} />
                            </section>
                        ) : (
                            (tournament.status === 'draft' ||
                                tournament.status === 'registration_open') && (
                                <div className="flex items-center gap-2 rounded-lg border border-dashed px-4 py-3 text-sm text-muted-foreground">
                                    <Trophy className="size-4" />
                                    El bracket se generará cuando el torneo
                                    comience
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
                                        {pendingTeams.map((tt) => (
                                            <div
                                                key={tt.id}
                                                className="flex items-center justify-between rounded-lg border p-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <TeamAvatar
                                                        name={tt.team!.name}
                                                        logoUrl={
                                                            tt.team!.logo_url
                                                        }
                                                        size="sm"
                                                    />
                                                    <div>
                                                        <p className="font-medium">
                                                            {tt.team!.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Registrado{' '}
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
                                                            handleApprove(tt.id)
                                                        }
                                                        disabled={processing}
                                                        className="gap-1"
                                                    >
                                                        <Check className="size-3" />
                                                        Aprobar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleReject(tt.id)
                                                        }
                                                        disabled={processing}
                                                        className="gap-1"
                                                    >
                                                        <X className="size-3" />
                                                        Rechazar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
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
                                        {approvedTeams.map((tt) => (
                                            <div
                                                key={tt.id}
                                                className="flex items-center gap-3 rounded-lg border p-3"
                                            >
                                                <TeamAvatar
                                                    name={tt.team!.name}
                                                    logoUrl={tt.team!.logo_url}
                                                    size="sm"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate font-medium">
                                                        {tt.team!.name}
                                                    </p>
                                                    {tt.seed && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Seed #{tt.seed}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right column — sidebar */}
                    <div className="space-y-6">
                        {/* Tournament Info */}
                        <Card>
                            <CardContent className="py-4">
                                <h3 className="mb-1 text-sm font-semibold">
                                    Información
                                </h3>
                                <div className="divide-y">
                                    <SidebarLabel label="Organizador">
                                        {tournament.organizer?.name || 'N/A'}
                                    </SidebarLabel>
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
                                <CardContent className="py-4">
                                    <h3 className="mb-3 text-sm font-semibold">
                                        Inscripción
                                    </h3>

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
                                                        handleWithdraw(
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
        </AppLayout>
    );
}
