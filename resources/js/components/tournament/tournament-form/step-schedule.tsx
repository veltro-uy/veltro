import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { nowDateTimeLocal } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import type { TournamentVisibility } from '@/types';
import { Globe, Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import type { FormErrors, SetField, TournamentFormData } from './types';

interface StepScheduleProps {
    data: TournamentFormData;
    setField: SetField;
    errors: FormErrors;
    summary: ReactNode;
}

const VISIBILITY_OPTIONS: Array<{
    value: TournamentVisibility;
    label: string;
    description: string;
    icon: typeof Globe;
}> = [
    {
        value: 'public',
        label: 'Público',
        description: 'Cualquier equipo puede inscribirse directamente.',
        icon: Globe,
    },
    {
        value: 'invite_only',
        label: 'Solo por invitación',
        description: 'Las inscripciones requieren tu aprobación.',
        icon: Lock,
    },
];

export function StepSchedule({
    data,
    setField,
    errors,
    summary,
}: StepScheduleProps) {
    const now = nowDateTimeLocal();

    return (
        <div className="space-y-6">
            {/* Dates + live summary */}
            <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="registration_deadline">
                            Cierre de inscripción
                        </Label>
                        <Input
                            id="registration_deadline"
                            type="datetime-local"
                            value={data.registration_deadline}
                            min={now}
                            max={data.starts_at || undefined}
                            onChange={(e) =>
                                setField(
                                    'registration_deadline',
                                    e.target.value,
                                )
                            }
                        />
                        <InputError message={errors.registration_deadline} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="starts_at">Fecha de inicio</Label>
                            <Input
                                id="starts_at"
                                type="datetime-local"
                                value={data.starts_at}
                                min={data.registration_deadline || now}
                                max={data.ends_at || undefined}
                                onChange={(e) =>
                                    setField('starts_at', e.target.value)
                                }
                            />
                            <InputError message={errors.starts_at} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ends_at">
                                Fecha de finalización
                            </Label>
                            <Input
                                id="ends_at"
                                type="datetime-local"
                                value={data.ends_at}
                                min={data.starts_at || now}
                                onChange={(e) =>
                                    setField('ends_at', e.target.value)
                                }
                            />
                            <InputError message={errors.ends_at} />
                        </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Las fechas son opcionales, pero deben ir en orden:
                        cierre → inicio → fin.
                    </p>
                </div>

                {summary}
            </div>

            <Separator />

            {/* Visibility */}
            <div className="space-y-2">
                <Label>Visibilidad</Label>
                <RadioGroup
                    value={data.visibility}
                    onValueChange={(value) =>
                        setField('visibility', value as TournamentVisibility)
                    }
                    className="gap-3 sm:grid-cols-2"
                >
                    {VISIBILITY_OPTIONS.map((option) => {
                        const id = `visibility-${option.value}`;
                        const selected = data.visibility === option.value;
                        const Icon = option.icon;
                        return (
                            <label
                                key={option.value}
                                htmlFor={id}
                                className={cn(
                                    'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                                    selected
                                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                        : 'border-border hover:border-primary/40 hover:bg-muted/40',
                                )}
                            >
                                <span
                                    className={cn(
                                        'flex size-9 shrink-0 items-center justify-center rounded-lg',
                                        selected
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-muted text-muted-foreground',
                                    )}
                                >
                                    <Icon className="size-5" />
                                </span>
                                <div className="flex-1 space-y-1">
                                    <span className="font-medium">
                                        {option.label}
                                    </span>
                                    <p className="text-sm text-muted-foreground">
                                        {option.description}
                                    </p>
                                </div>
                                <RadioGroupItem
                                    id={id}
                                    value={option.value}
                                    className="mt-1"
                                />
                            </label>
                        );
                    })}
                </RadioGroup>
                <InputError message={errors.visibility} />
            </div>
        </div>
    );
}
