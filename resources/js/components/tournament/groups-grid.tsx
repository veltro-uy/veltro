import { StandingsTable } from '@/components/tournament/standings-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { StandingRow, TournamentGroup } from '@/types';

interface Props {
    groups: TournamentGroup[];
    standingsByGroup: Record<number, StandingRow[]>;
    highlightTopN?: number;
}

export function GroupsGrid({
    groups,
    standingsByGroup,
    highlightTopN = 2,
}: Props) {
    if (groups.length === 0) return null;

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => {
                const rows = standingsByGroup[group.id] ?? [];
                return (
                    <Card key={group.id}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">
                                Grupo {group.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <StandingsTable
                                rows={rows}
                                highlightTopN={highlightTopN}
                            />
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
