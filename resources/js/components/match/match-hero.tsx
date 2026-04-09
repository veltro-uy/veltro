import { CreateMatchRequestDialog } from '@/components/create-match-request-dialog';
import { GoalScorersList } from '@/components/goal-scorers-list';
import type {
    LineupPlayer,
    MatchEvent,
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
import matches from '@/routes/matches';
import { Link } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Edit,
    MapPin,
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
    events: MatchEvent[];
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
    events,
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

    return (
        <>
            <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background via-background to-muted/20 p-6 md:p-8">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

                <div className="relative">
                    {/* Status badges */}
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        <Badge className={getMatchStatusColor(match.status)}>
                            {getMatchStatusText(match.status)}
                        </Badge>
                        <VariantBadge variant={match.variant} />
                        <Badge variant="outline">
                            {match.match_type === 'friendly'
                                ? 'Amistoso'
                                : 'Competitivo'}
                        </Badge>
                    </div>

                    {/* Matchup */}
                    <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr,auto,1fr]">
                        {/* Home team */}
                        <div className="flex flex-col items-center md:items-end">
                            <Link
                                href={`/teams/${match.home_team.id}`}
                                className="group flex flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-muted/50 md:flex-row md:justify-end"
                            >
                                <TeamAvatar
                                    name={match.home_team.name}
                                    logoUrl={match.home_team.logo_url}
                                    size="lg"
                                    className="h-20 w-20"
                                />
                                <div className="text-center md:text-right">
                                    <h2 className="text-2xl font-bold">
                                        {match.home_team.name}
                                    </h2>
                                    <div className="mt-1 flex items-center justify-center gap-1 md:justify-end">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">
                                            Local
                                        </p>
                                    </div>
                                </div>
                            </Link>
                            {(match.status === 'in_progress' ||
                                match.status === 'completed') && (
                                <GoalScorersList
                                    events={events}
                                    teamId={match.home_team.id}
                                    isLeader={isHomeLeader}
                                    alignment="right"
                                    matchStatus={match.status}
                                    onRecordGoal={() =>
                                        setRecordGoalDialog({
                                            open: true,
                                            team: 'home',
                                        })
                                    }
                                />
                            )}
                        </div>

                        {/* Score / countdown / placeholder */}
                        <div className="flex flex-col items-center justify-center gap-3">
                            {showScore ? (
                                <>
                                    {!matchHasStarted &&
                                        countdown &&
                                        match.status !== 'completed' && (
                                            <div className="flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-xs backdrop-blur-sm">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span className="font-medium">
                                                    {countdown}
                                                </span>
                                            </div>
                                        )}

                                    <div className="rounded-xl border bg-card/80 px-4 py-3 shadow-lg backdrop-blur-sm md:px-6">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div className="flex items-center gap-2">
                                                {isHomeLeader &&
                                                    match.status !==
                                                        'completed' &&
                                                    matchHasStarted && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-full"
                                                            onClick={() =>
                                                                setRecordGoalDialog(
                                                                    {
                                                                        open: true,
                                                                        team: 'home',
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-lg text-3xl font-bold md:h-14 md:w-14 ${
                                                        match.status ===
                                                            'completed' &&
                                                        homeScore > awayScore
                                                            ? 'text-primary'
                                                            : ''
                                                    }`}
                                                >
                                                    {homeScore}
                                                </div>
                                            </div>

                                            <span className="text-xl font-bold text-muted-foreground md:text-2xl">
                                                -
                                            </span>

                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`flex h-12 w-12 items-center justify-center rounded-lg text-3xl font-bold md:h-14 md:w-14 ${
                                                        match.status ===
                                                            'completed' &&
                                                        awayScore > homeScore
                                                            ? 'text-primary'
                                                            : ''
                                                    }`}
                                                >
                                                    {awayScore}
                                                </div>
                                                {isAwayLeader &&
                                                    match.status !==
                                                        'completed' &&
                                                    matchHasStarted && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-full"
                                                            onClick={() =>
                                                                setRecordGoalDialog(
                                                                    {
                                                                        open: true,
                                                                        team: 'away',
                                                                    },
                                                                )
                                                            }
                                                        >
                                                            <Plus className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="rounded-full border bg-card p-4 shadow-sm">
                                    <Swords className="h-8 w-8 text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {/* Away team */}
                        <div className="flex flex-col items-center md:items-start">
                            {match.away_team ? (
                                <Link
                                    href={`/teams/${match.away_team.id}`}
                                    className="group flex flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-muted/50 md:flex-row"
                                >
                                    <TeamAvatar
                                        name={match.away_team.name}
                                        logoUrl={match.away_team.logo_url}
                                        size="lg"
                                        className="h-20 w-20"
                                    />
                                    <div className="text-center md:text-left">
                                        <h2 className="text-2xl font-bold">
                                            {match.away_team.name}
                                        </h2>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Visitante
                                        </p>
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed bg-muted/30 p-6 md:flex-row">
                                    <div className="rounded-full bg-muted p-4">
                                        <Users className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div className="text-center md:text-left">
                                        <h3 className="text-lg font-semibold">
                                            Buscando Rival
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Esperando solicitudes de equipos
                                        </p>
                                    </div>
                                </div>
                            )}
                            {(match.status === 'in_progress' ||
                                match.status === 'completed') &&
                                match.away_team && (
                                    <GoalScorersList
                                        events={events}
                                        teamId={match.away_team.id}
                                        isLeader={isAwayLeader}
                                        alignment="left"
                                        matchStatus={match.status}
                                        onRecordGoal={() =>
                                            setRecordGoalDialog({
                                                open: true,
                                                team: 'away',
                                            })
                                        }
                                    />
                                )}
                        </div>
                    </div>

                    {/* Match info row */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
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
                                {match.location}
                            </span>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
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
