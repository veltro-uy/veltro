import AppLogoIcon from '@/components/app-logo-icon';
import LandingFooter from '@/components/landing-footer';
import {
    LandingAvailabilityPreview,
    LandingMatchPreview,
    LandingTournamentPreview,
} from '@/components/landing/previews';
import { Button } from '@/components/ui/button';
import { home, login, register } from '@/routes';
import teams from '@/routes/teams';
import type { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    BellRing,
    CalendarDays,
    CheckCircle2,
    ShieldCheck,
    Trophy,
    Users,
} from 'lucide-react';
import type { ElementType, ReactNode } from 'react';

const accent = '#48d17a';

const PitchLines = () => (
    <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.045 }}
    >
        <g fill="none" stroke="white" strokeWidth="1.4">
            <rect x="90" y="70" width="1020" height="560" rx="8" />
            <line x1="600" y1="70" x2="600" y2="630" />
            <circle cx="600" cy="350" r="96" />
            <circle cx="600" cy="350" r="4" fill="white" stroke="none" />
            <rect x="90" y="215" width="164" height="270" rx="4" />
            <rect x="946" y="215" width="164" height="270" rx="4" />
            <rect x="90" y="285" width="56" height="130" rx="3" />
            <rect x="1054" y="285" width="56" height="130" rx="3" />
        </g>
    </svg>
);

const SectionLabel = ({ children }: { children: ReactNode }) => (
    <span className="text-xs font-semibold tracking-[0.18em] text-[#48d17a] uppercase">
        {children}
    </span>
);

const ProductCard = ({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) => (
    <div
        className={`flex h-full flex-col rounded-lg border border-white/[0.08] bg-[#171b19] p-6 shadow-[0_18px_70px_rgba(0,0,0,0.28)] ${className}`}
    >
        {children}
    </div>
);

const FeatureIcon = ({
    icon: Icon,
    label,
}: {
    icon: ElementType;
    label: string;
}) => (
    <div className="mb-5 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#48d17a]/20 bg-[#48d17a]/10 text-[#48d17a]">
            <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold tracking-[0.16em] text-white/40 uppercase">
            {label}
        </span>
    </div>
);

const stats = [
    { value: '500+', label: 'Partidos organizados' },
    { value: '80+', label: 'Equipos registrados' },
    { value: '1.200+', label: 'Jugadores activos' },
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
            <div className="space-y-3 rounded-lg border border-white/[0.08] bg-[#101312] p-4">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#48d17a]/10 text-[#48d17a]">
                        <BellRing className="h-4 w-4" />
                    </span>
                    <div>
                        <span className="block text-sm font-medium text-white">
                            Partido mañana
                        </span>
                        <span className="text-xs text-white/45">
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
                                    ? 'border-[#48d17a]/30 bg-[#48d17a]/10 text-[#48d17a]'
                                    : 'border-white/[0.08] bg-white/[0.035] text-white/50'
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

export default function LandingPage({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth?.user;

    const primaryCta = isLoggedIn ? (
        <Button
            size="lg"
            className="h-11 rounded-md bg-[#48d17a] px-5 font-semibold text-[#07110b] shadow-[0_12px_34px_rgba(72,209,122,0.22)] hover:bg-[#60df8b]"
            asChild
        >
            <Link href={teams.index().url}>
                Ver equipos
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
    ) : (
        canRegister && (
            <Button
                size="lg"
                className="h-11 rounded-md bg-[#48d17a] px-5 font-semibold text-[#07110b] shadow-[0_12px_34px_rgba(72,209,122,0.22)] hover:bg-[#60df8b]"
                asChild
            >
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
                    className="h-11 rounded-md border-white/15 bg-white/[0.03] px-5 text-white hover:bg-white/[0.07] hover:text-white"
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

            <div className="min-h-screen bg-[#101312] text-white">
                <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#101312]/90 backdrop-blur-xl">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
                        <Link
                            href={home().url}
                            className="flex items-center gap-3"
                        >
                            <AppLogoIcon className="size-7 text-primary" />
                            <span className="text-sm font-semibold tracking-wide text-white">
                                Veltro
                            </span>
                        </Link>

                        <nav className="flex items-center gap-2">
                            {isLoggedIn ? (
                                <Button
                                    size="sm"
                                    className="h-9 rounded-md bg-[#48d17a] px-3 font-semibold text-[#07110b] hover:bg-[#60df8b]"
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
                                        className="hidden h-9 rounded-md px-3 text-white/60 hover:bg-white/[0.06] hover:text-white sm:inline-flex"
                                        asChild
                                    >
                                        <Link href={login().url}>
                                            Iniciar sesión
                                        </Link>
                                    </Button>
                                    {canRegister && (
                                        <Button
                                            size="sm"
                                            className="h-9 rounded-md bg-[#48d17a] px-3 font-semibold text-[#07110b] hover:bg-[#60df8b]"
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
                    <section className="relative overflow-hidden border-b border-white/[0.08] bg-[#101312]">
                        <PitchLines />
                        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-18 md:px-6 md:py-24 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
                            <div className="max-w-2xl text-center lg:text-left">
                                <div className="mb-6 flex justify-center lg:justify-start">
                                    <span className="inline-flex items-center gap-2 rounded-md border border-[#48d17a]/25 bg-[#48d17a]/10 px-3 py-1.5 text-xs font-semibold text-[#8df0ad]">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Hecho en Uruguay para capitanes amateur
                                    </span>
                                </div>

                                <h1 className="text-5xl leading-[0.98] font-semibold tracking-normal text-white sm:text-6xl lg:text-7xl">
                                    Gestioná tu equipo sin depender del grupo de
                                    WhatsApp.
                                </h1>

                                <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg lg:mx-0">
                                    Veltro reúne partidos, disponibilidad,
                                    estadísticas y torneos en una experiencia
                                    simple para capitanes y clara para
                                    jugadores.
                                </p>

                                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                                    {ctaButtons}
                                </div>

                                <div className="mt-8 grid gap-3 text-left text-sm text-white/55 sm:grid-cols-3">
                                    {[
                                        'Sin publicidad',
                                        'Sin tarjeta de crédito',
                                        'Fútbol 11, 7, 5 y futsal',
                                    ].map((text) => (
                                        <div
                                            key={text}
                                            className="flex items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.025] px-3 py-2"
                                        >
                                            <CheckCircle2
                                                className="h-4 w-4 shrink-0"
                                                style={{ color: accent }}
                                            />
                                            <span>{text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mx-auto w-full max-w-[520px] lg:mx-0">
                                <div className="rounded-lg border border-white/[0.08] bg-[#171b19] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.34)]">
                                    <LandingMatchPreview />
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-3">
                                    <div className="rounded-lg border border-white/[0.08] bg-[#171b19] p-4">
                                        <span className="block text-3xl font-semibold text-[#48d17a]">
                                            9/11
                                        </span>
                                        <span className="text-xs text-white/50">
                                            jugadores confirmados
                                        </span>
                                    </div>
                                    <div className="rounded-lg border border-white/[0.08] bg-[#171b19] p-4">
                                        <span className="block text-sm font-semibold text-white">
                                            Recordatorio enviado
                                        </span>
                                        <span className="text-xs text-white/50">
                                            a 3 jugadores pendientes
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-b border-white/[0.08] bg-[#141815] py-10">
                        <div className="mx-auto grid max-w-5xl gap-6 px-4 text-center sm:grid-cols-3 md:px-6">
                            {stats.map(({ value, label }) => (
                                <div
                                    key={label}
                                    className="rounded-lg border border-white/[0.08] bg-[#101312] px-5 py-6"
                                >
                                    <span className="block text-4xl font-semibold tracking-normal text-[#48d17a]">
                                        {value}
                                    </span>
                                    <span className="mt-2 block text-sm text-white/50">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="py-20 md:py-28">
                        <div className="mx-auto max-w-7xl px-4 md:px-6">
                            <div className="mb-12 grid gap-4 lg:grid-cols-[0.72fr_1fr] lg:items-end">
                                <div>
                                    <SectionLabel>Qué podés hacer</SectionLabel>
                                    <h2 className="mt-4 max-w-xl text-4xl leading-tight font-semibold sm:text-5xl">
                                        Una plataforma ordenada para cada semana
                                        de partido.
                                    </h2>
                                </div>
                                <p className="max-w-2xl text-base leading-7 text-white/55 lg:justify-self-end">
                                    Diseñada para reducir fricción operativa:
                                    menos mensajes repetidos, menos dudas de
                                    asistencia y mejor trazabilidad del equipo.
                                </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-12">
                                {features.map(
                                    ({
                                        icon,
                                        label,
                                        title,
                                        description,
                                        preview,
                                        className,
                                    }) => (
                                        <ProductCard
                                            key={title}
                                            className={className}
                                        >
                                            <FeatureIcon
                                                icon={icon}
                                                label={label}
                                            />
                                            <div className="grid flex-1 gap-6 md:grid-cols-[0.86fr_1.14fr] md:items-center">
                                                <div>
                                                    <h3 className="text-2xl leading-tight font-semibold text-white">
                                                        {title}
                                                    </h3>
                                                    <p className="mt-3 text-sm leading-6 text-white/50">
                                                        {description}
                                                    </p>
                                                </div>
                                                <div className="min-w-0">
                                                    {preview}
                                                </div>
                                            </div>
                                        </ProductCard>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-white/[0.08] bg-[#141815] py-20 md:py-24">
                        <div className="mx-auto max-w-7xl px-4 md:px-6">
                            <div className="mb-12 max-w-2xl">
                                <SectionLabel>Cómo funciona</SectionLabel>
                                <h2 className="mt-4 text-4xl leading-tight font-semibold sm:text-5xl">
                                    De crear el equipo a jugar en minutos.
                                </h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                {[
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
                                ].map(
                                    ({
                                        step,
                                        icon: Icon,
                                        title,
                                        description,
                                    }) => (
                                        <div
                                            key={step}
                                            className="rounded-lg border border-white/[0.08] bg-[#101312] p-6"
                                        >
                                            <div className="mb-8 flex items-center justify-between">
                                                <span className="text-sm font-semibold text-white/35">
                                                    {step}
                                                </span>
                                                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#48d17a]/10 text-[#48d17a]">
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-semibold">
                                                {title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-6 text-white/50">
                                                {description}
                                            </p>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden py-20 md:py-28">
                        <PitchLines />
                        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
                            <SectionLabel>Empezá hoy</SectionLabel>
                            <h2 className="mt-4 text-4xl leading-tight font-semibold sm:text-5xl md:text-6xl">
                                Ordená el próximo partido antes de que empiece
                                la semana.
                            </h2>
                            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/55">
                                Gratis, sin publicidad y preparado para la forma
                                en que se organiza el fútbol amateur en Uruguay.
                            </p>
                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                {ctaButtons}
                            </div>
                        </div>
                    </section>
                </main>

                <LandingFooter canRegister={canRegister} />
            </div>
        </>
    );
}
