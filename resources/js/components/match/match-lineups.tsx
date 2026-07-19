import type { LineupPlayer } from '@/components/match/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { UserNameLink } from '@/components/user-name-link';

interface MatchLineupsProps {
    homeTeamName: string;
    awayTeamName?: string;
    homeLineup: LineupPlayer[];
    awayLineup: LineupPlayer[];
}

/**
 * Read-only view of the confirmed rosters for both teams. Leaders edit the
 * lineup on the dedicated `/lineup` page; this only displays who's selected.
 */
export function MatchLineups({
    homeTeamName,
    awayTeamName,
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
                <div className="grid gap-6 sm:grid-cols-2">
                    <LineupColumn
                        teamName={homeTeamName}
                        players={homeLineup}
                    />
                    {showAway && (
                        <LineupColumn
                            teamName={awayTeamName as string}
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
    players,
}: {
    teamName: string;
    players: LineupPlayer[];
}) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{teamName}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                    {players.length}{' '}
                    {players.length === 1 ? 'jugador' : 'jugadores'}
                </span>
            </div>
            {players.length > 0 ? (
                <ul className="space-y-2">
                    {players.map((player) => (
                        <li
                            key={player.id}
                            className="flex items-center gap-2.5"
                        >
                            <UserAvatar name={player.user.name} size="sm" />
                            <UserNameLink
                                user={player.user}
                                className="truncate text-sm"
                            />
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-muted-foreground">
                    Sin jugadores seleccionados.
                </p>
            )}
        </div>
    );
}
