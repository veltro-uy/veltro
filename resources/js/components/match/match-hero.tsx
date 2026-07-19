import { CreateMatchRequestDialog } from '@/components/create-match-request-dialog';
import type {
    LineupPlayer,
    MatchPageMatch,
    MatchPageTeam,
} from '@/components/match/types';
import { RecordGoalDialog } from '@/components/record-goal-dialog';
import { TeamAvatar } from '@/components/team-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { VariantBadge } from '@/components/variant-badge';
import { useMatchCountdown } from '@/hooks/use-match-countdown';
import {
    formatMatchDate,
    formatMatchTime,
    getMatchStatusColor,
    getMatchStatusText,
} from '@/lib/match-format';
import { cn } from '@/lib/utils';
import matches from '@/routes/matches';
import { Link } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Edit,
    MapPin,
    Plane,
    Plus,
    Shield,
    Swords,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

interface MatchHeroProps {
    match: MatchPageMatch;
    isHomeLeader: boolean;
    isAwayLeader: boolean;
    isLeader: boolean;
    eligibleTeams: MatchPageTeam[];
    homeLineup: LineupPlayer[];
    awayLineup: LineupPlayer[];
    onCancelClick: () => void;
    onCompleteClick: () => void;
}

export function MatchHero({
    match,
    isHomeLeader,
    isAwayLeader,
    isLeader,
    eligibleTeams,
    homeLineup,
    awayLineup,
    onCancelClick,
    onCompleteClick,
}: MatchHeroProps) {
    const { countdown, hasStarted: matchHasStarted } = useMatchCountdown(
        match.scheduled_at,
    );
    const [recordGoalDialog, setRecordGoalDialog] = useState<{
        open: boolean;
        team: 'home' | 'away' | null;
    }>({ open: false, team: null });

    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;

    const showScore =
        match.status === 'confirmed' ||
        match.status === 'in_progress' ||
        match.status === 'completed';

    const canRecord = (leader: boolean) =>
        leader && match.status !== 'completed' && matchHasStarted;

    return (
        <>
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-background via-background to-muted/20 p-5 md:p-8">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-56 w-56 rounded-full bg-primary/5 blur-3xl" />

                <div className="relative space-y-6">
                    {/* Status badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <Badge className={getMatchStatusColor(match.status)}>
                            {getMatchStatusText(match.status)}
                        </Badge>
                        <VariantBadge variant={match.variant} />
                    </div>

                    {/* Scoreboard — broadcast style: teams flank the score across the full width */}
                    <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-8">
                        {/* Home team (local) — left edge */}
                        <Link
                            href={`/teams/${match.home_team.id}`}
                            className="group flex items-center justify-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50 md:justify-start md:gap-4"
                        >
                            <TeamAvatar
                                name={match.home_team.name}
                                logoUrl={match.home_team.logo_url}
                                size="xl"
                                className="h-16 w-16 shrink-0 md:h-20 md:w-20"
                            />
                            <div className="min-w-0 text-center md:text-left">
                                <h2 className="truncate text-xl font-bold md:text-2xl">
                                    {match.home_team.name}
                                </h2>
                                <div className="flex items-center justify-center gap-1 text-muted-foreground md:justify-start">
                                    <Shield className="h-3.5 w-3.5" />
                                    <p className="text-xs md:text-sm">Local</p>
                                </div>
                            </div>
                        </Link>

                        {/* Score / countdown / placeholder — center */}
                        <div className="flex flex-col items-center gap-2">
                            {showScore ? (
                                <>
                                    {!matchHasStarted &&
                                        countdown &&
                                        match.status !== 'completed' && (
                                            <div className="flex items-center gap-1.5 rounded-full border bg-card/80 px-2.5 py-0.5 text-xs backdrop-blur-sm">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {countdown}
                                                </span>
                                            </div>
                                        )}

                                    <div className="flex items-center gap-2 rounded-2xl border bg-card/80 px-4 py-2.5 shadow-sm backdrop-blur-sm md:gap-3 md:px-6">
                                        {canRecord(isHomeLeader) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full"
                                                aria-label="Registrar gol local"
                                                onClick={() =>
                                                    setRecordGoalDialog({
                                                        open: true,
                                                        team: 'home',
                                                    })
                                                }
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                        <span
                                            className={cn(
                                                'w-10 text-center text-4xl font-bold tabular-nums md:w-12 md:text-5xl',
                                                match.status === 'completed' &&
                                                    homeScore > awayScore &&
                                                    'text-primary',
                                            )}
                                        >
                                            {homeScore}
                                        </span>
                                        <span className="text-xl font-bold text-muted-foreground md:text-2xl">
                                            -
                                        </span>
                                        <span
                                            className={cn(
                                                'w-10 text-center text-4xl font-bold tabular-nums md:w-12 md:text-5xl',
                                                match.status === 'completed' &&
                                                    awayScore > homeScore &&
                                                    'text-primary',
                                            )}
                                        >
                                            {awayScore}
                                        </span>
                                        {canRecord(isAwayLeader) && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-full"
                                                aria-label="Registrar gol visitante"
                                                onClick={() =>
                                                    setRecordGoalDialog({
                                                        open: true,
                                                        team: 'away',
                                                    })
                                                }
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-full border bg-card p-4 shadow-sm">
                                    <Swords className="h-7 w-7 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Away team (visitante) — right edge */}
                        {match.away_team ? (
                            <Link
                                href={`/teams/${match.away_team.id}`}
                                className="group flex items-center justify-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50 md:justify-end md:gap-4"
                            >
                                <div className="min-w-0 text-center md:text-right">
                                    <h2 className="truncate text-xl font-bold md:text-2xl">
                                        {match.away_team.name}
                                    </h2>
                                    <div className="flex items-center justify-center gap-1 text-muted-foreground md:justify-end">
                                        <Plane className="h-3.5 w-3.5" />
                                        <p className="text-xs md:text-sm">
                                            Visitante
                                        </p>
                                    </div>
                                </div>
                                <TeamAvatar
                                    name={match.away_team.name}
                                    logoUrl={match.away_team.logo_url}
                                    size="xl"
                                    className="h-16 w-16 shrink-0 md:h-20 md:w-20"
                                />
                            </Link>
                        ) : (
                            <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-3 md:justify-end md:gap-4">
                                <div className="min-w-0 text-center md:text-right">
                                    <h3 className="truncate text-base font-semibold">
                                        Buscando rival
                                    </h3>
                                    <p className="truncate text-xs text-muted-foreground">
                                        Esperando solicitudes
                                    </p>
                                </div>
                                <div className="rounded-full bg-muted p-3">
                                    <Users className="h-7 w-7 text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Match info row */}
                    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t pt-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                                {formatMatchDate(match.scheduled_at)}
                            </span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                                {formatMatchTime(match.scheduled_at)}
                            </span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                                {match.location ?? 'Por definir'}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    {(isHomeLeader && match.status === 'available') ||
                    (isLeader && match.status === 'in_progress') ||
                    (!isLeader &&
                        match.status === 'available' &&
                        eligibleTeams.length > 0) ? (
                        <div className="flex flex-wrap justify-center gap-3">
                            {isHomeLeader && match.status === 'available' && (
                                <>
                                    <Button asChild variant="outline">
                                        <Link href={matches.edit(match.id).url}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Editar
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={onCancelClick}
                                    >
                                        <X className="mr-2 h-4 w-4" />
                                        Cancelar Partido
                                    </Button>
                                </>
                            )}
                            {isLeader && match.status === 'in_progress' && (
                                <Button
                                    onClick={onCompleteClick}
                                    disabled={!matchHasStarted}
                                    title={
                                        !matchHasStarted
                                            ? 'No se puede completar el partido antes de que comience'
                                            : ''
                                    }
                                >
                                    <Trophy className="mr-2 h-4 w-4" />
                                    Completar Partido
                                </Button>
                            )}
                            {!isLeader &&
                                match.status === 'available' &&
                                eligibleTeams.length > 0 && (
                                    <CreateMatchRequestDialog
                                        matchId={match.id}
                                        eligibleTeams={eligibleTeams}
                                    />
                                )}
                        </div>
                    ) : null}

                    {!isLeader &&
                        match.tournament_id != null &&
                        (match.status === 'confirmed' ||
                            match.status === 'in_progress' ||
                            match.status === 'completed') && (
                            <p className="text-center text-sm text-muted-foreground">
                                Solo el organizador del torneo puede gestionar
                                el resultado de este partido.
                            </p>
                        )}
                </div>
            </div>

            <RecordGoalDialog
                matchId={match.id}
                teamId={
                    recordGoalDialog.team === 'home'
                        ? match.home_team.id
                        : (match.away_team?.id ?? 0)
                }
                teamName={
                    recordGoalDialog.team === 'home'
                        ? match.home_team.name
                        : (match.away_team?.name ?? '')
                }
                availablePlayers={
                    recordGoalDialog.team === 'home' ? homeLineup : awayLineup
                }
                open={recordGoalDialog.open}
                onOpenChange={(open) =>
                    setRecordGoalDialog((prev) => ({ ...prev, open }))
                }
            />
        </>
    );
}
