import { EditTeamModal } from '@/components/edit-team-modal';
import { InviteTeamMemberModal } from '@/components/invite-team-member-modal';
import { JoinRequestDialog } from '@/components/join-request-dialog';
import { MemberManagementDropdown } from '@/components/member-management-dropdown';
import { TeamAvatar } from '@/components/team-avatar';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/user-avatar';
import { UserNameLink } from '@/components/user-name-link';
import { VariantBadge } from '@/components/variant-badge';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import { variantMaxMembers } from '@/lib/variants';
import joinRequests from '@/routes/join-requests';
import teamInvitations from '@/routes/team-invitations';
import teams from '@/routes/teams';
import type { BreadcrumbItem, TeamStatistics, User } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Copy,
    Inbox,
    LogOut,
    Mail,
    Shield,
    Star,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TeamMember {
    id: number;
    user_id: number;
    team_id: number;
    role: string;
    position?: string | null;
    status: string;
    user: User;
}

interface JoinRequest {
    id: number;
    user_id: number;
    team_id: number;
    status: string;
    message?: string;
    user: User;
}

interface TeamInvitation {
    id: number;
    email: string;
    token: string;
    role: 'player' | 'co_captain';
    status: 'pending' | 'expired' | 'revoked' | 'accepted';
    expires_at: string;
    created_at: string;
    inviter?: { id: number; name: string } | null;
}

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
    logo_path?: string;
    description?: string;
    team_members: TeamMember[];
    pending_join_requests: JoinRequest[];
    max_members?: number;
    created_at: string;
    updated_at: string;
}

const formatRelativeExpiry = (expiresAt: string, nowMs: number): string => {
    const target = new Date(expiresAt).getTime();
    const diffMs = target - nowMs;
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffMs <= 0) {
        const ago = Math.abs(diffDays);
        if (ago === 0) return 'expirada hoy';
        if (ago === 1) return 'expirada hace 1 día';
        return `expirada hace ${ago} días`;
    }
    if (diffDays === 0) return 'expira hoy';
    if (diffDays === 1) return 'expira en 1 día';
    return `expira en ${diffDays} días`;
};

const invitationRoleLabel = (role: 'player' | 'co_captain'): string =>
    role === 'co_captain' ? 'Co-Capitán' : 'Jugador';

const invitationStatusLabel = (
    status: 'pending' | 'expired' | 'revoked' | 'accepted',
): string => {
    switch (status) {
        case 'pending':
            return 'Pendiente';
        case 'expired':
            return 'Expirada';
        case 'revoked':
            return 'Cancelada';
        default:
            return status;
    }
};

const POSITION_LABELS: Record<string, string> = {
    goalkeeper: '🧤 POR',
    defender: '🛡️ DEF',
    midfielder: '⚡ MED',
    forward: '⚽ DEL',
};

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

function StatTile({
    label,
    value,
    accent = false,
}: {
    label: string;
    value: string | number;
    accent?: boolean;
}) {
    return (
        <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3">
            <div
                className={cn(
                    'font-display text-2xl leading-none font-bold tabular-nums',
                    accent && 'text-primary',
                )}
            >
                {value}
            </div>
            <div className="mt-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </div>
        </div>
    );
}

interface Props {
    team: Team;
    isMember: boolean;
    canManage: boolean;
    statistics: TeamStatistics;
    pendingInvitations?: TeamInvitation[];
}

export default function Show({
    team,
    isMember,
    canManage,
    statistics,
    pendingInvitations = [],
}: Props) {
    const { flash, auth } = usePage<{
        flash: { success?: string; error?: string };
        auth: { user: { id: number } };
    }>().props;
    const isCaptain = team.team_members.some(
        (m) => m.user_id === auth.user.id && m.role === 'captain',
    );
    const isLeader = team.team_members.some(
        (m) =>
            m.user_id === auth.user.id &&
            (m.role === 'captain' || m.role === 'co_captain'),
    );
    const [showLeaveDialog, setShowLeaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [invitationToRevoke, setInvitationToRevoke] = useState<number | null>(
        null,
    );
    // Stable "now" reference captured once on mount for relative-time labels.
    const [nowMs] = useState(() => Date.now());

    const maxMembers = team.max_members ?? variantMaxMembers(team.variant);
    const currentMembers = team.team_members.length;
    const isFull = currentMembers >= maxMembers;
    const capacityPct =
        maxMembers > 0
            ? Math.min(100, Math.round((currentMembers / maxMembers) * 100))
            : 0;
    const capacityColor =
        capacityPct >= 100
            ? 'bg-destructive'
            : capacityPct >= 80
              ? 'bg-orange-500'
              : 'bg-primary';
    const winRate =
        statistics.matches_played > 0
            ? Math.round((statistics.wins / statistics.matches_played) * 100)
            : 0;
    const pendingCount =
        pendingInvitations.length + (team.pending_join_requests?.length ?? 0);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Equipos',
            href: teams.index().url,
        },
        {
            title: team.name,
            href: teams.show(team.id).url,
        },
    ];

    // Show flash messages
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleAcceptRequest = (requestId: number) => {
        router.post(
            joinRequests.accept(requestId).url,
            {},
            {
                onSuccess: () => {
                    toast.success('¡Solicitud de unión aceptada!', {
                        description: 'El jugador ha sido añadido a tu equipo.',
                    });
                },
                onError: () => {
                    toast.error('Error al aceptar la solicitud');
                },
            },
        );
    };

    const handleRejectRequest = (requestId: number) => {
        router.post(
            joinRequests.reject(requestId).url,
            {},
            {
                onSuccess: () => {
                    toast.success('Solicitud de unión rechazada');
                },
                onError: () => {
                    toast.error('Error al rechazar la solicitud');
                },
            },
        );
    };

    const handleCopyInvitationLink = (token: string) => {
        const url = `${window.location.origin}/teams/invite/${token}`;
        navigator.clipboard
            .writeText(url)
            .then(() => toast.success('Enlace copiado al portapapeles'))
            .catch(() => toast.error('No se pudo copiar el enlace'));
    };

    const handleRevokeInvitation = () => {
        if (invitationToRevoke === null) return;
        router.post(
            teamInvitations.revoke(invitationToRevoke).url,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    setInvitationToRevoke(null);
                    toast.success('Invitación cancelada');
                },
                onError: () => {
                    setInvitationToRevoke(null);
                    toast.error('Error al cancelar la invitación');
                },
            },
        );
    };

    const handleLeaveTeam = () => {
        router.post(
            teams.leave(team.id).url,
            {},
            {
                onSuccess: () => {
                    setShowLeaveDialog(false);
                    toast.success('Has abandonado el equipo exitosamente');
                },
                onError: (
                    errors:
                        | Record<string, string | string[]>
                        | { message?: string },
                ) => {
                    setShowLeaveDialog(false);
                    const errorMessage =
                        (errors as { message?: string })?.message ||
                        'Error al abandonar el equipo';
                    toast.error(errorMessage);
                },
            },
        );
    };

    const handleDeleteTeam = () => {
        router.delete(teams.destroy(team.id).url, {
            onSuccess: () => {
                setShowDeleteDialog(false);
                toast.success('¡Equipo eliminado exitosamente!');
            },
            onError: () => {
                setShowDeleteDialog(false);
                toast.error('Error al eliminar el equipo');
            },
        });
    };

    // Sort members: Captain first, then Co-Captains, then Players
    const sortedMembers = [...team.team_members].sort((a, b) => {
        const roleOrder = { captain: 0, co_captain: 1, player: 2 };
        return (
            roleOrder[a.role as keyof typeof roleOrder] -
            roleOrder[b.role as keyof typeof roleOrder]
        );
    });

    const hasStats = statistics.matches_played > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={team.name} />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 sm:p-6">
                {/* Hero header */}
                <div className="relative -mx-4 -mt-4 overflow-hidden px-4 pt-6 pb-2 sm:-mx-6 sm:-mt-6 sm:px-6 sm:pt-8">
                    <div
                        aria-hidden
                        className="bg-pitch-glow pointer-events-none absolute inset-0 -z-10"
                    />
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                            <TeamAvatar
                                name={team.name}
                                logoUrl={team.logo_url}
                                size="2xl"
                                className="ring-2 ring-primary/20"
                            />
                            <div className="min-w-0">
                                <p className="font-display text-xs font-bold tracking-[0.18em] text-primary uppercase">
                                    Equipo
                                </p>
                                <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                    {team.name}
                                </h1>
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                    <VariantBadge variant={team.variant} />
                                    <span>
                                        Desde{' '}
                                        {formatDate(team.created_at, {
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                            {isLeader && (
                                <InviteTeamMemberModal
                                    teamId={team.id}
                                    teamName={team.name}
                                />
                            )}
                            {isMember && canManage && (
                                <EditTeamModal
                                    team={team}
                                    canDelete={isCaptain}
                                    onRequestDelete={() =>
                                        setShowDeleteDialog(true)
                                    }
                                />
                            )}
                            {isMember && !isCaptain && (
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowLeaveDialog(true)}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Abandonar
                                </Button>
                            )}
                            {!isMember && !isFull && (
                                <JoinRequestDialog
                                    teamId={team.id}
                                    teamName={team.name}
                                />
                            )}
                            {!isMember && isFull && (
                                <Button disabled>
                                    <Users className="mr-2 h-4 w-4" />
                                    Equipo Completo
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stat tiles */}
                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3">
                            <div className="flex items-baseline justify-between">
                                <span className="font-display text-2xl leading-none font-bold tabular-nums">
                                    {currentMembers}
                                    <span className="text-muted-foreground">
                                        /{maxMembers}
                                    </span>
                                </span>
                            </div>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className={cn(
                                        'h-full rounded-full transition-all duration-500',
                                        capacityColor,
                                    )}
                                    style={{
                                        width: `${Math.max(capacityPct, 4)}%`,
                                    }}
                                />
                            </div>
                            <div className="mt-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                                Miembros
                            </div>
                        </div>
                        <StatTile
                            label="Partidos"
                            value={statistics.matches_played}
                        />
                        <StatTile
                            label="Victorias"
                            value={statistics.wins}
                            accent={hasStats && statistics.wins > 0}
                        />
                        <StatTile
                            label="% Éxito"
                            value={hasStats ? `${winRate}%` : '—'}
                            accent={hasStats && winRate >= 50}
                        />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="plantilla" className="gap-5">
                    <TabsList>
                        <TabsTrigger value="plantilla">
                            <Users className="h-4 w-4" />
                            Plantilla
                            <span className="ml-1 rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
                                {currentMembers}
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="stats">
                            <BarChart3 className="h-4 w-4" />
                            Estadísticas
                        </TabsTrigger>
                        {canManage && (
                            <TabsTrigger value="gestion">
                                <Inbox className="h-4 w-4" />
                                Gestión
                                {pendingCount > 0 && (
                                    <span className="ml-1 rounded-full bg-primary px-1.5 text-xs font-semibold text-primary-foreground">
                                        {pendingCount}
                                    </span>
                                )}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Plantilla */}
                    <TabsContent
                        value="plantilla"
                        className="space-y-6 focus-visible:outline-none"
                    >
                        {/* About */}
                        <section>
                            <h2 className="font-display text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                Acerca del equipo
                            </h2>
                            <p
                                className={cn(
                                    'mt-2 text-sm',
                                    team.description
                                        ? 'text-foreground/90'
                                        : 'text-muted-foreground italic',
                                )}
                            >
                                {team.description || 'Sin descripción'}
                            </p>
                        </section>

                        {/* Roster */}
                        <section>
                            <h2 className="font-display mb-3 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                Jugadores · {currentMembers}
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {sortedMembers.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/40"
                                    >
                                        <div className="flex min-w-0 flex-1 items-center gap-3">
                                            <UserAvatar
                                                name={member.user.name}
                                                avatarUrl={
                                                    member.user.avatar_url
                                                }
                                                size="md"
                                            />
                                            <div className="min-w-0 flex-1 space-y-1">
                                                <div className="truncate font-medium">
                                                    <UserNameLink
                                                        user={member.user}
                                                    />
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    <RoleBadge
                                                        role={member.role}
                                                    />
                                                    {member.position && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {POSITION_LABELS[
                                                                member.position
                                                            ] ??
                                                                member.position}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <MemberManagementDropdown
                                            member={member}
                                            teamId={team.id}
                                            isCaptain={isCaptain}
                                            isLeader={isLeader}
                                            currentUserId={auth.user.id}
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </TabsContent>

                    {/* Estadísticas */}
                    <TabsContent
                        value="stats"
                        className="focus-visible:outline-none"
                    >
                        {hasStats ? (
                            <div className="space-y-6">
                                {/* Record */}
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                                        <div className="font-display text-3xl font-bold text-primary tabular-nums">
                                            {statistics.wins}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            Victorias
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                                        <div className="font-display text-3xl font-bold tabular-nums">
                                            {statistics.draws}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            Empates
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                                        <div className="font-display text-3xl font-bold text-destructive tabular-nums">
                                            {statistics.losses}
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            Derrotas
                                        </div>
                                    </div>
                                </div>

                                {/* Goals + Cards */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Card>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div>
                                                <div className="text-sm text-muted-foreground">
                                                    Goles
                                                </div>
                                                <div className="mt-1 text-2xl font-semibold tabular-nums">
                                                    {statistics.goals_scored}
                                                    <span className="text-lg font-normal text-muted-foreground">
                                                        {' '}
                                                        /{' '}
                                                        {
                                                            statistics.goals_conceded
                                                        }
                                                    </span>
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    a favor / en contra
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">
                                                    Diferencia
                                                </div>
                                                <div
                                                    className={cn(
                                                        'mt-1 text-2xl font-bold tabular-nums',
                                                        statistics.goals_scored -
                                                            statistics.goals_conceded >
                                                            0
                                                            ? 'text-primary'
                                                            : statistics.goals_scored -
                                                                    statistics.goals_conceded <
                                                                0
                                                              ? 'text-destructive'
                                                              : '',
                                                    )}
                                                >
                                                    {statistics.goals_scored -
                                                        statistics.goals_conceded >
                                                    0
                                                        ? '+'
                                                        : ''}
                                                    {statistics.goals_scored -
                                                        statistics.goals_conceded}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="flex items-center justify-between p-4">
                                            <div className="text-sm text-muted-foreground">
                                                Tarjetas
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-5 w-3.5 rounded-sm bg-yellow-400" />
                                                    <span className="text-lg font-semibold tabular-nums">
                                                        {
                                                            statistics.yellow_cards
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className="h-5 w-3.5 rounded-sm bg-red-500" />
                                                    <span className="text-lg font-semibold tabular-nums">
                                                        {statistics.red_cards}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Top scorer */}
                                {statistics.top_scorer && (
                                    <Card>
                                        <CardContent className="flex items-center gap-3 p-4">
                                            <UserAvatar
                                                name={
                                                    statistics.top_scorer.user
                                                        .name
                                                }
                                                avatarUrl={
                                                    statistics.top_scorer.user
                                                        .avatar_url
                                                }
                                                size="md"
                                            />
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs tracking-wide text-muted-foreground uppercase">
                                                    Goleador
                                                </div>
                                                <div className="truncate font-medium">
                                                    <UserNameLink
                                                        user={
                                                            statistics
                                                                .top_scorer.user
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <Badge
                                                variant="secondary"
                                                className="gap-1"
                                            >
                                                <Star className="h-3 w-3" />
                                                {
                                                    statistics.top_scorer.goals
                                                }{' '}
                                                {statistics.top_scorer.goals ===
                                                1
                                                    ? 'gol'
                                                    : 'goles'}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Recent form */}
                                {statistics.recent_form.length > 0 && (
                                    <div>
                                        <div className="mb-2 text-sm text-muted-foreground">
                                            Últimos partidos
                                        </div>
                                        <div className="flex gap-1.5">
                                            {statistics.recent_form.map(
                                                (result, i) => (
                                                    <div
                                                        key={i}
                                                        className={cn(
                                                            'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white',
                                                            result === 'W'
                                                                ? 'bg-primary'
                                                                : result === 'D'
                                                                  ? 'bg-neutral-400'
                                                                  : 'bg-red-500',
                                                        )}
                                                        title={
                                                            result === 'W'
                                                                ? 'Victoria'
                                                                : result === 'D'
                                                                  ? 'Empate'
                                                                  : 'Derrota'
                                                        }
                                                    >
                                                        {result === 'W'
                                                            ? 'V'
                                                            : result === 'D'
                                                              ? 'E'
                                                              : 'D'}
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
                                <div className="rounded-full bg-muted p-4">
                                    <BarChart3 className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Aún no hay estadísticas
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Jugá tu primer partido para empezar a
                                        construir el historial del equipo.
                                    </p>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* Gestión */}
                    {canManage && (
                        <TabsContent
                            value="gestion"
                            className="space-y-6 focus-visible:outline-none"
                        >
                            {pendingCount === 0 && (
                                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
                                    <div className="rounded-full bg-muted p-4">
                                        <Inbox className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            Todo al día
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            No hay solicitudes ni invitaciones
                                            pendientes. Invitá jugadores desde
                                            el botón de arriba.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Join requests */}
                            {team.pending_join_requests?.length > 0 && (
                                <section>
                                    <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                        <UserPlus className="h-4 w-4" />
                                        Solicitudes de unión ·{' '}
                                        {team.pending_join_requests.length}
                                    </h2>
                                    <div className="space-y-3">
                                        {team.pending_join_requests.map(
                                            (request) => (
                                                <div
                                                    key={request.id}
                                                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                                                >
                                                    <UserAvatar
                                                        name={request.user.name}
                                                        avatarUrl={
                                                            request.user
                                                                .avatar_url
                                                        }
                                                        size="md"
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-medium">
                                                            {request.user.name}
                                                        </p>
                                                        {request.message && (
                                                            <p className="mt-1 text-sm text-muted-foreground">
                                                                {
                                                                    request.message
                                                                }
                                                            </p>
                                                        )}
                                                        <div className="mt-3 flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleAcceptRequest(
                                                                        request.id,
                                                                    )
                                                                }
                                                            >
                                                                Aceptar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleRejectRequest(
                                                                        request.id,
                                                                    )
                                                                }
                                                            >
                                                                Rechazar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Sent invitations */}
                            {pendingInvitations.length > 0 && (
                                <section>
                                    <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.14em] text-muted-foreground uppercase">
                                        <Mail className="h-4 w-4" />
                                        Invitaciones enviadas ·{' '}
                                        {pendingInvitations.length}
                                    </h2>
                                    <div className="space-y-3">
                                        {pendingInvitations.map(
                                            (invitation) => (
                                                <div
                                                    key={invitation.id}
                                                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
                                                >
                                                    <div className="min-w-0 flex-1 space-y-1">
                                                        <p className="truncate font-medium">
                                                            {invitation.email}
                                                        </p>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <Badge variant="outline">
                                                                {invitationRoleLabel(
                                                                    invitation.role,
                                                                )}
                                                            </Badge>
                                                            <Badge
                                                                variant={
                                                                    invitation.status ===
                                                                    'pending'
                                                                        ? 'default'
                                                                        : 'secondary'
                                                                }
                                                            >
                                                                {invitationStatusLabel(
                                                                    invitation.status,
                                                                )}
                                                            </Badge>
                                                            {invitation.status ===
                                                                'pending' && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatRelativeExpiry(
                                                                        invitation.expires_at,
                                                                        nowMs,
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {invitation.inviter && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Enviada por{' '}
                                                                {
                                                                    invitation
                                                                        .inviter
                                                                        .name
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    {invitation.status ===
                                                        'pending' && (
                                                        <div className="flex flex-shrink-0 gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() =>
                                                                    handleCopyInvitationLink(
                                                                        invitation.token,
                                                                    )
                                                                }
                                                            >
                                                                <Copy className="mr-1 h-4 w-4" />
                                                                Copiar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    setInvitationToRevoke(
                                                                        invitation.id,
                                                                    )
                                                                }
                                                            >
                                                                <X className="mr-1 h-4 w-4" />
                                                                Cancelar
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            ),
                                        )}
                                    </div>
                                </section>
                            )}

                            {/* Danger zone — captain only */}
                            {isCaptain && (
                                <section>
                                    <h2 className="font-display mb-3 flex items-center gap-2 text-sm font-bold tracking-[0.14em] text-destructive uppercase">
                                        <Trash2 className="h-4 w-4" />
                                        Zona de peligro
                                    </h2>
                                    <div className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                Eliminar equipo
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Esta acción es permanente y no
                                                se puede deshacer. Se eliminarán
                                                todos los miembros, solicitudes
                                                y partidos del equipo.
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            className="flex-shrink-0"
                                            onClick={() =>
                                                setShowDeleteDialog(true)
                                            }
                                        >
                                            <Trash2 className="mr-1 h-4 w-4" />
                                            Eliminar equipo
                                        </Button>
                                    </div>
                                </section>
                            )}
                        </TabsContent>
                    )}
                </Tabs>

                {/* Leave Team Confirmation Dialog */}
                <AlertDialog
                    open={showLeaveDialog}
                    onOpenChange={setShowLeaveDialog}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Abandonar Equipo
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estás seguro de que quieres abandonar{' '}
                                <span className="font-semibold">
                                    {team.name}
                                </span>
                                ? Necesitarás solicitar unirte nuevamente si
                                cambias de opinión.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleLeaveTeam}
                                className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                            >
                                Abandonar Equipo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Team Confirmation Dialog */}
                <AlertDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Eliminar Equipo</AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estás seguro de que quieres eliminar{' '}
                                <span className="font-semibold">
                                    {team.name}
                                </span>
                                ? Esta acción es permanente y no se puede
                                deshacer. Se eliminarán todos los miembros,
                                solicitudes y partidos del equipo.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteTeam}
                                className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                            >
                                Eliminar Equipo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Revoke Invitation Confirmation Dialog */}
                <AlertDialog
                    open={invitationToRevoke !== null}
                    onOpenChange={(open) => {
                        if (!open) setInvitationToRevoke(null);
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Cancelar Invitación
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                ¿Estás seguro de que quieres cancelar esta
                                invitación? El enlace dejará de funcionar y
                                deberás enviar una nueva invitación.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Volver</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleRevokeInvitation}
                                className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                            >
                                Cancelar Invitación
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
