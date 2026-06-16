import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    FORMAT_OPTIONS,
    GROUP_COUNT_OPTIONS,
    GROUP_SIZE_MAX,
    GROUP_SIZE_MIN,
    LEAGUE_MAX_TEAMS,
    LEAGUE_MIN_TEAMS,
    resolveMaxTeams,
    SINGLE_ELIM_TEAM_OPTIONS,
} from '@/lib/tournament-format';
import type { TournamentFormat } from '@/types';
import { Lock } from 'lucide-react';
import { FormatOptionCard } from './format-option-card';
import type { FormErrors, SetField, TournamentFormData } from './types';

interface StepFormatProps {
    data: TournamentFormData;
    setField: SetField;
    errors: FormErrors;
    formatLocked?: boolean;
}

const RequiredMark = () => <span className="text-destructive">*</span>;

export function StepFormat({
    data,
    setField,
    errors,
    formatLocked,
}: StepFormatProps) {
    const effectiveMaxTeams = resolveMaxTeams(data.format, data);

    return (
        <div className="space-y-6">
            {/* Format */}
            <div className="space-y-2">
                <Label>
                    Formato del torneo <RequiredMark />
                </Label>
                {formatLocked && (
                    <div className="flex items-start gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                        <Lock className="mt-0.5 size-4 shrink-0" />
                        <span>
                            No se puede cambiar el formato porque ya hay equipos
                            inscritos.
                        </span>
                    </div>
                )}
                <RadioGroup
                    value={data.format}
                    onValueChange={(value) =>
                        setField('format', value as TournamentFormat)
                    }
                    disabled={formatLocked}
                    className="gap-3"
                >
                    {FORMAT_OPTIONS.map((option) => (
                        <FormatOptionCard
                            key={option.value}
                            option={option}
                            selected={data.format === option.value}
                            disabled={formatLocked}
                        />
                    ))}
                </RadioGroup>
                <InputError message={errors.format} />
            </div>

            {/* Team configuration (format-dependent) */}
            {data.format === 'single_elimination' && (
                <div className="space-y-2">
                    <Label htmlFor="max_teams">
                        Número de equipos <RequiredMark />
                    </Label>
                    <Select
                        value={data.max_teams.toString()}
                        onValueChange={(value) =>
                            setField('max_teams', parseInt(value, 10))
                        }
                    >
                        <SelectTrigger id="max_teams">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SINGLE_ELIM_TEAM_OPTIONS.map((count) => (
                                <SelectItem
                                    key={count}
                                    value={count.toString()}
                                >
                                    {count} equipos
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        Debe ser una potencia de 2 para armar un bracket limpio.
                    </p>
                    <InputError message={errors.max_teams} />
                </div>
            )}

            {data.format === 'league' && (
                <div className="space-y-2">
                    <Label htmlFor="max_teams">
                        Número máximo de equipos <RequiredMark />
                    </Label>
                    <Input
                        id="max_teams"
                        type="number"
                        value={data.max_teams}
                        onChange={(e) =>
                            setField(
                                'max_teams',
                                parseInt(e.target.value, 10) ||
                                    LEAGUE_MIN_TEAMS,
                            )
                        }
                        min={LEAGUE_MIN_TEAMS}
                        max={LEAGUE_MAX_TEAMS}
                    />
                    <p className="text-xs text-muted-foreground">
                        Entre {LEAGUE_MIN_TEAMS} y {LEAGUE_MAX_TEAMS} equipos.
                        Cada equipo jugará {Math.max(0, data.max_teams - 1)}{' '}
                        partidos.
                    </p>
                    <InputError message={errors.max_teams} />
                </div>
            )}

            {data.format === 'group_stage_knockout' && (
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="group_count">
                            Cantidad de grupos <RequiredMark />
                        </Label>
                        <Select
                            value={data.group_count.toString()}
                            onValueChange={(value) =>
                                setField('group_count', parseInt(value, 10))
                            }
                        >
                            <SelectTrigger id="group_count">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {GROUP_COUNT_OPTIONS.map((count) => (
                                    <SelectItem
                                        key={count}
                                        value={count.toString()}
                                    >
                                        {count} grupos
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Potencia de 2 para un bracket limpio.
                        </p>
                        <InputError message={errors.group_count} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="group_size">
                            Equipos por grupo <RequiredMark />
                        </Label>
                        <Input
                            id="group_size"
                            type="number"
                            value={data.group_size}
                            onChange={(e) =>
                                setField(
                                    'group_size',
                                    parseInt(e.target.value, 10) ||
                                        GROUP_SIZE_MIN,
                                )
                            }
                            min={GROUP_SIZE_MIN}
                            max={GROUP_SIZE_MAX}
                        />
                        <p className="text-xs text-muted-foreground">
                            Total: {effectiveMaxTeams} equipos (
                            {data.group_count} × {data.group_size}).
                        </p>
                        <InputError message={errors.group_size} />
                    </div>
                </div>
            )}

            {/* Min teams */}
            <div className="space-y-2">
                <Label htmlFor="min_teams">Número mínimo de equipos</Label>
                <Input
                    id="min_teams"
                    type="number"
                    value={data.min_teams}
                    onChange={(e) =>
                        setField('min_teams', parseInt(e.target.value, 10) || 2)
                    }
                    min={2}
                    max={effectiveMaxTeams}
                />
                <p className="text-xs text-muted-foreground">
                    El torneo no podrá empezar con menos equipos que este.
                </p>
                <InputError message={errors.min_teams} />
            </div>
        </div>
    );
}
