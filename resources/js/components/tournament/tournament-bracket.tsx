import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { FootballMatch, TournamentRound } from '@/types';
import { Link } from '@inertiajs/react';
import { Trophy } from 'lucide-react';

interface TournamentBracketProps {
    rounds: TournamentRound[];
}

interface BracketMatchProps {
    match: FootballMatch;
}

const BracketMatch = ({ match }: BracketMatchProps) => {
    const isCompleted = match.status === 'completed';
    const isPending = !match.home_team_id || !match.away_team_id;
    const isUpcoming = match.home_team_id && match.away_team_id && !isCompleted;
    const winnerId = isCompleted ? getWinnerId(match) : null;

    const MatchWrapper = match.id ? Link : 'div';
    const wrapperProps = match.id
        ? { href: `/matches/${match.public_id}` }
        : {};

    return (
        <MatchWrapper {...wrapperProps} className={cn(match.id && 'block')}>
            <div
                className={cn(
                    'overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-colors',
                    match.id &&
                        'cursor-pointer hover:border-primary/40 hover:bg-muted/20',
                    isPending && 'opacity-70',
                )}
            >
                <BracketTeamRow
                    name={match.home_team?.name || 'TBD'}
                    score={match.home_score}
                    isWinner={winnerId === match.home_team_id}
                    isPlaceholder={!match.home_team_id}
                    showScore={isCompleted}
                    hasBorder
                />
                <BracketTeamRow
                    name={match.away_team?.name || 'TBD'}
                    score={match.away_score}
                    isWinner={winnerId === match.away_team_id}
                    isPlaceholder={!match.away_team_id}
                    showScore={isCompleted}
                />
                {(isPending || isUpcoming) && (
                    <div className="border-t bg-muted/25 px-3 py-1.5 text-center">
                        {isPending ? (
                            <Badge variant="outline" className="h-5 text-xs">
                                Pendiente
                            </Badge>
                        ) : (
                            <Badge className="h-5 text-xs">Próximo</Badge>
                        )}
                    </div>
                )}
            </div>
        </MatchWrapper>
    );
};

function BracketTeamRow({
    name,
    score,
    isWinner,
    isPlaceholder,
    showScore,
    hasBorder,
}: {
    name: string;
    score?: number;
    isWinner: boolean;
    isPlaceholder: boolean;
    showScore: boolean;
    hasBorder?: boolean;
}) {
    return (
        <div
            className={cn(
                'flex h-11 items-center justify-between gap-3 px-3 transition-colors',
                hasBorder && 'border-b',
                isWinner && 'bg-emerald-500/10 font-semibold text-foreground',
            )}
        >
            <div className="flex min-w-0 items-center gap-2">
                <span
                    className={cn(
                        'truncate text-sm',
                        isPlaceholder && 'text-muted-foreground italic',
                    )}
                >
                    {name}
                </span>
                {isWinner && (
                    <Trophy className="size-3.5 shrink-0 text-yellow-500" />
                )}
            </div>
            {showScore && (
                <span className="text-sm font-bold tabular-nums">
                    {score ?? 0}
                </span>
            )}
        </div>
    );
}

const getWinnerId = (match: FootballMatch): number | null => {
    if (
        match.status !== 'completed' ||
        match.home_score === undefined ||
        match.away_score === undefined
    ) {
        return null;
    }

    if (match.home_score > match.away_score) {
        return match.home_team_id;
    }
    if (match.away_score > match.home_score) {
        return match.away_team_id || null;
    }
    return null; // Draw
};

export const TournamentBracket = ({ rounds }: TournamentBracketProps) => {
    if (rounds.length === 0) {
        return (
            <div className="py-12 text-center text-muted-foreground">
                No hay rondas disponibles aún
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border bg-muted/10 p-3">
            <div className="grid min-w-max auto-cols-[minmax(16rem,18rem)] grid-flow-col gap-4 pb-1">
                {rounds.map((round) => (
                    <div key={round.id} className="flex min-w-64 flex-col">
                        <div
                            className={cn(
                                'sticky top-0 left-0 z-10 mb-3 rounded-lg border bg-card/95 p-3 text-center backdrop-blur',
                                round.round_number === rounds.length &&
                                    'border-primary/50 bg-primary/10',
                            )}
                        >
                            <h3
                                className={cn(
                                    'text-sm font-semibold',
                                    round.round_number === rounds.length &&
                                        'text-primary',
                                )}
                            >
                                {round.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Ronda {round.round_number}
                            </p>
                        </div>
                        <div
                            className="flex flex-1 flex-col justify-around gap-4"
                            style={{
                                minHeight: `${Math.max(1, rounds[0]?.matches?.length ?? 1) * 8.5}rem`,
                            }}
                        >
                            {round.matches && round.matches.length > 0 ? (
                                round.matches.map((match) => (
                                    <div key={match.id} className="relative">
                                        <BracketMatch match={match} />
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
                                    Sin partidos
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
