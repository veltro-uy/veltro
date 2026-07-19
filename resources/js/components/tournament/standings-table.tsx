import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { StandingRow } from '@/types';
import { Crown } from 'lucide-react';

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
    const showQualification =
        highlightTopN !== undefined && highlightTopN > 0 && rows.length > 0;

    return (
        <div className={cn('overflow-hidden rounded-xl border', className)}>
            {title && (
                <div className="border-b bg-muted/40 px-4 py-2 text-sm font-semibold">
                    {title}
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            <th className="py-2.5 pr-2 pl-4 text-center font-medium">
                                #
                            </th>
                            <th className="px-2 py-2.5 text-left font-medium">
                                Equipo
                            </th>
                            <th className="w-9 px-1 py-2.5 text-center font-medium">
                                PJ
                            </th>
                            <th className="hidden w-9 px-1 py-2.5 text-center font-medium sm:table-cell">
                                G
                            </th>
                            <th className="hidden w-9 px-1 py-2.5 text-center font-medium sm:table-cell">
                                E
                            </th>
                            <th className="hidden w-9 px-1 py-2.5 text-center font-medium sm:table-cell">
                                P
                            </th>
                            <th className="hidden w-9 px-1 py-2.5 text-center font-medium md:table-cell">
                                GF
                            </th>
                            <th className="hidden w-9 px-1 py-2.5 text-center font-medium md:table-cell">
                                GC
                            </th>
                            <th className="w-11 px-1 py-2.5 text-center font-medium">
                                DG
                            </th>
                            <th className="w-12 py-2.5 pr-4 pl-1 text-center font-semibold text-foreground">
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
                            const isLeader = row.position === 1;
                            return (
                                <tr
                                    key={row.team_id}
                                    className={cn(
                                        'group border-t border-border/60 transition-colors hover:bg-muted/40',
                                        highlighted && 'bg-primary/[0.04]',
                                        row.tied_with_above &&
                                            'border-t-dashed border-t-border',
                                    )}
                                >
                                    <td className="relative py-2.5 pr-2 pl-4 text-center">
                                        {highlighted && (
                                            <span
                                                aria-hidden
                                                className="absolute inset-y-0 left-0 w-[3px] rounded-r bg-primary"
                                            />
                                        )}
                                        <span
                                            className={cn(
                                                'inline-flex size-6 items-center justify-center rounded-md text-xs font-semibold tabular-nums',
                                                isLeader
                                                    ? 'bg-primary/15 text-primary'
                                                    : 'text-muted-foreground',
                                            )}
                                        >
                                            {row.position}
                                        </span>
                                    </td>
                                    <td className="px-2 py-2.5 text-left">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar className="size-7 shrink-0">
                                                {row.team?.logo_url && (
                                                    <AvatarImage
                                                        src={row.team.logo_url}
                                                        alt={row.team?.name}
                                                    />
                                                )}
                                                <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                                                    {row.team?.name
                                                        ?.slice(0, 2)
                                                        .toUpperCase() ?? '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span
                                                className={cn(
                                                    'truncate',
                                                    isLeader
                                                        ? 'font-semibold'
                                                        : 'font-medium',
                                                )}
                                            >
                                                {row.team?.name ??
                                                    `Team ${row.team_id}`}
                                            </span>
                                            {isLeader && (
                                                <Crown className="size-3.5 shrink-0 text-amber-400" />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-1 py-2.5 text-center tabular-nums">
                                        {row.played}
                                    </td>
                                    <td className="hidden px-1 py-2.5 text-center tabular-nums sm:table-cell">
                                        {row.wins}
                                    </td>
                                    <td className="hidden px-1 py-2.5 text-center tabular-nums sm:table-cell">
                                        {row.draws}
                                    </td>
                                    <td className="hidden px-1 py-2.5 text-center tabular-nums sm:table-cell">
                                        {row.losses}
                                    </td>
                                    <td className="hidden px-1 py-2.5 text-center tabular-nums md:table-cell">
                                        {row.goals_for}
                                    </td>
                                    <td className="hidden px-1 py-2.5 text-center tabular-nums md:table-cell">
                                        {row.goals_against}
                                    </td>
                                    <td
                                        className={cn(
                                            'px-1 py-2.5 text-center font-medium tabular-nums',
                                            row.goal_difference > 0 &&
                                                'text-emerald-500',
                                            row.goal_difference < 0 &&
                                                'text-rose-500',
                                            row.goal_difference === 0 &&
                                                'text-muted-foreground',
                                        )}
                                    >
                                        {row.goal_difference > 0
                                            ? `+${row.goal_difference}`
                                            : row.goal_difference}
                                    </td>
                                    <td className="py-2.5 pr-4 pl-1 text-center text-[15px] font-bold tabular-nums">
                                        {row.points}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {showQualification && (
                <div className="flex items-center gap-2 border-t bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground">
                    <span className="inline-block h-2.5 w-[3px] rounded-full bg-primary" />
                    {highlightTopN === 1
                        ? 'Puesto de campeón'
                        : `Zona de clasificación (top ${highlightTopN})`}
                </div>
            )}
        </div>
    );
}
