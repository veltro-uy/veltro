import AppLogoIcon from '@/components/app-logo-icon';
import LandingFooter from '@/components/landing-footer';
import {
    LandingAvailabilityPreview,
    LandingMatchPreview,
    LandingTournamentPreview,
} from '@/components/landing/previews';
import { Button } from '@/components/ui/button';
import { useReveal } from '@/hooks/use-reveal';
import { home, login, register } from '@/routes';
import teams from '@/routes/teams';
import type { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BellRing,
    CalendarDays,
    CreditCard,
    Eye,
    MapPin,
    ShieldCheck,
    Sparkles,
    Trophy,
    Users,
} from 'lucide-react';
import type { CSSProperties, ElementType, ReactNode } from 'react';

const PitchLines = () => (
    <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-foreground"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.04 }}
    >
        <g fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="90" y="70" width="1020" height="560" rx="8" />
            <line x1="600" y1="70" x2="600" y2="630" />
            <circle cx="600" cy="350" r="96" />
            <circle cx="600" cy="350" r="4" fill="currentColor" stroke="none" />
            <rect x="90" y="215" width="164" height="270" rx="4" />
            <rect x="946" y="215" width="164" height="270" rx="4" />
            <rect x="90" y="285" width="56" height="130" rx="3" />
            <rect x="1054" y="285" width="56" height="130" rx="3" />
        </g>
    </svg>
);

/** Atmospheric backdrop: brand glow + pitch motif + film grain. */
const Decor = () => (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-pitch-glow absolute inset-0" />
        <PitchLines />
        <div className="bg-grain absolute inset-0 opacity-[0.035] mix-blend-soft-light" />
    </div>
);

const Eyebrow = ({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) => (
    <span
        className={`inline-flex items-center gap-2 text-xs font-semibold tracking-[0.22em] text-primary uppercase ${className}`}
    >
        <span className="h-px w-6 bg-primary/50" />
        {children}
    </span>
);

const FeatureIcon = ({
    icon: Icon,
    label,
}: {
    icon: ElementType;
    label: string;
}) => (
    <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {label}
        </span>
    </div>
);

const valueProps = [
    { icon: Sparkles, title: 'Sin publicidad', detail: 'Una interfaz limpia' },
    { icon: CreditCard, title: 'Gratis', detail: 'Sin tarjeta de crédito' },
    { icon: Trophy, title: 'Fútbol 11 · 7 · 5', detail: 'Y futsal' },
    {
        icon: MapPin,
        title: 'Hecho en Uruguay',
        detail: 'Para el fútbol de acá',
    },
];

const features = [
    {
        icon: CalendarDays,
        label: 'Partidos',
        title: 'Organizá partidos sin perseguir mensajes',
        description:
            'Centralizá fecha, cancha, rival, formato y marcador en una vista clara para todo el plantel.',
        preview: <LandingMatchPreview />,
        className: 'lg:col-span-7',
    },
    {
        icon: Users,
        label: 'Disponibilidad',
        title: 'Confirmaciones visibles antes de llegar a la cancha',
        description:
            'Sabé quién va, quién falta responder y cuándo necesitás mover suplentes.',
        preview: <LandingAvailabilityPreview />,
        className: 'lg:col-span-5',
    },
    {
        icon: BellRing,
        label: 'Recordatorios',
        title: 'Menos ruido, más respuestas',
        description:
            'Recordatorios puntuales para quienes todavía no confirmaron asistencia al próximo partido.',
        preview: (
            <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <BellRing className="h-4 w-4" />
                    </span>
                    <div>
                        <span className="block text-sm font-medium text-foreground">
                            Partido mañana
                        </span>
                        <span className="text-xs text-muted-foreground">
                            3 jugadores pendientes
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {['Voy', 'Tal vez', 'No voy'].map((item, index) => (
                        <span
                            key={item}
                            className={`rounded-md border px-3 py-2 text-center text-xs font-semibold ${
                                index === 0
                                    ? 'border-primary/30 bg-primary/10 text-primary'
                                    : 'border-border bg-white/[0.035] text-muted-foreground'
                            }`}
                        >
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        ),
        className: 'lg:col-span-5',
    },
    {
        icon: Trophy,
        label: 'Torneos',
        title: 'Competí con estructura de torneo real',
        description:
            'Inscribí equipos, seguí cupos disponibles y mantené el calendario competitivo ordenado.',
        preview: <LandingTournamentPreview />,
        className: 'lg:col-span-7',
    },
];

const steps = [
    {
        step: '01',
        icon: Users,
        title: 'Armá tu equipo',
        description:
            'Creá el plantel, invitá jugadores y definí roles de gestión.',
    },
    {
        step: '02',
        icon: CalendarDays,
        title: 'Programá el partido',
        description:
            'Publicá fecha, cancha y rival para que todos confirmen desde el celular.',
    },
    {
        step: '03',
        icon: Trophy,
        title: 'Jugá y registrá',
        description:
            'Cargá resultados, goles y datos útiles para seguir la evolución del equipo.',
    },
];

/** Inline transition-delay helper for staggered reveals. */
const stagger = (index: number): CSSProperties => ({
    transitionDelay: `${index * 90}ms`,
});

export default function LandingPage({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth?.user;
    const revealRef = useReveal<HTMLDivElement>();

    const primaryCtaClasses =
        'h-12 rounded-md bg-primary px-6 text-base font-semibold text-primary-foreground shadow-[0_14px_40px_-8px_rgba(72,209,122,0.5)] transition-transform hover:-translate-y-0.5 hover:bg-primary/90';

    const primaryCta = isLoggedIn ? (
        <Button size="lg" className={primaryCtaClasses} asChild>
            <Link href={teams.index().url}>
                Ver equipos
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
    ) : (
        canRegister && (
            <Button size="lg" className={primaryCtaClasses} asChild>
                <Link href={register().url}>
                    Comenzar gratis
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        )
    );

    const ctaButtons = (
        <>
            {primaryCta}
            {!isLoggedIn && (
                <Button
                    size="lg"
                    variant="outline"
                    className="h-12 rounded-md border-border bg-white/[0.03] px-6 text-base text-foreground hover:bg-white/[0.07] hover:text-foreground"
                    asChild
                >
                    <Link href={login().url}>Iniciar sesión</Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <Head>
                <title>
                    Veltro - Plataforma para equipos de futbol amateur en
                    Uruguay
                </title>
                <meta
                    name="description"
                    content="Gestiona tu equipo, organiza partidos, confirma asistencia y conecta con otros equipos de futbol amateur en Uruguay."
                />
            </Head>

            <div
                ref={revealRef}
                className="min-h-screen bg-background text-foreground"
            >
                <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
                        <Link
                            href={home().url}
                            className="flex items-center gap-2.5"
                        >
                            <AppLogoIcon className="size-7 text-primary" />
                            <span className="text-display text-xl tracking-wide text-foreground">
                                Veltro
                            </span>
                        </Link>

                        <nav className="flex items-center gap-2">
                            {isLoggedIn ? (
                                <Button
                                    size="sm"
                                    className="h-9 rounded-md bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary/90"
                                    asChild
                                >
                                    <Link href={teams.index().url}>
                                        Ver equipos
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="hidden h-9 rounded-md px-3 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground sm:inline-flex"
                                        asChild
                                    >
                                        <Link href={login().url}>
                                            Iniciar sesión
                                        </Link>
                                    </Button>
                                    {canRegister && (
                                        <Button
                                            size="sm"
                                            className="h-9 rounded-md bg-primary px-3 font-semibold text-primary-foreground hover:bg-primary/90"
                                            asChild
                                        >
                                            <Link href={register().url}>
                                                Registrarse
                                            </Link>
                                        </Button>
                                    )}
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main>
                    {/* Hero */}
                    <section className="relative overflow-hidden border-b border-border">
                        <Decor />
                        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 py-20 md:px-6 md:py-28 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
                            <div className="max-w-2xl text-center lg:text-left">
                                <div className="reveal mb-7 flex justify-center lg:justify-start">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-accent-foreground">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Hecho en Uruguay para capitanes amateur
                                    </span>
                                </div>

                                <h1 className="text-display text-5xl text-foreground sm:text-7xl lg:text-[5.5rem]">
                                    <span
                                        className="reveal block"
                                        style={stagger(1)}
                                    >
                                        La casa del
                                    </span>
                                    <span
                                        className="reveal block text-primary"
                                        style={stagger(2)}
                                    >
                                        fútbol amateur
                                        <span className="text-muted-foreground">
                                            :
                                        </span>
                                    </span>
                                    <span
                                        className="reveal block text-balance text-muted-foreground"
                                        style={stagger(3)}
                                    >
                                        todo en un solo lugar
                                    </span>
                                </h1>

                                <p
                                    className="reveal mx-auto mt-7 max-w-xl text-base leading-7 text-pretty text-muted-foreground sm:text-lg lg:mx-0"
                                    style={stagger(4)}
                                >
                                    Veltro reúne partidos, disponibilidad,
                                    estadísticas y torneos en una experiencia
                                    simple para capitanes y clara para
                                    jugadores.
                                </p>

                                <div
                                    className="reveal mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
                                    style={stagger(5)}
                                >
                                    {ctaButtons}
                                </div>
                            </div>

                            <div
                                className="reveal relative mx-auto w-full max-w-[480px] lg:mx-0"
                                style={stagger(3)}
                            >
                                <div className="rounded-xl border border-border bg-card p-3 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.7)]">
                                    <LandingMatchPreview />
                                </div>

                                {/* Floating stat chips overlapping the card edges. */}
                                <div className="absolute -top-5 -right-3 hidden rotate-[2deg] rounded-lg border border-primary/20 bg-card/95 px-4 py-3 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur sm:block">
                                    <span className="text-display block text-3xl text-primary">
                                        9/11
                                    </span>
                                    <span className="text-[11px] text-muted-foreground">
                                        confirmados
                                    </span>
                                </div>
                                <div className="absolute -bottom-6 -left-4 hidden -rotate-[2deg] items-center gap-2.5 rounded-lg border border-border bg-card/95 px-4 py-3 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.6)] backdrop-blur sm:flex">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <BellRing className="h-4 w-4" />
                                    </span>
                                    <div className="leading-tight">
                                        <span className="block text-xs font-semibold text-foreground">
                                            Recordatorio enviado
                                        </span>
                                        <span className="text-[11px] text-muted-foreground">
                                            a 3 pendientes
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Value props band */}
                    <section className="border-b border-border bg-secondary/30">
                        <div className="mx-auto grid max-w-7xl divide-y divide-border px-4 sm:grid-cols-2 sm:divide-y-0 md:px-6 lg:grid-cols-4 lg:divide-x">
                            {valueProps.map(
                                ({ icon: Icon, title, detail }, index) => (
                                    <div
                                        key={title}
                                        className="reveal flex items-center gap-3.5 py-6 lg:px-7"
                                        style={stagger(index)}
                                    >
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/[0.07] text-primary">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <div className="leading-tight">
                                            <span className="block text-sm font-semibold text-foreground">
                                                {title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {detail}
                                            </span>
                                        </div>
                                    </div>
                                ),
                            )}
                        </div>
                    </section>

                    {/* Features */}
                    <section className="py-20 md:py-28">
                        <div className="mx-auto max-w-7xl px-4 md:px-6">
                            <div className="mb-14 grid gap-5 lg:grid-cols-[0.78fr_1fr] lg:items-end">
                                <div className="reveal">
                                    <Eyebrow>Qué podés hacer</Eyebrow>
                                    <h2 className="text-display mt-5 max-w-xl text-4xl text-foreground sm:text-5xl">
                                        Una plataforma ordenada para cada semana
                                        de partido
                                    </h2>
                                </div>
                                <p
                                    className="reveal max-w-2xl text-base leading-7 text-muted-foreground lg:justify-self-end"
                                    style={stagger(1)}
                                >
                                    Diseñada para reducir fricción operativa:
                                    menos mensajes repetidos, menos dudas de
                                    asistencia y mejor trazabilidad del equipo.
                                </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-12">
                                {features.map(
                                    (
                                        {
                                            icon,
                                            label,
                                            title,
                                            description,
                                            preview,
                                            className,
                                        },
                                        index,
                                    ) => (
                                        <div
                                            key={title}
                                            className={`reveal group flex h-full flex-col rounded-xl border border-border bg-card p-6 shadow-[0_18px_70px_-30px_rgba(0,0,0,0.5)] transition-colors hover:border-primary/25 ${className}`}
                                            style={stagger(index)}
                                        >
                                            <FeatureIcon
                                                icon={icon}
                                                label={label}
                                            />
                                            <div className="grid flex-1 gap-6 md:grid-cols-[0.86fr_1.14fr] md:items-center">
                                                <div>
                                                    <h3 className="text-xl leading-snug font-semibold text-foreground">
                                                        {title}
                                                    </h3>
                                                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                                                        {description}
                                                    </p>
                                                </div>
                                                <div className="min-w-0 transition-transform duration-500 group-hover:-translate-y-1">
                                                    {preview}
                                                </div>
                                            </div>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>

                    {/* How it works */}
                    <section className="relative overflow-hidden border-y border-border bg-secondary/30 py-20 md:py-24">
                        <div className="mx-auto max-w-7xl px-4 md:px-6">
                            <div className="reveal mb-14 max-w-2xl">
                                <Eyebrow>Cómo funciona</Eyebrow>
                                <h2 className="text-display mt-5 text-4xl text-foreground sm:text-5xl">
                                    De crear el equipo a jugar en minutos
                                </h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                {steps.map(
                                    (
                                        {
                                            step,
                                            icon: Icon,
                                            title,
                                            description,
                                        },
                                        index,
                                    ) => (
                                        <div
                                            key={step}
                                            className="reveal relative overflow-hidden rounded-xl border border-border bg-background p-7"
                                            style={stagger(index)}
                                        >
                                            <span
                                                aria-hidden="true"
                                                className="text-display pointer-events-none absolute -top-6 -right-2 text-[7rem] leading-none text-foreground/[0.05]"
                                            >
                                                {step}
                                            </span>
                                            <span className="relative flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <h3 className="relative mt-7 text-xl font-semibold text-foreground">
                                                {title}
                                            </h3>
                                            <p className="relative mt-3 text-sm leading-6 text-muted-foreground">
                                                {description}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Final CTA */}
                    <section className="relative overflow-hidden py-24 md:py-32">
                        <Decor />
                        <div className="reveal relative mx-auto max-w-4xl px-4 text-center md:px-6">
                            <Eyebrow className="justify-center">
                                Empezá hoy
                            </Eyebrow>
                            <h2 className="text-display mx-auto mt-6 max-w-3xl text-5xl text-foreground sm:text-6xl md:text-7xl">
                                Ordená el próximo partido antes de que empiece
                                la semana
                            </h2>
                            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                                Gratis, sin publicidad y preparado para la forma
                                en que se organiza el fútbol amateur en Uruguay.
                            </p>
                            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                {ctaButtons}
                            </div>
                            {!isLoggedIn && (
                                <p className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground">
                                    <Eye className="h-3.5 w-3.5" />
                                    Explorá la plataforma sin compromiso
                                </p>
                            )}
                        </div>
                    </section>
                </main>

                <LandingFooter canRegister={canRegister} />
            </div>
        </>
    );
}
