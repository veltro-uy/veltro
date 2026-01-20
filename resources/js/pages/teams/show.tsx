import { InviteTeamMemberModal } from '@/components/invite-team-member-modal';
import { JoinRequestDialog } from '@/components/join-request-dialog';
import { MemberManagementDropdown } from '@/components/member-management-dropdown';
import { TeamAvatar } from '@/components/team-avatar';
import { UserNameLink } from '@/components/user-name-link';
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
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { VariantBadge } from '@/components/variant-badge';
import AppLayout from '@/layouts/app-layout';
import joinRequests from '@/routes/join-requests';
import teams from '@/routes/teams';
import type { BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Edit, LogOut, Shield, Star, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface TeamMember {
    id: number;
    user_id: number;
    team_id: number;
    role: string;
    position?: string | null;
    status: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
}

interface JoinRequest {
    id: number;
    user_id: number;
    team_id: number;
    status: string;
    message?: string;
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
    pending_join_requests: JoinRequest[];
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

interface Props {
    team: Team;
    isMember: boolean;
    canManage: boolean;
}

export default function Show({ team, isMember, canManage }: Props) {
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

    const maxMembers =
        team.max_members ?? getMaxMembersForVariant(team.variant);
    const currentMembers = team.team_members.length;
    const isFull = currentMembers >= maxMembers;
    const capacityColor = getCapacityColor(currentMembers, maxMembers);

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

    // Sort members: Captain first, then Co-Captains, then Players
    const sortedMembers = [...team.team_members].sort((a, b) => {
        const roleOrder = { captain: 0, co_captain: 1, player: 2 };
        return (
            roleOrder[a.role as keyof typeof roleOrder] -
            roleOrder[b.role as keyof typeof roleOrder]
        );
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={team.name} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-4">
                        <TeamAvatar
                            name={team.name}
                            logoUrl={team.logo_url}
                            size="xl"
                        />
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {team.name}
                            </h1>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <VariantBadge variant={team.variant} />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {isLeader && (
                            <InviteTeamMemberModal
                                teamId={team.id}
                                teamName={team.name}
                            />
                        )}
                        {isMember && canManage && (
                            <Button asChild>
                                <Link href={teams.edit(team.id).url}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Editar Equipo
                                </Link>
                            </Button>
                        )}
                        {isMember && !isCaptain && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowLeaveDialog(true)}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Abandonar Equipo
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

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Sidebar - Team Members */}
                    <div className="space-y-6 lg:order-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        Plantilla del Equipo
                                    </div>
                                </CardTitle>
                                <CardDescription>
                                    <div className="flex items-center gap-2">
                                        <span className={capacityColor}>
                                            {currentMembers}/{maxMembers}{' '}
                                            miembros
                                        </span>
                                        {isFull && (
                                            <span className="text-xs font-medium text-destructive">
                                                (Completo)
                                            </span>
                                        )}
                                    </div>
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* All Members List */}
                                <div className="space-y-2">
                                    {sortedMembers.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                <UserAvatar
                                                    name={member.user.name}
                                                    size="md"
                                                />
                                                <div className="min-w-0 flex-1 space-y-1">
                                                    <div className="truncate font-medium">
                                                        <UserNameLink
                                                            user={member.user}
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap gap-1">
                                                        <Badge
                                                            variant={
                                                                member.role ===
                                                                'captain'
                                                                    ? 'default'
                                                                    : member.role ===
                                                                        'co_captain'
                                                                      ? 'secondary'
                                                                      : 'outline'
                                                            }
                                                            className="flex items-center gap-1"
                                                        >
                                                            {member.role ===
                                                            'captain' ? (
                                                                <>
                                                                    <Star className="h-3 w-3" />
                                                                    <span>
                                                                        Capitán
                                                                    </span>
                                                                </>
                                                            ) : member.role ===
                                                              'co_captain' ? (
                                                                <>
                                                                    <Shield className="h-3 w-3" />
                                                                    <span>
                                                                        Vice-Capitán
                                                                    </span>
                                                                </>
                                                            ) : (
                                                                <span>
                                                                    Jugador
                                                                </span>
                                                            )}
                                                        </Badge>
                                                        {member.position && (
                                                            <Badge
                                                                variant="outline"
                                                                className="text-xs"
                                                            >
                                                                {member.position ===
                                                                'goalkeeper'
                                                                    ? '🧤 POR'
                                                                    : member.position ===
                                                                        'defender'
                                                                      ? '🛡️ DEF'
                                                                      : member.position ===
                                                                          'midfielder'
                                                                        ? '⚡ MED'
                                                                        : member.position ===
                                                                            'forward'
                                                                          ? '⚽ DEL'
                                                                          : member.position}
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
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content */}
                    <div className="space-y-6 lg:order-1 lg:col-span-2">
                        {/* Team Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Acerca del Equipo</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {team.description ? (
                                    <p className="text-sm text-muted-foreground">
                                        {team.description}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                        Sin descripción
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Join Requests (only for captains/co-captains) */}
                        {canManage &&
                            team.pending_join_requests?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Solicitudes de Unión Pendientes
                                        </CardTitle>
                                        <CardDescription>
                                            Revisa y responde a las solicitudes
                                            de unión
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {team.pending_join_requests.map(
                                                (request) => (
                                                    <div
                                                        key={request.id}
                                                        className="flex items-start gap-3 rounded-lg border bg-card p-4"
                                                    >
                                                        <UserAvatar
                                                            name={
                                                                request.user
                                                                    .name
                                                            }
                                                            size="md"
                                                        />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-medium">
                                                                {
                                                                    request.user
                                                                        .name
                                                                }
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
                                    </CardContent>
                                </Card>
                            )}
                    </div>
                </div>

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
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Abandonar Equipo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
}
