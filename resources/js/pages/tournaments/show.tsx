import { TeamAvatar } from '@/components/team-avatar';
import { TournamentBracket } from '@/components/tournament/tournament-bracket';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    Award,
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

const teamStatusConfig = {
    pending: { label: 'Pendiente', variant: 'secondary' as const },
    approved: { label: 'Aprobado', variant: 'default' as const },
    rejected: { label: 'Rechazado', variant: 'destructive' as const },
    withdrawn: { label: 'Retirado', variant: 'outline' as const },
};

const breadcrumbs = (tournament: Tournament): BreadcrumbItem[] => [
    { title: 'Torneos', href: '/tournaments' },
    { title: tournament.name, href: `/tournaments/${tournament.id}` },
];

export default function TournamentShow({
    tournament,
    userTeams,
    permissions,
}: PageProps) {
    // Filter teams by variant first
    const eligibleTeams = userTeams.filter(
        (t) => t.variant === tournament.variant,
    );

    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
        eligibleTeams[0]?.id || null,
    );

    const { post, delete: destroy, processing } = useForm();
    const { flash } = usePage().props as any;

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
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
            {
                team_id: selectedTeamId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    // Page will reload with updated data
                },
                onError: (errors: Record<string, string>) => {
                    console.error('Registration error:', errors);
                    // Handle different error formats
                    let errorMessage = 'Error al registrar el equipo';

                    if (errors.team_id) {
                        // ValidationException errors come as arrays
                        errorMessage = Array.isArray(errors.team_id)
                            ? errors.team_id[0]
                            : errors.team_id;
                    } else if (errors.error) {
                        errorMessage = errors.error;
                    } else if (errors.message) {
                        errorMessage = errors.message;
                    } else if (typeof errors === 'string') {
                        errorMessage = errors;
                    }

                    toast.error(errorMessage);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs(tournament)}>
            <Head title={tournament.name} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-3">
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

                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full max-w-md grid-cols-3">
                        <TabsTrigger value="overview">Resumen</TabsTrigger>
                        <TabsTrigger value="bracket">Bracket</TabsTrigger>
                        <TabsTrigger value="teams">
                            Equipos ({approvedTeams.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Draft Status Notice for Organizer */}
                        {tournament.status === 'draft' &&
                            permissions.canEdit && (
                                <Card className="border-orange-500/50 bg-orange-500/5">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-base text-orange-700 dark:text-orange-400">
                                            <Info className="size-5" />
                                            Pasos Siguientes
                                        </CardTitle>
                                        <CardDescription>
                                            Completa estos pasos para activar tu
                                            torneo
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                                1
                                            </div>
                                            <div className="flex-1">
                                                <p className="mb-1 font-medium">
                                                    Abrir Inscripción
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Haz clic en "Abrir
                                                    Inscripción" arriba para
                                                    permitir que los equipos se
                                                    registren
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 opacity-60">
                                            <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                                2
                                            </div>
                                            <div className="flex-1">
                                                <p className="mb-1 font-medium">
                                                    Aprobar Equipos
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Revisa y aprueba las
                                                    solicitudes de los equipos
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 opacity-60">
                                            <div className="mt-0.5 flex size-6 items-center justify-center rounded-full bg-muted text-xs font-bold">
                                                3
                                            </div>
                                            <div className="flex-1">
                                                <p className="mb-1 font-medium">
                                                    Iniciar Torneo
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Cuando tengas suficientes
                                                    equipos (4, 8, 16, etc.),
                                                    inicia el torneo
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Draft Status Notice for Users */}
                        {tournament.status === 'draft' &&
                            !permissions.canEdit && (
                                <Card className="border-muted">
                                    <CardContent className="flex items-start gap-4 pt-6">
                                        <div className="rounded-full bg-muted p-3">
                                            <Info className="size-6 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="mb-2 text-base font-semibold">
                                                Inscripción No Disponible
                                            </h3>
                                            <p className="text-sm text-muted-foreground">
                                                Este torneo aún no ha abierto la
                                                inscripción. El organizador
                                                abrirá las inscripciones pronto.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* No User Teams Notice */}
                        {tournament.status === 'registration_open' &&
                            !canUserRegister &&
                            !userRegistration &&
                            userTeams.length === 0 && (
                                <Card className="border-blue-500/50 bg-blue-500/5">
                                    <CardContent className="flex items-start gap-4 pt-6">
                                        <div className="rounded-full bg-blue-500/10 p-3">
                                            <Users className="size-6 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="mb-2 text-base font-semibold">
                                                Necesitas un Equipo
                                            </h3>
                                            <p className="mb-3 text-sm text-muted-foreground">
                                                Para participar en este torneo,
                                                necesitas ser capitán o
                                                co-capitán de un equipo con la
                                                misma variante (
                                                {tournament.variant}).
                                            </p>
                                            <Link href="/teams">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    Ver Mis Equipos
                                                </Button>
                                            </Link>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                        {/* Registration */}
                        {canUserRegister && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Award className="size-5" />
                                        Registrar Equipo
                                    </CardTitle>
                                    <CardDescription>
                                        Inscribe uno de tus equipos en este
                                        torneo
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {eligibleTeams.length === 0 ? (
                                        <div className="rounded-lg border border-dashed p-4 text-center">
                                            <p className="mb-2 text-sm font-medium">
                                                No tienes equipos con esta
                                                variante
                                            </p>
                                            <p className="mb-3 text-xs text-muted-foreground">
                                                Necesitas un equipo de tipo{' '}
                                                <span className="font-semibold">
                                                    {tournament.variant}
                                                </span>
                                            </p>
                                            <Link href="/teams">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                >
                                                    Crear o Ver Equipos
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4 sm:flex-row">
                                            <Select
                                                value={
                                                    selectedTeamId?.toString() ||
                                                    ''
                                                }
                                                onValueChange={(value) =>
                                                    setSelectedTeamId(
                                                        parseInt(value),
                                                    )
                                                }
                                                disabled={processing}
                                            >
                                                <SelectTrigger className="flex-1">
                                                    <SelectValue placeholder="Selecciona un equipo" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {eligibleTeams.map(
                                                        (team) => (
                                                            <SelectItem
                                                                key={team.id}
                                                                value={team.id.toString()}
                                                            >
                                                                {team.name}
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
                                                className="gap-2"
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
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {userRegistration && (
                            <Card className="border-primary/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <Trophy className="size-5 text-primary" />
                                        Tu Registro
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <TeamAvatar
                                                name={
                                                    userRegistration.team!.name
                                                }
                                                logoUrl={
                                                    userRegistration.team!
                                                        .logo_url
                                                }
                                                size="sm"
                                            />
                                            <div>
                                                <p className="font-medium">
                                                    {
                                                        userRegistration.team!
                                                            .name
                                                    }
                                                </p>
                                                <Badge
                                                    variant={
                                                        teamStatusConfig[
                                                            userRegistration
                                                                .status
                                                        ].variant
                                                    }
                                                    className="mt-1"
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
                                </CardContent>
                            </Card>
                        )}

                        {/* Tournament Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="size-5" />
                                    Información del Torneo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            Organizador
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {tournament.organizer?.name ||
                                                'N/A'}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            Visibilidad
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {tournament.visibility === 'public'
                                                ? 'Público'
                                                : 'Solo por invitación'}
                                        </p>
                                    </div>
                                    {tournament.registration_deadline && (
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">
                                                Fecha límite de inscripción
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(
                                                    tournament.registration_deadline,
                                                ).toLocaleDateString('es-UY', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            Equipos Mínimos / Máximos
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {tournament.min_teams} /{' '}
                                            {tournament.max_teams}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Bracket Tab */}
                    <TabsContent value="bracket">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="size-5" />
                                    Bracket del Torneo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {tournament.status === 'in_progress' ||
                                tournament.status === 'completed' ? (
                                    tournament.rounds &&
                                    tournament.rounds.length > 0 ? (
                                        <TournamentBracket
                                            rounds={tournament.rounds}
                                        />
                                    ) : (
                                        <div className="py-12 text-center text-muted-foreground">
                                            No hay información de bracket
                                            disponible
                                        </div>
                                    )
                                ) : (
                                    <div className="py-12 text-center">
                                        <Award className="mx-auto mb-4 size-12 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            El bracket se generará cuando el
                                            torneo comience
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Teams Tab */}
                    <TabsContent value="teams" className="space-y-4">
                        {/* Pending Teams (for organizer) */}
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
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
