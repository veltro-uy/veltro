import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/types';

interface Props {
    rows: StandingRow[];
    highlightTopN?: number;
    title?: string;
    className?: string;
}

export function StandingsTable({
    rows,
    highlightTopN,
    title,
    className,
}: Props) {
    return (
        <div className={cn('overflow-hidden rounded-md border', className)}>
            {title && (
                <div className="border-b bg-muted/40 px-4 py-2 text-sm font-semibold">
                    {title}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/40 text-xs text-muted-foreground uppercase">
                            <th className="px-3 py-2 text-left">#</th>
                            <th className="px-3 py-2 text-left">Equipo</th>
                            <th className="px-2 py-2 text-center">PJ</th>
                            <th className="hidden px-2 py-2 text-center sm:table-cell">
                                G
                            </th>
                            <th className="hidden px-2 py-2 text-center sm:table-cell">
                                E
                            </th>
                            <th className="hidden px-2 py-2 text-center sm:table-cell">
                                P
                            </th>
                            <th className="hidden px-2 py-2 text-center md:table-cell">
                                GF
                            </th>
                            <th className="hidden px-2 py-2 text-center md:table-cell">
                                GC
                            </th>
                            <th className="px-2 py-2 text-center">DG</th>
                            <th className="px-3 py-2 text-center font-semibold">
                                Pts
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={10}
                                    className="px-3 py-6 text-center text-muted-foreground"
                                >
                                    Aún no hay equipos en la tabla.
                                </td>
                            </tr>
                        )}
                        {rows.map((row) => {
                            const highlighted =
                                highlightTopN !== undefined &&
                                row.position <= highlightTopN;
                            return (
                                <tr
                                    key={row.team_id}
                                    className={cn(
                                        'border-t',
                                        highlighted && 'bg-emerald-500/5',
                                        row.tied_with_above && 'border-dashed',
                                    )}
                                >
                                    <td className="px-3 py-2 text-left font-medium tabular-nums">
                                        {row.position}
                                    </td>
                                    <td className="px-3 py-2 text-left">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="size-6">
                                                {row.team?.logo_url && (
                                                    <AvatarImage
                                                        src={row.team.logo_url}
                                                        alt={row.team?.name}
                                                    />
                                                )}
                                                <AvatarFallback className="text-[10px]">
                                                    {row.team?.name
                                                        ?.slice(0, 2)
                                                        .toUpperCase() ?? '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">
                                                {row.team?.name ??
                                                    `Team ${row.team_id}`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-2 py-2 text-center tabular-nums">
                                        {row.played}
                                    </td>
                                    <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                                        {row.wins}
                                    </td>
                                    <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                                        {row.draws}
                                    </td>
                                    <td className="hidden px-2 py-2 text-center tabular-nums sm:table-cell">
                                        {row.losses}
                                    </td>
                                    <td className="hidden px-2 py-2 text-center tabular-nums md:table-cell">
                                        {row.goals_for}
                                    </td>
                                    <td className="hidden px-2 py-2 text-center tabular-nums md:table-cell">
                                        {row.goals_against}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-2 py-2 text-center tabular-nums',
                                            row.goal_difference > 0 &&
                                                'text-emerald-600',
                                            row.goal_difference < 0 &&
                                                'text-rose-600',
                                        )}
                                    >
                                        {row.goal_difference > 0
                                            ? `+${row.goal_difference}`
                                            : row.goal_difference}
                                    </td>
                                    <td className="px-3 py-2 text-center font-semibold tabular-nums">
                                        {row.points}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
