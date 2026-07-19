import type { LineupPlayer } from '@/components/match/types';
import { TeamAvatar } from '@/components/team-avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { UserNameLink } from '@/components/user-name-link';

interface MatchLineupsProps {
    homeTeamName: string;
    awayTeamName?: string;
    homeTeamLogoUrl?: string;
    awayTeamLogoUrl?: string;
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
                <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
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
        <div className="space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
                <TeamAvatar
                    name={teamName}
                    logoUrl={teamLogoUrl}
                    size="sm"
                    className="h-7 w-7 shrink-0"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {teamName}
                </p>
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
