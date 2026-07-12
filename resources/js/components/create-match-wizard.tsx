import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VariantBadge } from '@/components/variant-badge';
import { formatDate, formatTime, nowDateTimeLocal } from '@/lib/datetime';
import { cn } from '@/lib/utils';
import matches from '@/routes/matches';
import { useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    Check,
    Clock,
    Handshake,
    Loader2,
    MapPin,
    Swords,
    Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
}

const STEPS = ['Equipo', 'Cuándo y dónde', 'Detalles'] as const;
const DEFAULT_TIME = '20:00';

const MATCH_TYPES = [
    {
        value: 'friendly',
        label: 'Amistoso',
        blurb: 'Sin puntos en juego, puro fútbol.',
        icon: Handshake,
    },
    {
        value: 'competitive',
        label: 'Competitivo',
        blurb: 'Cuenta para la tabla o el orgullo.',
        icon: Swords,
    },
] as const;

/** "YYYY-MM-DD" of today in Montevideo. */
function todayLocalDate(): string {
    return nowDateTimeLocal().slice(0, 10);
}

/** Add `days` to a "YYYY-MM-DD" string via UTC arithmetic (no tz drift). */
function addDays(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    return dt.toISOString().slice(0, 10);
}

/** Offset (0–6) to the next occurrence of `weekday` (0=Sun), today counts as this week. */
function daysUntilWeekday(dateStr: string, weekday: number): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    const current = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return (weekday - current + 7) % 7;
}

export function CreateMatchWizard({ teams }: { teams: Team[] }) {
    const [step, setStep] = useState(0);
    const [date, setDate] = useState('');
    const [time, setTime] = useState(DEFAULT_TIME);

    const { data, setData, post, processing, errors } = useForm({
        team_id: teams.length === 1 ? teams[0].id.toString() : '',
        scheduled_at: '',
        location: '',
        match_type: 'friendly',
        notes: '',
    });

    const today = useMemo(() => todayLocalDate(), []);
    const selectedTeam = teams.find((t) => t.id.toString() === data.team_id);

    const datePresets = useMemo(
        () => [
            { label: 'Hoy', value: today },
            { label: 'Mañana', value: addDays(today, 1) },
            {
                label: 'Sábado',
                value: addDays(today, daysUntilWeekday(today, 6)),
            },
            {
                label: 'Domingo',
                value: addDays(today, daysUntilWeekday(today, 0)),
            },
        ],
        [today],
    );

    // Keep scheduled_at in sync with the date + time pickers.
    const applySchedule = (nextDate: string, nextTime: string) => {
        setDate(nextDate);
        setTime(nextTime);
        setData(
            'scheduled_at',
            nextDate && nextTime ? `${nextDate}T${nextTime}` : '',
        );
    };

    const step1Valid = !!data.team_id;
    const step2Valid = !!data.scheduled_at && data.location.trim().length > 0;

    const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
    const back = () => setStep((s) => Math.max(s - 1, 0));

    const submit = () => {
        post(matches.store().url, {
            // On success the request redirects to the match page, which surfaces
            // the flash success toast — no toast needed here.
            onError: (errs) => {
                if (errs.team_id) setStep(0);
                else if (errs.scheduled_at || errs.location) setStep(1);
                else if (errs.match_type || errs.notes) setStep(2);
                toast.error(
                    errs.team_id ||
                        errs.scheduled_at ||
                        errs.location ||
                        errs.match_type ||
                        errs.notes ||
                        'No pudimos publicar el partido',
                );
            },
        });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Live preview — first on mobile, right column on desktop */}
            <div className="order-first lg:sticky lg:top-24 lg:order-last">
                <LivePreview
                    team={selectedTeam}
                    scheduledAt={data.scheduled_at}
                    location={data.location}
                    matchType={data.match_type}
                />
            </div>

            {/* Wizard */}
            <div className="rounded-2xl border border-border bg-card">
                <ProgressHeader step={step} />

                <div className="p-5 sm:p-6">
                    <div
                        key={step}
                        className="animate-in duration-300 fade-in motion-reduce:animate-none"
                    >
                        {step === 0 && (
                            <StepEquipo
                                teams={teams}
                                teamId={data.team_id}
                                onTeam={(id) => setData('team_id', id)}
                                error={errors.team_id}
                            />
                        )}
                        {step === 1 && (
                            <StepCuandoDonde
                                presets={datePresets}
                                date={date}
                                time={time}
                                minDate={today}
                                onDate={(d) => applySchedule(d, time)}
                                onTime={(t) => applySchedule(date, t)}
                                location={data.location}
                                onLocation={(v) => setData('location', v)}
                                scheduleError={errors.scheduled_at}
                                locationError={errors.location}
                            />
                        )}
                        {step === 2 && (
                            <StepDetalles
                                matchType={data.match_type}
                                onMatchType={(v) => setData('match_type', v)}
                                notes={data.notes}
                                onNotes={(v) => setData('notes', v)}
                                notesError={errors.notes}
                                teamName={selectedTeam?.name ?? '—'}
                                scheduledAt={data.scheduled_at}
                                location={data.location}
                            />
                        )}
                    </div>

                    {/* Nav */}
                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-border pt-5">
                        {step > 0 ? (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={back}
                                disabled={processing}
                            >
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Atrás
                            </Button>
                        ) : (
                            <span />
                        )}

                        {step < STEPS.length - 1 ? (
                            <Button
                                type="button"
                                onClick={next}
                                disabled={
                                    (step === 0 && !step1Valid) ||
                                    (step === 1 && !step2Valid)
                                }
                            >
                                Continuar
                                <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={submit}
                                disabled={
                                    processing || !step1Valid || !step2Valid
                                }
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                        Publicando…
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-1.5 h-4 w-4" />
                                        Publicar Partido
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProgressHeader({ step }: { step: number }) {
    return (
        <div className="border-b border-border p-5 sm:p-6">
            <p className="font-display text-xs font-bold tracking-[0.18em] text-primary uppercase">
                Paso {step + 1} de {STEPS.length}
            </p>
            <div className="mt-3 flex items-center gap-2">
                {STEPS.map((label, i) => (
                    <div key={label} className="flex flex-1 flex-col gap-1.5">
                        <div
                            className={cn(
                                'h-1.5 rounded-full transition-colors duration-500',
                                i <= step ? 'bg-primary' : 'bg-muted',
                            )}
                        />
                        <span
                            className={cn(
                                'text-xs font-medium transition-colors',
                                i === step
                                    ? 'text-foreground'
                                    : 'text-muted-foreground',
                            )}
                        >
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StepEquipo({
    teams,
    teamId,
    onTeam,
    error,
}: {
    teams: Team[];
    teamId: string;
    onTeam: (id: string) => void;
    error?: string;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">
                    ¿Qué equipo va a jugar?
                </h2>
                <p className="text-sm text-muted-foreground">
                    Publicás el partido como anfitrión. La modalidad la define
                    tu equipo.
                </p>
            </div>

            <div
                role="radiogroup"
                aria-label="Equipo anfitrión"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
                {teams.map((team) => {
                    const selected = team.id.toString() === teamId;
                    return (
                        <button
                            key={team.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onTeam(team.id.toString())}
                            className={cn(
                                'group relative flex items-center gap-3 rounded-xl border p-4 text-left ring-ring transition-all outline-none focus-visible:ring-2',
                                selected
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                                    : 'border-border bg-card hover:border-primary/30 hover:bg-accent/40',
                            )}
                        >
                            <TeamAvatar
                                name={team.name}
                                logoUrl={team.logo_url}
                                size="md"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">
                                    {team.name}
                                </p>
                                <div className="mt-1">
                                    <VariantBadge variant={team.variant} />
                                </div>
                            </div>
                            <span
                                className={cn(
                                    'flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                                    selected
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border',
                                )}
                            >
                                {selected && <Check className="size-3.5" />}
                            </span>
                        </button>
                    );
                })}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function StepCuandoDonde({
    presets,
    date,
    time,
    minDate,
    onDate,
    onTime,
    location,
    onLocation,
    scheduleError,
    locationError,
}: {
    presets: { label: string; value: string }[];
    date: string;
    time: string;
    minDate: string;
    onDate: (v: string) => void;
    onTime: (v: string) => void;
    location: string;
    onLocation: (v: string) => void;
    scheduleError?: string;
    locationError?: string;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">¿Cuándo y dónde?</h2>
                <p className="text-sm text-muted-foreground">
                    Elegí el día, la hora y la cancha.
                </p>
            </div>

            {/* Date */}
            <div className="space-y-2">
                <Label>
                    Fecha <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                    {presets.map((preset) => {
                        const active = preset.value === date;
                        return (
                            <button
                                key={preset.label}
                                type="button"
                                onClick={() => onDate(preset.value)}
                                aria-pressed={active}
                                className={cn(
                                    'rounded-full border px-3.5 py-1.5 text-sm font-medium ring-ring transition-colors outline-none focus-visible:ring-2',
                                    active
                                        ? 'border-primary bg-primary/12 text-primary ring-1 ring-primary/25'
                                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                                )}
                            >
                                {preset.label}
                            </button>
                        );
                    })}
                </div>
                <Input
                    type="date"
                    value={date}
                    min={minDate}
                    onChange={(e) => onDate(e.target.value)}
                    className="mt-1"
                    aria-label="Elegir otra fecha"
                />
            </div>

            {/* Time */}
            <div className="space-y-2">
                <Label htmlFor="time">
                    Hora <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => onTime(e.target.value)}
                    className="w-40"
                />
                {scheduleError && (
                    <p className="text-sm text-destructive">{scheduleError}</p>
                )}
            </div>

            {/* Location */}
            <div className="space-y-2">
                <Label htmlFor="location">
                    Ubicación <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="location"
                    value={location}
                    onChange={(e) => onLocation(e.target.value)}
                    placeholder="Ej: Complejo El Estadio, cancha 3"
                    maxLength={255}
                />
                {locationError && (
                    <p className="text-sm text-destructive">{locationError}</p>
                )}
            </div>
        </div>
    );
}

function StepDetalles({
    matchType,
    onMatchType,
    notes,
    onNotes,
    notesError,
    teamName,
    scheduledAt,
    location,
}: {
    matchType: string;
    onMatchType: (v: string) => void;
    notes: string;
    onNotes: (v: string) => void;
    notesError?: string;
    teamName: string;
    scheduledAt: string;
    location: string;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Detalles del partido</h2>
                <p className="text-sm text-muted-foreground">
                    ¿Qué se juega? Sumá una nota si querés.
                </p>
            </div>

            {/* Match type */}
            <div
                role="radiogroup"
                aria-label="Tipo de partido"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
                {MATCH_TYPES.map((type) => {
                    const selected = type.value === matchType;
                    const Icon = type.icon;
                    return (
                        <button
                            key={type.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onMatchType(type.value)}
                            className={cn(
                                'group rounded-xl border p-4 text-left ring-ring transition-all outline-none focus-visible:ring-2',
                                selected
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                                    : 'border-border bg-card hover:border-primary/30 hover:bg-accent/40',
                            )}
                        >
                            <div
                                className={cn(
                                    'flex size-10 items-center justify-center rounded-lg transition-colors',
                                    selected
                                        ? 'bg-primary/15 text-primary'
                                        : 'bg-muted text-muted-foreground group-hover:text-foreground',
                                )}
                            >
                                <Icon className="size-5" />
                            </div>
                            <p className="mt-3 font-semibold">{type.label}</p>
                            <p className="text-xs text-muted-foreground">
                                {type.blurb}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => onNotes(e.target.value)}
                    placeholder="Nivel, reglas, si hay que llevar pechera…"
                    rows={3}
                    maxLength={1000}
                />
                <div className="flex justify-between">
                    {notesError ? (
                        <p className="text-sm text-destructive">{notesError}</p>
                    ) : (
                        <span />
                    )}
                    <span className="text-xs text-muted-foreground">
                        {notes.length}/1000
                    </span>
                </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="font-display text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Resumen
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                    <SummaryRow label="Equipo" value={teamName} />
                    <SummaryRow
                        label="Cuándo"
                        value={
                            scheduledAt
                                ? `${formatDate(scheduledAt, {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                  })} · ${formatTime(scheduledAt)}`
                                : '—'
                        }
                    />
                    <SummaryRow label="Dónde" value={location || '—'} />
                </dl>
            </div>
        </div>
    );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="truncate font-medium">{value}</dd>
        </div>
    );
}

function LivePreview({
    team,
    scheduledAt,
    location,
    matchType,
}: {
    team?: Team;
    scheduledAt: string;
    location: string;
    matchType: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div
                aria-hidden
                className="bg-pitch-glow pointer-events-none absolute inset-0"
            />
            <div className="relative p-6">
                <p className="font-display text-xs font-bold tracking-[0.18em] text-primary uppercase">
                    Vista previa
                </p>

                {/* Matchup */}
                <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="flex flex-1 flex-col items-center gap-2">
                        <TeamAvatar
                            name={team?.name ?? 'Tu equipo'}
                            logoUrl={team?.logo_url}
                            size="xl"
                        />
                        <p className="line-clamp-2 text-center text-sm font-bold">
                            {team?.name ?? 'Tu equipo'}
                        </p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xl font-bold text-muted-foreground">
                            vs
                        </span>
                        {team && <VariantBadge variant={team.variant} />}
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-2">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                            <span className="text-lg text-muted-foreground/50">
                                ?
                            </span>
                        </div>
                        <p className="text-center text-sm text-muted-foreground">
                            Buscando rival
                        </p>
                    </div>
                </div>

                {/* Details */}
                <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {scheduledAt
                                ? formatDate(scheduledAt, {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                  })
                                : 'Por programar'}
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {scheduledAt ? formatTime(scheduledAt) : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-muted-foreground">
                        <span className="flex min-w-0 items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1">
                                {location.trim() || 'Por definir'}
                            </span>
                        </span>
                        <span className="flex shrink-0 items-center gap-2">
                            <Users className="h-4 w-4" />
                            {matchType === 'friendly'
                                ? 'Amistoso'
                                : 'Competitivo'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
