import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VariantBadge } from '@/components/variant-badge';
import { cn } from '@/lib/utils';
import { DEFAULT_VARIANT, VARIANTS } from '@/lib/variants';
import teams from '@/routes/teams';
import { router } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    ImagePlus,
    Loader2,
    Trophy,
    Upload,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const STEPS = ['Identidad', 'Variante', 'Detalles'] as const;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE = 2048 * 1024; // 2MB

export function CreateTeamWizard() {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [variant, setVariant] = useState(DEFAULT_VARIANT);
    const [description, setDescription] = useState('');
    const [logo, setLogo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const selectedVariant =
        VARIANTS.find((v) => v.value === variant) ?? VARIANTS[0];
    const nameValid = name.trim().length > 0;

    const handleLogoSelect = (file: File | undefined) => {
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error('Elegí una imagen válida (JPG, PNG o WEBP)');
            return;
        }
        if (file.size > MAX_SIZE) {
            toast.error('La imagen no debe superar los 2MB');
            return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setLogo(file);
        setPreviewUrl(URL.createObjectURL(file));
        setErrors((prev) => ({ ...prev, logo: '' }));
    };

    const removeLogo = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setLogo(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
    const back = () => setStep((s) => Math.max(s - 1, 0));

    const submit = () => {
        setProcessing(true);
        setErrors({});

        const data = new FormData();
        data.append('name', name);
        data.append('variant', variant);
        data.append('description', description);
        if (logo) data.append('logo', logo);

        router.post(teams.store().url, data, {
            forceFormData: true,
            // On success the request redirects to the team page, which surfaces
            // the flash success toast — no toast needed here.
            onError: (errs) => {
                setProcessing(false);
                const mapped = errs as Record<string, string>;
                setErrors(mapped);
                if (mapped.name || mapped.logo) setStep(0);
                else if (mapped.description) setStep(2);
                toast.error(
                    mapped.name ||
                        mapped.logo ||
                        mapped.description ||
                        'No pudimos crear el equipo',
                );
            },
        });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
            {/* Live preview — first on mobile, right column on desktop */}
            <div className="order-first lg:sticky lg:top-24 lg:order-last">
                <LivePreview
                    name={name}
                    variant={variant}
                    description={description}
                    previewUrl={previewUrl}
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
                            <StepIdentidad
                                name={name}
                                onName={setName}
                                previewUrl={previewUrl}
                                logo={logo}
                                onPick={() => fileInputRef.current?.click()}
                                onRemove={removeLogo}
                                onDropFile={handleLogoSelect}
                                nameError={errors.name}
                                logoError={errors.logo}
                            />
                        )}
                        {step === 1 && (
                            <StepVariante
                                variant={variant}
                                onVariant={setVariant}
                            />
                        )}
                        {step === 2 && (
                            <StepDetalles
                                description={description}
                                onDescription={setDescription}
                                descriptionError={errors.description}
                                name={name}
                                selectedVariantLabel={selectedVariant.label}
                                hasLogo={!!logo}
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
                                disabled={step === 0 && !nameValid}
                            >
                                Continuar
                                <ArrowRight className="ml-1.5 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                onClick={submit}
                                disabled={processing || !nameValid}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                        Creando…
                                    </>
                                ) : (
                                    <>
                                        <Check className="mr-1.5 h-4 w-4" />
                                        Crear Equipo
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleLogoSelect(e.target.files?.[0])}
                />
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

function StepIdentidad({
    name,
    onName,
    previewUrl,
    logo,
    onPick,
    onRemove,
    onDropFile,
    nameError,
    logoError,
}: {
    name: string;
    onName: (v: string) => void;
    previewUrl: string | null;
    logo: File | null;
    onPick: () => void;
    onRemove: () => void;
    onDropFile: (file: File | undefined) => void;
    nameError?: string;
    logoError?: string;
}) {
    const [dragging, setDragging] = useState(false);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">
                    Dale identidad a tu equipo
                </h2>
                <p className="text-sm text-muted-foreground">
                    Un buen nombre y un escudo hacen la diferencia.
                </p>
            </div>

            {/* Crest dropzone */}
            <div className="space-y-2">
                <Label>Escudo del equipo</Label>
                <div
                    onDragOver={(e) => {
                        e.preventDefault();
                        setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                        e.preventDefault();
                        setDragging(false);
                        onDropFile(e.dataTransfer.files?.[0]);
                    }}
                    className={cn(
                        'flex items-center gap-4 rounded-xl border border-dashed p-4 transition-colors',
                        dragging
                            ? 'border-primary bg-primary/5'
                            : 'border-border bg-muted/20',
                    )}
                >
                    <TeamAvatar
                        name={name || 'Tu equipo'}
                        logoUrl={previewUrl ?? undefined}
                        size="xl"
                    />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={onPick}
                            >
                                {logo ? (
                                    <Upload className="mr-1.5 h-4 w-4" />
                                ) : (
                                    <ImagePlus className="mr-1.5 h-4 w-4" />
                                )}
                                {logo ? 'Cambiar' : 'Subir escudo'}
                            </Button>
                            {logo && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onRemove}
                                >
                                    <X className="mr-1.5 h-4 w-4" />
                                    Quitar
                                </Button>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            Arrastrá una imagen o hacé clic. JPG, PNG o WEBP ·
                            máx. 2MB · opcional.
                        </p>
                    </div>
                </div>
                {logoError && (
                    <p className="text-sm text-destructive">{logoError}</p>
                )}
            </div>

            {/* Name */}
            <div className="space-y-2">
                <Label htmlFor="name">
                    Nombre del equipo{' '}
                    <span className="text-destructive">*</span>
                </Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onName(e.target.value)}
                    placeholder="Ej: Los Tigres FC"
                    autoFocus
                    maxLength={255}
                />
                {nameError && (
                    <p className="text-sm text-destructive">{nameError}</p>
                )}
            </div>
        </div>
    );
}

function StepVariante({
    variant,
    onVariant,
}: {
    variant: string;
    onVariant: (v: string) => void;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">
                    ¿Qué se juega tu equipo?
                </h2>
                <p className="text-sm text-muted-foreground">
                    Elegí la modalidad. Define el cupo de jugadores.
                </p>
            </div>

            <div
                role="radiogroup"
                aria-label="Variante de fútbol"
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
                {VARIANTS.map((v) => {
                    const selected = v.value === variant;
                    return (
                        <button
                            key={v.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onVariant(v.value)}
                            className={cn(
                                'group relative rounded-xl border p-4 text-left ring-ring transition-all outline-none focus-visible:ring-2',
                                selected
                                    ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                                    : 'border-border bg-card hover:border-primary/30 hover:bg-accent/40',
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div
                                    className={cn(
                                        'flex size-10 items-center justify-center rounded-lg transition-colors',
                                        selected
                                            ? 'bg-primary/15 text-primary'
                                            : 'bg-muted text-muted-foreground group-hover:text-foreground',
                                    )}
                                >
                                    <Trophy className="size-5" />
                                </div>
                                <span
                                    className={cn(
                                        'flex size-5 items-center justify-center rounded-full border transition-colors',
                                        selected
                                            ? 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border',
                                    )}
                                >
                                    {selected && <Check className="size-3.5" />}
                                </span>
                            </div>
                            <p className="font-display mt-3 text-lg font-bold tracking-wide uppercase">
                                {v.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {v.blurb}
                            </p>
                            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Users className="size-3.5" />
                                    {v.playersOnPitch} en cancha
                                </span>
                                <span className="text-border">·</span>
                                <span>{v.maxMembers} cupos</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function StepDetalles({
    description,
    onDescription,
    descriptionError,
    name,
    selectedVariantLabel,
    hasLogo,
}: {
    description: string;
    onDescription: (v: string) => void;
    descriptionError?: string;
    name: string;
    selectedVariantLabel: string;
    hasLogo: boolean;
}) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Últimos detalles</h2>
                <p className="text-sm text-muted-foreground">
                    Contales a otros de qué se trata tu equipo. Es opcional.
                </p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onDescription(e.target.value)}
                    placeholder="Cuéntanos sobre tu equipo, su estilo, su historia…"
                    rows={4}
                    maxLength={1000}
                />
                <div className="flex justify-between">
                    {descriptionError ? (
                        <p className="text-sm text-destructive">
                            {descriptionError}
                        </p>
                    ) : (
                        <span />
                    )}
                    <span className="text-xs text-muted-foreground">
                        {description.length}/1000
                    </span>
                </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="font-display text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">
                    Resumen
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                    <SummaryRow label="Nombre" value={name || '—'} />
                    <SummaryRow
                        label="Modalidad"
                        value={selectedVariantLabel}
                    />
                    <SummaryRow
                        label="Escudo"
                        value={hasLogo ? 'Cargado' : 'Sin escudo'}
                    />
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
    name,
    variant,
    description,
    previewUrl,
}: {
    name: string;
    variant: string;
    description: string;
    previewUrl: string | null;
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
                <div className="mt-5 flex flex-col items-center text-center">
                    <TeamAvatar
                        name={name || 'Tu equipo'}
                        logoUrl={previewUrl ?? undefined}
                        size="2xl"
                        className="ring-2 ring-primary/20"
                    />
                    <h3 className="mt-4 text-xl font-bold tracking-tight">
                        {name.trim() || 'Tu equipo'}
                    </h3>
                    <div className="mt-2">
                        <VariantBadge variant={variant} />
                    </div>
                    {description.trim() && (
                        <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
