import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Team, TournamentGroup, TournamentTeam } from '@/types';
import { router } from '@inertiajs/react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Props {
    tournamentId: number;
    groups: TournamentGroup[];
    approvedTeams: (TournamentTeam & { team: Team })[];
    groupSize: number;
}

const UNASSIGNED = 'unassigned';

export function GroupDraw({
    tournamentId,
    groups,
    approvedTeams,
    groupSize,
}: Props) {
    // Local map of tournamentTeam.id → tournamentGroupId|null. Initialised
    // from the backend payload so the UI reflects what's already saved.
    const [assignments, setAssignments] = useState<
        Record<number, number | null>
    >(() => {
        const init: Record<number, number | null> = {};
        for (const tt of approvedTeams) {
            init[tt.id] = tt.tournament_group_id ?? null;
        }
        return init;
    });
    const [saving, setSaving] = useState(false);

    const teamsByGroup = useMemo(() => {
        const map: Record<number, (TournamentTeam & { team: Team })[]> = {};
        for (const group of groups) map[group.id] = [];
        for (const tt of approvedTeams) {
            const groupId = assignments[tt.id];
            if (groupId != null && map[groupId]) map[groupId].push(tt);
        }
        return map;
    }, [groups, approvedTeams, assignments]);

    const totalAssigned = approvedTeams.filter(
        (tt) => assignments[tt.id] != null,
    ).length;
    const allAssigned = totalAssigned === approvedTeams.length;
    const overflow = groups.some(
        (g) => (teamsByGroup[g.id]?.length ?? 0) > groupSize,
    );

    const handleAssign = (tournamentTeamId: number, value: string) => {
        setAssignments((prev) => ({
            ...prev,
            [tournamentTeamId]:
                value === UNASSIGNED ? null : parseInt(value, 10),
        }));
    };

    const handleSave = () => {
        if (overflow) {
            toast.error(
                'Algún grupo tiene más equipos que el tamaño permitido.',
            );
            return;
        }
        setSaving(true);
        router.post(
            `/tournaments/${tournamentId}/groups/draw`,
            {
                assignments: approvedTeams.map((tt) => ({
                    tournament_team_id: tt.id,
                    tournament_group_id: assignments[tt.id],
                })),
            },
            {
                preserveScroll: true,
                onSuccess: () => toast.success('Sorteo guardado.'),
                onError: () => toast.error('No se pudo guardar el sorteo.'),
                onFinish: () => setSaving(false),
            },
        );
    };

    const handleClear = () => {
        if (!confirm('¿Borrar todas las asignaciones?')) return;
        router.delete(`/tournaments/${tournamentId}/groups/draw`, {
            preserveScroll: true,
            onSuccess: () => {
                setAssignments(
                    Object.fromEntries(
                        approvedTeams.map((tt) => [tt.id, null]),
                    ),
                );
                toast.success('Sorteo reiniciado.');
            },
            onError: () => toast.error('No se pudo reiniciar el sorteo.'),
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                    <CardTitle className="text-base">
                        Sorteo de Grupos
                    </CardTitle>
                    <CardDescription>
                        Asigná cada equipo a un grupo antes de comenzar el
                        torneo. {totalAssigned}/{approvedTeams.length}{' '}
                        asignados.
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleClear}
                        disabled={saving || totalAssigned === 0}
                    >
                        <RotateCcw className="size-4" />
                        Reiniciar
                    </Button>
                    <Button
                        type="button"
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || overflow}
                    >
                        {saving ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            <Save className="size-4" />
                        )}
                        Guardar
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Team list with per-team group selector */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                        Equipos
                    </h3>
                    <div className="space-y-2">
                        {approvedTeams.map((tt) => (
                            <div
                                key={tt.id}
                                className="flex items-center justify-between gap-3 rounded-md border p-2"
                            >
                                <div className="flex min-w-0 items-center gap-2">
                                    <Avatar className="size-7">
                                        {tt.team?.logo_url && (
                                            <AvatarImage
                                                src={tt.team.logo_url}
                                                alt={tt.team.name}
                                            />
                                        )}
                                        <AvatarFallback className="text-xs">
                                            {tt.team?.name
                                                ?.slice(0, 2)
                                                .toUpperCase() ?? '?'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="truncate text-sm font-medium">
                                        {tt.team?.name ?? `Team ${tt.team_id}`}
                                    </span>
                                </div>
                                <Select
                                    value={(
                                        assignments[tt.id] ?? UNASSIGNED
                                    ).toString()}
                                    onValueChange={(value) =>
                                        handleAssign(tt.id, value)
                                    }
                                >
                                    <SelectTrigger className="w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={UNASSIGNED}>
                                            Sin grupo
                                        </SelectItem>
                                        {groups.map((group) => (
                                            <SelectItem
                                                key={group.id}
                                                value={group.id.toString()}
                                            >
                                                Grupo {group.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Group overview */}
                <div className="grid gap-3 md:grid-cols-2">
                    {groups.map((group) => {
                        const teams = teamsByGroup[group.id] ?? [];
                        const overCapacity = teams.length > groupSize;
                        return (
                            <div
                                key={group.id}
                                className={cn(
                                    'space-y-2 rounded-md border p-3',
                                    overCapacity &&
                                        'border-destructive/60 bg-destructive/5',
                                )}
                            >
                                <div className="flex items-center justify-between text-sm font-medium">
                                    <span>Grupo {group.name}</span>
                                    <span
                                        className={cn(
                                            'text-xs text-muted-foreground tabular-nums',
                                            overCapacity && 'text-destructive',
                                        )}
                                    >
                                        {teams.length}/{groupSize}
                                    </span>
                                </div>
                                {teams.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                        Sin equipos asignados.
                                    </p>
                                ) : (
                                    <ul className="space-y-1">
                                        {teams.map((tt) => (
                                            <li
                                                key={tt.id}
                                                className="truncate text-xs text-muted-foreground"
                                            >
                                                {tt.team?.name ??
                                                    `Team ${tt.team_id}`}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        );
                    })}
                </div>

                {!allAssigned && (
                    <p className="text-xs text-muted-foreground">
                        Faltan {approvedTeams.length - totalAssigned} equipos
                        por asignar para poder iniciar el torneo.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
