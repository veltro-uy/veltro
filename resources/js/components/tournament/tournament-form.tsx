import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { nowDateTimeLocal, toDateTimeLocal } from '@/lib/datetime';
import { isTeamConfigValid, resolveMaxTeams } from '@/lib/tournament-format';
import tournaments from '@/routes/tournaments';
import type { Tournament } from '@/types';
import { useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Loader2, Save } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { StepBasics } from './tournament-form/step-basics';
import { StepFormat } from './tournament-form/step-format';
import { StepSchedule } from './tournament-form/step-schedule';
import { Stepper } from './tournament-form/stepper';
import { TournamentSummary } from './tournament-form/tournament-summary';
import {
    STEP_FIELDS,
    STEP_LABELS,
    type FormErrors,
    type TournamentFormData,
} from './tournament-form/types';

interface TournamentFormProps {
    mode: 'create' | 'edit';
    tournament?: Tournament;
    formatLocked?: boolean;
}

const LAST_STEP = STEP_LABELS.length - 1;

export function TournamentForm({
    mode,
    tournament,
    formatLocked,
}: TournamentFormProps) {
    const form = useForm<TournamentFormData>({
        name: tournament?.name ?? '',
        description: tournament?.description ?? '',
        visibility: tournament?.visibility ?? 'public',
        variant: tournament?.variant ?? '',
        format: tournament?.format ?? 'single_elimination',
        group_count: tournament?.group_count ?? 4,
        group_size: tournament?.group_size ?? 4,
        max_teams: tournament?.max_teams ?? 8,
        min_teams: tournament?.min_teams ?? 4,
        registration_deadline: toDateTimeLocal(
            tournament?.registration_deadline,
        ),
        starts_at: toDateTimeLocal(tournament?.starts_at),
        ends_at: toDateTimeLocal(tournament?.ends_at),
        logo: null,
        remove_logo: false,
    });
    const { data, setData, processing, errors } = form;
    const { registration_deadline, starts_at, ends_at } = data;

    const [step, setStep] = useState(0);
    const [maxStepReached, setMaxStepReached] = useState(
        mode === 'edit' ? LAST_STEP : 0,
    );

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(
        (tournament?.logo_url as string | undefined) ?? null,
    );

    // Revoke any object URL we created for the local preview on unmount.
    useEffect(() => {
        return () => {
            if (logoPreview?.startsWith('blob:')) {
                URL.revokeObjectURL(logoPreview);
            }
        };
    }, [logoPreview]);

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (
            !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
                file.type,
            )
        ) {
            form.setError(
                'logo',
                'Por favor selecciona una imagen válida (JPG, PNG o WEBP)',
            );
            return;
        }
        if (file.size > 2048 * 1024) {
            form.setError('logo', 'La imagen no debe superar los 2MB');
            return;
        }

        if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
        setData('logo', file);
        setData('remove_logo', false);
        setLogoPreview(URL.createObjectURL(file));
        form.clearErrors('logo');
    };

    const handleLogoRemove = () => {
        if (logoPreview?.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
        setData('logo', null);
        setData('remove_logo', true);
        setLogoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Client-side date-ordering feedback (server still enforces these).
    const clientErrors = useMemo<FormErrors>(() => {
        const e: FormErrors = {};
        if (
            registration_deadline &&
            starts_at &&
            registration_deadline >= starts_at
        ) {
            e.registration_deadline = 'Debe ser anterior a la fecha de inicio.';
        }
        if (starts_at && ends_at && starts_at >= ends_at) {
            e.starts_at = 'Debe ser anterior a la fecha de finalización.';
        }
        return e;
    }, [registration_deadline, starts_at, ends_at]);

    const mergedErrors: FormErrors = { ...errors, ...clientErrors };

    const datesNotInPast = useMemo(() => {
        if (mode === 'edit') return true;
        const now = nowDateTimeLocal();
        return [registration_deadline, starts_at, ends_at].every(
            (value) => !value || value >= now,
        );
    }, [mode, registration_deadline, starts_at, ends_at]);

    const isStepValid = (index: number): boolean => {
        if (index === 0) {
            return data.name.trim() !== '' && data.variant !== '';
        }
        if (index === 1) {
            const maxTeams = resolveMaxTeams(data.format, data);
            return (
                isTeamConfigValid(data.format, data) &&
                data.min_teams >= 2 &&
                data.min_teams <= maxTeams
            );
        }
        return Object.keys(clientErrors).length === 0 && datesNotInPast;
    };

    const goNext = () => {
        if (!isStepValid(step)) return;
        const next = Math.min(step + 1, LAST_STEP);
        setStep(next);
        setMaxStepReached((m) => Math.max(m, next));
    };

    const goPrev = () => setStep((s) => Math.max(0, s - 1));

    const reachable = (index: number) =>
        mode === 'edit' || index <= maxStepReached;

    const buildPayload = (d: TournamentFormData) => {
        const payload: Record<string, unknown> = {
            name: d.name,
            description: d.description,
            visibility: d.visibility,
            variant: d.variant,
            format: d.format,
            min_teams: d.min_teams,
            registration_deadline: d.registration_deadline,
            starts_at: d.starts_at,
            ends_at: d.ends_at,
        };

        if (d.format === 'group_stage_knockout') {
            payload.group_count = d.group_count;
            payload.group_size = d.group_size;
            payload.max_teams = d.group_count * d.group_size;
        } else {
            payload.max_teams = d.max_teams;
        }

        if (d.logo) payload.logo = d.logo;

        if (mode === 'edit') {
            payload._method = 'put';
            if (!d.logo && d.remove_logo) payload.remove_logo = '1';
        }

        return payload;
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        // On non-final steps, Enter advances rather than submitting.
        if (step < LAST_STEP) {
            goNext();
            return;
        }

        form.transform(buildPayload);

        const options = {
            onSuccess: () =>
                toast.success(
                    mode === 'create' ? '¡Torneo creado!' : 'Cambios guardados',
                ),
            onError: (serverErrors: Record<string, string>) => {
                const firstField = Object.keys(serverErrors)[0];
                if (firstField) {
                    const owningStep = STEP_FIELDS.findIndex((fields) =>
                        fields.includes(firstField),
                    );
                    if (owningStep >= 0) {
                        setStep(owningStep);
                        setMaxStepReached((m) => Math.max(m, owningStep));
                    }
                }
                toast.error('Revisá los datos del torneo.');
            },
        };

        if (mode === 'create') {
            form.post(tournaments.store().url, options);
        } else if (tournament) {
            form.post(tournaments.update(tournament.id).url, options);
        }
    };

    return (
        <form onSubmit={submit}>
            <Card>
                <CardContent className="space-y-8 pt-2">
                    <Stepper
                        steps={STEP_LABELS}
                        current={step}
                        reachable={reachable}
                        onStepClick={setStep}
                    />

                    {step === 0 && (
                        <StepBasics
                            data={data}
                            setField={setData}
                            errors={mergedErrors}
                            logoPreview={logoPreview}
                            fileInputRef={fileInputRef}
                            onLogoSelect={handleLogoSelect}
                            onLogoRemove={handleLogoRemove}
                        />
                    )}

                    {step === 1 && (
                        <StepFormat
                            data={data}
                            setField={setData}
                            errors={mergedErrors}
                            formatLocked={formatLocked}
                        />
                    )}

                    {step === 2 && (
                        <StepSchedule
                            data={data}
                            setField={setData}
                            errors={mergedErrors}
                            summary={<TournamentSummary data={data} />}
                        />
                    )}

                    <div className="flex items-center justify-between border-t pt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            className="gap-2"
                            onClick={
                                step === 0
                                    ? () => window.history.back()
                                    : goPrev
                            }
                        >
                            <ArrowLeft className="size-4" />
                            {step === 0 ? 'Cancelar' : 'Atrás'}
                        </Button>

                        {step < LAST_STEP ? (
                            <Button
                                key="next"
                                type="button"
                                className="gap-2"
                                onClick={goNext}
                                disabled={!isStepValid(step)}
                            >
                                Siguiente
                                <ArrowRight className="size-4" />
                            </Button>
                        ) : (
                            <Button
                                key="submit"
                                type="submit"
                                className="gap-2"
                                disabled={processing || !isStepValid(step)}
                            >
                                {processing ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Save className="size-4" />
                                )}
                                {mode === 'create'
                                    ? 'Crear torneo'
                                    : 'Guardar cambios'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
        </form>
    );
}
