import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
    const wrapperProps = match.id ? { href: `/matches/${match.id}` } : {};

    return (
        <MatchWrapper {...wrapperProps}>
            <Card
                className={cn(
                    'mb-4 transition-all',
                    match.id &&
                        'cursor-pointer hover:border-primary/30 hover:shadow-md',
                    isPending && 'opacity-60',
                )}
            >
                <CardContent className="p-0">
                    {/* Home Team */}
                    <div
                        className={cn(
                            'flex items-center justify-between border-b px-3 py-2.5 transition-colors',
                            winnerId === match.home_team_id &&
                                'bg-primary/10 font-semibold',
                        )}
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                                className={cn(
                                    'truncate text-sm',
                                    !match.home_team_id &&
                                        'text-muted-foreground italic',
                                )}
                            >
                                {match.home_team?.name || 'TBD'}
                            </span>
                            {winnerId === match.home_team_id && (
                                <Trophy className="size-3.5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                            )}
                        </div>
                        {isCompleted && match.home_score !== undefined && (
                            <span className="ml-2 text-sm font-bold tabular-nums">
                                {match.home_score}
                            </span>
                        )}
                    </div>

                    {/* Away Team */}
                    <div
                        className={cn(
                            'flex items-center justify-between px-3 py-2.5 transition-colors',
                            winnerId === match.away_team_id &&
                                'bg-primary/10 font-semibold',
                        )}
                    >
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span
                                className={cn(
                                    'truncate text-sm',
                                    !match.away_team_id &&
                                        'text-muted-foreground italic',
                                )}
                            >
                                {match.away_team?.name || 'TBD'}
                            </span>
                            {winnerId === match.away_team_id && (
                                <Trophy className="size-3.5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
                            )}
                        </div>
                        {isCompleted && match.away_score !== undefined && (
                            <span className="ml-2 text-sm font-bold tabular-nums">
                                {match.away_score}
                            </span>
                        )}
                    </div>

                    {/* Status Badge */}
                    {(isPending || isUpcoming) && (
                        <div className="border-t bg-muted/30 px-3 py-1.5 text-center">
                            {isPending && (
                                <Badge variant="outline" className="text-xs">
                                    Pendiente
                                </Badge>
                            )}
                            {isUpcoming && (
                                <Badge className="text-xs">Próximo</Badge>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </MatchWrapper>
    );
};

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
        <div className="overflow-x-auto">
            <div className="inline-flex gap-6 pb-4">
                {rounds.map((round, index) => (
                    <div key={round.id} className="flex flex-col">
                        {/* Round Header */}
                        <div
                            className={cn(
                                'mb-4 rounded-lg border bg-card p-3 text-center',
                                round.round_number === rounds.length &&
                                    'border-primary/50 bg-primary/5',
                            )}
                        >
                            <h3
                                className={cn(
                                    'text-base font-semibold',
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

                        {/* Matches in Round */}
                        <div
                            className="min-w-[260px] space-y-4"
                            style={{
                                // Add vertical spacing that increases with each round
                                marginTop:
                                    index > 0
                                        ? `${Math.pow(2, index - 1) * 40}px`
                                        : '0',
                            }}
                        >
                            {round.matches && round.matches.length > 0 ? (
                                round.matches.map((match, matchIndex) => (
                                    <div
                                        key={match.id}
                                        style={{
                                            // Add spacing between matches that increases with rounds
                                            marginTop:
                                                matchIndex > 0
                                                    ? `${Math.pow(2, index) * 40}px`
                                                    : '0',
                                        }}
                                    >
                                        <BracketMatch match={match} />
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-sm text-muted-foreground">
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
