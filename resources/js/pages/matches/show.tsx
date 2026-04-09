import { AvailabilityPanel } from '@/components/availability-panel';
import { AvailabilitySelector } from '@/components/availability-selector';
import { CompleteMatchDialog } from '@/components/match/complete-match-dialog';
import { MatchHero } from '@/components/match/match-hero';
import { MatchRequestsCard } from '@/components/match/match-requests-card';
import { OpposingLeadersCard } from '@/components/match/opposing-leaders-card';
import type {
    LineupPlayer,
    MatchEvent,
    MatchPageMatch,
    MatchPageTeam,
    OpposingTeamLeader,
} from '@/components/match/types';
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
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import matchRequests from '@/routes/match-requests';
import matches from '@/routes/matches';
import type {
    AvailabilityStats,
    BreadcrumbItem,
    MatchAvailability,
} from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    match: MatchPageMatch;
    isHomeLeader: boolean;
    isAwayLeader: boolean;
    isLeader: boolean;
    eligibleTeams: MatchPageTeam[];
    homeLineup: LineupPlayer[];
    awayLineup: LineupPlayer[];
    events: MatchEvent[];
    opposingTeamLeaders?: OpposingTeamLeader[];
    homeAvailability: MatchAvailability[];
    awayAvailability: MatchAvailability[];
    userAvailability: MatchAvailability | null;
    userTeamId: number | null;
    homeAvailabilityStats: AvailabilityStats;
    awayAvailabilityStats: AvailabilityStats | null;
}

export default function Show({
    match,
    isHomeLeader,
    isAwayLeader,
    isLeader,
    eligibleTeams,
    homeLineup,
    awayLineup,
    events,
    opposingTeamLeaders = [],
    homeAvailability,
    awayAvailability,
    userAvailability,
    userTeamId,
    homeAvailabilityStats,
    awayAvailabilityStats,
}: Props) {
    const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
        .props;
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Partidos',
            href: matches.index().url,
        },
        {
            title: `${match.home_team.name}${match.away_team ? ` vs ${match.away_team.name}` : ''}`,
            href: matches.show(match.id).url,
        },
    ];

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
            matchRequests.accept(requestId).url,
            {},
            {
                onSuccess: () => {
                    toast.success(
                        '¡Solicitud de partido aceptada! El partido está confirmado.',
                    );
                },
                onError: () => {
                    toast.error('Error al aceptar la solicitud');
                },
            },
        );
    };

    const handleRejectRequest = (requestId: number) => {
        router.post(
            matchRequests.reject(requestId).url,
            {},
            {
                onSuccess: () => {
                    toast.success('Solicitud de partido rechazada');
                },
                onError: () => {
                    toast.error('Error al rechazar la solicitud');
                },
            },
        );
    };

    const handleCancelMatch = () => {
        router.post(
            matches.cancel(match.id).url,
            {},
            {
                onSuccess: () => {
                    setShowCancelDialog(false);
                    toast.success('Partido cancelado exitosamente');
                },
                onError: () => {
                    setShowCancelDialog(false);
                    toast.error('Error al cancelar el partido');
                },
            },
        );
    };

    const handleCompleteMatch = () => {
        router.post(
            matches.complete(match.id).url,
            {},
            {
                onSuccess: () => {
                    setShowCompleteDialog(false);
                    toast.success('¡Partido completado exitosamente!');
                },
                onError: () => {
                    setShowCompleteDialog(false);
                    toast.error('Error al completar el partido');
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={`${match.home_team.name}${match.away_team ? ` vs ${match.away_team.name}` : ''}`}
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4 md:p-6">
                <MatchHero
                    match={match}
                    isHomeLeader={isHomeLeader}
                    isAwayLeader={isAwayLeader}
                    isLeader={isLeader}
                    eligibleTeams={eligibleTeams}
                    homeLineup={homeLineup}
                    awayLineup={awayLineup}
                    events={events}
                    onCancelClick={() => setShowCancelDialog(true)}
                    onCompleteClick={() => setShowCompleteDialog(true)}
                />

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main column */}
                    <div className="space-y-6 lg:col-span-2">
                        {isHomeLeader &&
                            match.status === 'available' &&
                            match.match_requests &&
                            match.match_requests.length > 0 && (
                                <MatchRequestsCard
                                    requests={match.match_requests}
                                    onAccept={handleAcceptRequest}
                                    onReject={handleRejectRequest}
                                />
                            )}

                        {isLeader &&
                            (match.status === 'confirmed' ||
                                match.status === 'in_progress' ||
                                match.status === 'completed') &&
                            opposingTeamLeaders.length > 0 && (
                                <OpposingLeadersCard
                                    leaders={opposingTeamLeaders}
                                />
                            )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {(match.status === 'confirmed' ||
                            match.status === 'available') &&
                            userTeamId && (
                                <AvailabilitySelector
                                    matchId={match.id}
                                    currentStatus={
                                        userAvailability ?? undefined
                                    }
                                />
                            )}

                        {(match.status === 'confirmed' ||
                            match.status === 'available') &&
                            homeAvailabilityStats && (
                                <AvailabilityPanel
                                    homeTeam={{
                                        team: match.home_team,
                                        stats: homeAvailabilityStats,
                                        availability: homeAvailability,
                                        isLeader: isHomeLeader,
                                    }}
                                    awayTeam={
                                        match.away_team && awayAvailabilityStats
                                            ? {
                                                  team: match.away_team,
                                                  stats: awayAvailabilityStats,
                                                  availability:
                                                      awayAvailability,
                                                  isLeader: isAwayLeader,
                                              }
                                            : undefined
                                    }
                                />
                            )}

                        {isLeader &&
                            (match.status === 'confirmed' ||
                                match.status === 'in_progress') && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>
                                            Gestión de Alineación
                                        </CardTitle>
                                        <CardDescription>
                                            Selecciona los jugadores para el
                                            partido
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button asChild className="w-full">
                                            <Link
                                                href={
                                                    matches.lineup.edit(
                                                        match.id,
                                                    ).url
                                                }
                                            >
                                                <Users className="mr-2 h-4 w-4" />
                                                Gestionar Alineación
                                            </Link>
                                        </Button>
                                        {(homeLineup.length > 0 ||
                                            awayLineup.length > 0) && (
                                            <div className="space-y-1 rounded-lg border bg-muted/50 p-3">
                                                {homeLineup.length > 0 && (
                                                    <p className="text-sm">
                                                        <span className="font-medium">
                                                            {
                                                                match.home_team
                                                                    .name
                                                            }
                                                            :
                                                        </span>{' '}
                                                        <span className="text-muted-foreground">
                                                            {homeLineup.length}{' '}
                                                            jugadores
                                                        </span>
                                                    </p>
                                                )}
                                                {awayLineup.length > 0 &&
                                                    match.away_team && (
                                                        <p className="text-sm">
                                                            <span className="font-medium">
                                                                {
                                                                    match
                                                                        .away_team
                                                                        .name
                                                                }
                                                                :
                                                            </span>{' '}
                                                            <span className="text-muted-foreground">
                                                                {
                                                                    awayLineup.length
                                                                }{' '}
                                                                jugadores
                                                            </span>
                                                        </p>
                                                    )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                    </div>
                </div>
            </div>

            <AlertDialog
                open={showCancelDialog}
                onOpenChange={setShowCancelDialog}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar Partido</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres cancelar este partido?
                            Esta acción no se puede deshacer y todas las
                            solicitudes pendientes serán eliminadas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleCancelMatch}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Cancelar Partido
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <CompleteMatchDialog
                open={showCompleteDialog}
                onOpenChange={setShowCompleteDialog}
                match={match}
                events={events}
                onConfirm={handleCompleteMatch}
            />
        </AppLayout>
    );
}
