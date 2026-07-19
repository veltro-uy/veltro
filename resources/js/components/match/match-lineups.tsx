import type { LineupPlayer } from '@/components/match/types';
import { TeamAvatar } from '@/components/team-avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { Link } from '@inertiajs/react';

interface MatchLineupsProps {
    homeTeamName: string;
    awayTeamName?: string;
    homeTeamLogoUrl?: string;
    awayTeamLogoUrl?: string;
    homeLineup: LineupPlayer[];
    awayLineup: LineupPlayer[];
}

/**
 * Read-only team-sheet view of the confirmed rosters for both teams. Leaders
 * edit the lineup on the dedicated `/lineup` page; this only displays who's
 * selected.
 */
export function MatchLineups({
    homeTeamName,
    awayTeamName,
    homeTeamLogoUrl,
    awayTeamLogoUrl,
    homeLineup,
    awayLineup,
}: MatchLineupsProps) {
    const showAway = Boolean(awayTeamName) && awayLineup.length > 0;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Alineaciones</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
                    <LineupColumn
                        teamName={homeTeamName}
                        teamLogoUrl={homeTeamLogoUrl}
                        players={homeLineup}
                    />
                    {showAway && (
                        <LineupColumn
                            teamName={awayTeamName as string}
                            teamLogoUrl={awayTeamLogoUrl}
                            players={awayLineup}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function LineupColumn({
    teamName,
    teamLogoUrl,
    players,
}: {
    teamName: string;
    teamLogoUrl?: string;
    players: LineupPlayer[];
}) {
    return (
        <div>
            <div className="flex items-center gap-2 border-b pb-2.5">
                <TeamAvatar
                    name={teamName}
                    logoUrl={teamLogoUrl}
                    size="sm"
                    className="h-7 w-7 shrink-0"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {teamName}
                </p>
                <Badge variant="secondary" className="shrink-0 tabular-nums">
                    {players.length}
                </Badge>
            </div>
            {players.length > 0 ? (
                <ul className="mt-2 space-y-0.5">
                    {players.map((player, index) => (
                        <li key={player.id}>
                            <Link
                                href={`/jugadores/${player.user.id}`}
                                className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
                            >
                                <span className="w-5 shrink-0 text-center text-xs font-medium text-muted-foreground tabular-nums">
                                    {index + 1}
                                </span>
                                <UserAvatar name={player.user.name} size="sm" />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                                    {player.user.name}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-sm text-muted-foreground">
                    Sin jugadores seleccionados.
                </p>
            )}
        </div>
    );
}
