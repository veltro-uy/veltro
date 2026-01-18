import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { VariantBadge } from '@/components/variant-badge';
import { useMatchCountdown } from '@/hooks/use-match-countdown';
import matches from '@/routes/matches';
import { Link } from '@inertiajs/react';
import { CalendarDays, Clock, MapPin, Trophy } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
}

interface Match {
    id: number;
    home_team_id: number;
    away_team_id?: number;
    variant: string;
    scheduled_at: string;
    location: string;
    match_type: string;
    status: string;
    home_score?: number;
    away_score?: number;
    notes?: string;
    home_team: Team;
    away_team?: Team;
}

interface MatchCardProps {
    match: Match;
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
};

const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: 'numeric',
        minute: '2-digit',
    });
};

export function MatchCard({ match }: MatchCardProps) {
    const { countdown, hasStarted } = useMatchCountdown(match.scheduled_at);

    return (
        <Card className="group transition-all hover:border-primary/20 hover:shadow-lg">
            <CardHeader className="pb-4">
                {/* Team Matchup Section - Primary Focus */}
                <div className="mb-4 flex items-center justify-between gap-6">
                    {/* Home Team */}
                    <div className="flex flex-1 flex-col items-center gap-2">
                        <TeamAvatar
                            name={match.home_team.name}
                            logoUrl={match.home_team.logo_url}
                            size="2xl"
                        />
                        <h3 className="line-clamp-2 text-center text-base font-bold">
                            {match.home_team.name}
                        </h3>
                    </div>

                    {/* Score or VS in the middle */}
                    <div className="flex min-w-[80px] flex-col items-center justify-center gap-2">
                        {match.status === 'completed' &&
                        match.home_score !== null &&
                        match.away_score !== null ? (
                            <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold">
                                    {match.home_score}
                                </span>
                                <span className="text-2xl font-bold text-muted-foreground">
                                    -
                                </span>
                                <span className="text-3xl font-bold">
                                    {match.away_score}
                                </span>
                            </div>
                        ) : (
                            <span className="text-2xl font-bold text-muted-foreground">
                                vs
                            </span>
                        )}
                        <VariantBadge variant={match.variant} />
                    </div>

                    {/* Away Team */}
                    <div className="flex flex-1 flex-col items-center gap-2">
                        {match.away_team ? (
                            <>
                                <TeamAvatar
                                    name={match.away_team.name}
                                    logoUrl={match.away_team.logo_url}
                                    size="2xl"
                                />
                                <h3 className="line-clamp-2 text-center text-base font-bold">
                                    {match.away_team.name}
                                </h3>
                            </>
                        ) : (
                            <>
                                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                                    <span className="text-xl text-muted-foreground/50">
                                        ?
                                    </span>
                                </div>
                                <p className="text-center text-sm text-muted-foreground">
                                    Buscando rival
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3">
                {/* Countdown Section */}
                {!hasStarted &&
                    countdown &&
                    match.status !== 'completed' &&
                    match.status !== 'cancelled' && (
                        <div className="flex items-center justify-center gap-2 rounded-lg border bg-primary/5 p-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <div className="text-center">
                                <p className="text-xs font-semibold text-primary">
                                    Comienza en {countdown}
                                </p>
                            </div>
                        </div>
                    )}

                {/* Match Details Section */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        <span>{formatDate(match.scheduled_at)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{formatTime(match.scheduled_at)}</span>
                    </div>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="line-clamp-1">{match.location}</span>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        <span>
                            {match.match_type === 'friendly'
                                ? 'Amistoso'
                                : 'Competitivo'}
                        </span>
                    </div>
                </div>

                <Button asChild variant="outline" className="mt-3 w-full">
                    <Link href={matches.show(match.id).url}>Ver Detalles</Link>
                </Button>
            </CardContent>
        </Card>
    );
}
