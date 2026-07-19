import { CreateMatchRequestDialog } from '@/components/create-match-request-dialog';
import type {
    LineupPlayer,
    MatchEvent,
    MatchPageMatch,
    MatchPageTeam,
} from '@/components/match/types';
import { RecordGoalDialog } from '@/components/record-goal-dialog';
import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import { VariantBadge } from '@/components/variant-badge';
import { useMatchCountdown } from '@/hooks/use-match-countdown';
import {
    formatMatchDate,
    formatMatchTime,
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
    Target,
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

interface ScorerSummary {
    name: string;
    minutes: number[];
}

/** Groups a team's goals by scorer, preserving first-goal order, e.g. `Mbappé 48', 66'`. */
function groupScorers(events: MatchEvent[], teamId: number): ScorerSummary[] {
    const goals = events
        .filter(
            (e) =>
                Number(e.team_id) === Number(teamId) && e.event_type === 'goal',
        )
        .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));

    const order: string[] = [];
    const byName = new Map<string, number[]>();
    for (const goal of goals) {
        const name = goal.user?.name ?? 'Sin asignar';
        if (!byName.has(name)) {
            byName.set(name, []);
            order.push(name);
        }
        if (goal.minute != null) byName.get(name)!.push(goal.minute);
    }
    return order.map((name) => ({ name, minutes: byName.get(name)! }));
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

    const showScorers =
        match.status === 'in_progress' || match.status === 'completed';

    const canRecord = (leader: boolean) =>
        leader && match.status !== 'completed' && matchHasStarted;

    const homeScorers = showScorers
        ? groupScorers(events, match.home_team.id)
        : [];
    const awayScorers =
        showScorers && match.away_team
            ? groupScorers(events, match.away_team.id)
            : [];
    const hasScorers = homeScorers.length > 0 || awayScorers.length > 0;

    const statusLabel =
        match.status === 'completed'
            ? 'Finalizado'
            : match.status === 'in_progress'
              ? 'En vivo'
              : !matchHasStarted && countdown
                ? countdown
                : getMatchStatusText(match.status);

    return (
        <>
            <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-5 md:p-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -top-24 -left-16 h-64 w-64 rounded-full bg-primary/15 blur-3xl"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl"
                />

                <div className="relative space-y-5">
                    {/* Competition + variant */}
                    <div className="flex flex-col items-center gap-2 text-center">
                        <div className="flex items-center gap-2">
                            {match.tournament ? (
                                <span className="flex items-center gap-1.5 text-sm font-semibold">
                                    <Trophy className="h-4 w-4 text-primary" />
                                    {match.tournament.name}
                                </span>
                            ) : (
                                <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                                    <Swords className="h-4 w-4" />
                                    Amistoso
                                </span>
                            )}
                            <VariantBadge variant={match.variant} />
                        </div>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatMatchDate(match.scheduled_at)}
                            </span>
                            <span aria-hidden>·</span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5" />
                                {formatMatchTime(match.scheduled_at)}
                            </span>
                            <span aria-hidden>·</span>
                            <span className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5" />
                                {match.location ?? 'Por definir'}
                            </span>
                        </div>
                    </div>

                    {/* Scoreboard + scorers */}
                    <div className="mx-auto w-full max-w-4xl space-y-4 border-t pt-5">
                        <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-6">
                            {/* Home team (local) — name outer, crest inner */}
                            <Link
                                href={`/teams/${match.home_team.public_id}`}
                                className="group flex items-center justify-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50 md:justify-end md:gap-4"
                            >
                                <div className="min-w-0 text-center md:text-right">
                                    <h2 className="truncate text-xl font-bold md:text-2xl">
                                        {match.home_team.name}
                                    </h2>
                                    <div className="flex items-center justify-center gap-1 text-muted-foreground md:justify-end">
                                        <Shield className="h-3.5 w-3.5" />
                                        <p className="text-xs md:text-sm">
                                            Local
                                        </p>
                                    </div>
                                </div>
                                <TeamAvatar
                                    name={match.home_team.name}
                                    logoUrl={match.home_team.logo_url}
                                    size="xl"
                                    className="h-14 w-14 shrink-0 md:h-16 md:w-16"
                                />
                            </Link>

                            {/* Score / countdown / placeholder */}
                            <div className="flex flex-col items-center gap-1.5">
                                {showScore ? (
                                    <>
                                        <div className="flex items-center gap-2 md:gap-3">
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
                                                    match.status ===
                                                        'completed' &&
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
                                                    match.status ===
                                                        'completed' &&
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
                                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                            {match.status === 'in_progress' && (
                                                <span className="relative flex h-2 w-2">
                                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                                                </span>
                                            )}
                                            {statusLabel}
                                        </span>
                                    </>
                                ) : (
                                    <>
                                        <div className="rounded-full border bg-card p-4 shadow-sm">
                                            <Swords className="h-7 w-7 text-muted-foreground" />
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {statusLabel}
                                        </span>
                                    </>
                                )}
                            </div>

                            {/* Away team (visitante) — crest inner, name outer */}
                            {match.away_team ? (
                                <Link
                                    href={`/teams/${match.away_team.public_id}`}
                                    className="group flex items-center justify-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted/50 md:justify-start md:gap-4"
                                >
                                    <TeamAvatar
                                        name={match.away_team.name}
                                        logoUrl={match.away_team.logo_url}
                                        size="xl"
                                        className="h-14 w-14 shrink-0 md:h-16 md:w-16"
                                    />
                                    <div className="min-w-0 text-center md:text-left">
                                        <h2 className="truncate text-xl font-bold md:text-2xl">
                                            {match.away_team.name}
                                        </h2>
                                        <div className="flex items-center justify-center gap-1 text-muted-foreground md:justify-start">
                                            <Plane className="h-3.5 w-3.5" />
                                            <p className="text-xs md:text-sm">
                                                Visitante
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-3 md:justify-start md:gap-4">
                                    <div className="rounded-full bg-muted p-3">
                                        <Users className="h-7 w-7 text-muted-foreground" />
                                    </div>
                                    <div className="min-w-0 text-center md:text-left">
                                        <h3 className="truncate text-base font-semibold">
                                            Buscando rival
                                        </h3>
                                        <p className="truncate text-xs text-muted-foreground">
                                            Esperando solicitudes
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Scorers grouped by player, under each team */}
                        {hasScorers && (
                            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
                                <div className="space-y-0.5">
                                    {homeScorers.map((scorer) => (
                                        <ScorerLine
                                            key={`h-${scorer.name}`}
                                            scorer={scorer}
                                            align="right"
                                        />
                                    ))}
                                </div>
                                <Target className="mt-0.5 h-3.5 w-3.5 text-muted-foreground/60" />
                                <div className="space-y-0.5">
                                    {awayScorers.map((scorer) => (
                                        <ScorerLine
                                            key={`a-${scorer.name}`}
                                            scorer={scorer}
                                            align="left"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
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
                                        <Link
                                            href={
                                                matches.edit(match.public_id)
                                                    .url
                                            }
                                        >
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

function ScorerLine({
    scorer,
    align,
}: {
    scorer: ScorerSummary;
    align: 'left' | 'right';
}) {
    return (
        <p
            className={cn(
                'truncate text-xs',
                align === 'right' ? 'text-right' : 'text-left',
            )}
        >
            <span className="font-medium">{scorer.name}</span>{' '}
            <span className="text-muted-foreground">
                {scorer.minutes.map((m) => `${m}'`).join(', ')}
            </span>
        </p>
    );
}
