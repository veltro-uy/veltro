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
    Globe,
    Trophy,
    Users,
} from 'lucide-react';
import type { ElementType, ReactNode } from 'react';

const PitchLines = () => (
    <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.05 }}
    >
        <g fill="none" stroke="white" strokeWidth="1.5">
            <rect x="80" y="60" width="1040" height="580" />
            <line x1="600" y1="60" x2="600" y2="640" />
            <circle cx="600" cy="350" r="100" />
            <circle cx="600" cy="350" r="4" fill="white" stroke="none" />
            <rect x="80" y="210" width="165" height="280" />
            <rect x="955" y="210" width="165" height="280" />
            <rect x="80" y="280" width="55" height="140" />
            <rect x="1065" y="280" width="55" height="140" />
            <path d="M80,60 Q100,60 100,80" />
            <path d="M1120,60 Q1100,60 1100,80" />
            <path d="M80,640 Q100,640 100,620" />
            <path d="M1120,640 Q1100,640 1100,620" />
            <circle cx="176" cy="350" r="4" fill="white" stroke="none" />
            <circle cx="1024" cy="350" r="4" fill="white" stroke="none" />
        </g>
    </svg>
);

const DarkBentoCard = ({
    children,
    className = '',
}: {
    children: ReactNode;
    className?: string;
}) => (
    <div
        className={`group relative flex flex-col overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.04] p-8 backdrop-blur-sm transition-colors hover:border-white/[0.14] hover:bg-white/[0.06] sm:p-10 ${className}`}
    >
        {children}
    </div>
);

const BentoIcon = ({
    icon: Icon,
    label,
}: {
    icon: ElementType;
    label: string;
}) => (
    <div className="mb-6 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/[0.15] text-green-400">
            <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm font-medium text-white/40">{label}</span>
    </div>
);

export default function LandingPage({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth?.user;

    const ctaButtons = isLoggedIn ? (
        <Button
            size="lg"
            className="rounded-xl bg-green-500 font-semibold text-black hover:bg-green-400"
            asChild
        >
            <Link href={teams.index().url}>
                Ver Equipos
                <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
        </Button>
    ) : (
        <>
            {canRegister && (
                <Button
                    size="lg"
                    className="rounded-xl bg-green-500 font-semibold text-black hover:bg-green-400"
                    asChild
                >
                    <Link href={register().url}>
                        Comenzar gratis
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                </Button>
            )}
            <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                asChild
            >
                <Link href={login().url}>Iniciar sesión</Link>
            </Button>
        </>
    );

    return (
        <>
            <Head>
                <title>
                    Veltro — Plataforma para equipos de fútbol amateur en
                    Uruguay
                </title>
                <meta
                    name="description"
                    content="Gestioná tu equipo, organizá partidos, seguí estadísticas y conectá con otros equipos de fútbol amateur en Uruguay. Todo en un solo lugar."
                />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&display=swap"
                    rel="stylesheet"
                />
            </Head>

            <div
                className="flex min-h-screen flex-col text-white"
                style={{ background: '#060d17' }}
            >
                {/* Header */}
                <header
                    className="sticky top-0 z-50 backdrop-blur-xl"
                    style={{
                        background: 'rgba(6,13,23,0.88)',
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                    }}
                >
                    <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
                        <Link
                            href={home().url}
                            className="flex items-center gap-2"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-green-500">
                                <AppLogoIcon className="size-5 fill-black" />
                            </div>
                            <span className="ml-1 text-sm font-semibold text-white">
                                Veltro
                            </span>
                        </Link>

                        <nav className="flex items-center gap-2">
                            {isLoggedIn ? (
                                <Button
                                    size="sm"
                                    className="bg-green-500 font-medium text-black hover:bg-green-400"
                                    asChild
                                >
                                    <Link href={teams.index().url}>
                                        Ver Equipos
                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                    </Link>
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="hidden text-white/60 hover:bg-white/10 hover:text-white sm:inline-flex"
                                        asChild
                                    >
                                        <Link href={login().url}>
                                            Iniciar sesión
                                        </Link>
                                    </Button>
                                    {canRegister && (
                                        <Button
                                            size="sm"
                                            className="bg-green-500 font-medium text-black hover:bg-green-400"
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

                {/* Hero */}
                <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-32">
                    <PitchLines />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-[-20%] left-[5%] h-[700px] w-[700px] rounded-full blur-[140px]"
                        style={{ background: 'rgba(34,197,94,0.09)' }}
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-[0%] bottom-[-10%] h-[400px] w-[400px] rounded-full blur-[120px]"
                        style={{ background: 'rgba(34,197,94,0.06)' }}
                    />

                    <div className="container mx-auto max-w-7xl px-4 md:px-6">
                        <div className="flex flex-col items-center gap-16 lg:flex-row lg:items-center lg:gap-16">
                            {/* Text column */}
                            <div className="flex max-w-2xl flex-1 flex-col gap-7 text-center lg:text-left">
                                <div className="flex justify-center lg:justify-start">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/[0.1] px-3 py-1 text-xs font-medium text-green-400">
                                        <span className="relative flex h-1.5 w-1.5">
                                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                                        </span>
                                        Hecho en Uruguay · 100% Gratis
                                    </span>
                                </div>

                                <h1 className="font-display text-[5.5rem] font-bold uppercase leading-none tracking-tight sm:text-[7rem] lg:text-[6.5rem] xl:text-[8rem]">
                                    Tu equipo.
                                    <br />
                                    <span className="text-green-400">
                                        Sin caos.
                                    </span>
                                </h1>

                                <p className="mx-auto max-w-xl text-lg leading-relaxed text-white/55 lg:mx-0">
                                    Veltro reemplaza los grupos de WhatsApp con
                                    una plataforma para capitanes: partidos,
                                    asistencia, estadísticas y torneos en un
                                    solo lugar.
                                </p>

                                <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                                    {ctaButtons}
                                </div>

                                <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/35 lg:justify-start">
                                    {[
                                        'Sin publicidad',
                                        'Sin tarjeta de crédito',
                                        'Fútbol 11, 7, 5 y futsal',
                                    ].map((text) => (
                                        <span
                                            key={text}
                                            className="flex items-center gap-2"
                                        >
                                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                            {text}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Preview column */}
                            <div className="relative w-full max-w-sm flex-shrink-0 lg:max-w-md">
                                <div
                                    style={{
                                        filter: 'drop-shadow(0 30px 80px rgba(34,197,94,0.18))',
                                    }}
                                >
                                    <LandingMatchPreview />
                                </div>
                                <div className="absolute -top-5 -right-5 hidden rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur-sm lg:block">
                                    <span className="font-display block text-3xl font-bold leading-none text-green-400">
                                        9/11
                                    </span>
                                    <span className="text-xs text-white/50">
                                        confirmados
                                    </span>
                                </div>
                                <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 backdrop-blur-sm lg:block">
                                    <span className="block text-sm font-medium">
                                        Recordatorio enviado
                                    </span>
                                    <span className="text-xs text-white/50">
                                        a 3 jugadores
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Stats strip */}
                <div
                    className="py-12"
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                    }}
                >
                    <div className="container mx-auto max-w-4xl px-4">
                        <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
                            {[
                                {
                                    value: '500+',
                                    label: 'Partidos organizados',
                                },
                                { value: '80+', label: 'Equipos registrados' },
                                {
                                    value: '1.200+',
                                    label: 'Jugadores activos',
                                },
                            ].map(({ value, label }) => (
                                <div
                                    key={label}
                                    className="flex flex-col gap-2"
                                >
                                    <span className="font-display text-5xl font-bold leading-none text-green-400">
                                        {value}
                                    </span>
                                    <span className="text-sm text-white/40">
                                        {label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features bento */}
                <section className="py-24 md:py-32">
                    <div className="container mx-auto max-w-6xl px-4">
                        <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-4 text-center">
                            <span className="text-xs font-semibold tracking-[0.2em] text-green-500 uppercase">
                                Qué podés hacer
                            </span>
                            <h2 className="font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl">
                                Diseñado para capitanes,
                                <br />
                                <span className="text-white/35">
                                    pensado para jugadores.
                                </span>
                            </h2>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
                            <DarkBentoCard className="lg:col-span-8">
                                <BentoIcon
                                    icon={CalendarDays}
                                    label="Partidos"
                                />
                                <h3 className="font-display mb-3 text-3xl font-bold uppercase leading-none sm:text-4xl">
                                    Organizá partidos en segundos
                                </h3>
                                <p className="mb-8 max-w-md text-sm text-white/45">
                                    Fecha, cancha, rival y marcador — todo en
                                    una tarjeta que los jugadores entienden al
                                    instante.
                                </p>
                                <div className="relative mt-auto">
                                    <div
                                        className="absolute inset-0 rounded-xl"
                                        style={{
                                            background:
                                                'radial-gradient(ellipse at center, rgba(34,197,94,0.07) 0%, transparent 70%)',
                                        }}
                                    />
                                    <LandingMatchPreview />
                                </div>
                            </DarkBentoCard>

                            <DarkBentoCard className="lg:col-span-4">
                                <BentoIcon
                                    icon={BellRing}
                                    label="Recordatorios"
                                />
                                <h3 className="font-display mb-3 text-3xl font-bold uppercase leading-none">
                                    Nadie se olvida del partido
                                </h3>
                                <p className="mb-8 text-sm text-white/45">
                                    Recordatorios automáticos 48 horas antes a
                                    quien no confirmó.
                                </p>
                                <div className="mt-auto space-y-3">
                                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.05] p-4">
                                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/[0.15] text-green-400">
                                            <BellRing className="h-4 w-4" />
                                        </span>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-sm font-medium">
                                                Partido mañana
                                            </span>
                                            <span className="text-xs text-white/40">
                                                ¿Venís a jugar?
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className="flex-1 rounded-lg border border-green-500/30 bg-green-500/[0.15] px-3 py-2.5 text-center text-xs font-semibold text-green-400">
                                            Voy
                                        </span>
                                        <span className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2.5 text-center text-xs font-medium text-white/35">
                                            Tal vez
                                        </span>
                                        <span className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.05] px-3 py-2.5 text-center text-xs font-medium text-white/35">
                                            No
                                        </span>
                                    </div>
                                </div>
                            </DarkBentoCard>

                            <DarkBentoCard className="lg:col-span-5">
                                <BentoIcon
                                    icon={Users}
                                    label="Disponibilidad"
                                />
                                <h3 className="font-display mb-3 text-3xl font-bold uppercase leading-none">
                                    Sabé quién va antes del silbato
                                </h3>
                                <p className="mb-8 text-sm text-white/45">
                                    Panorama completo de tu plantel con alertas
                                    si no llegás al mínimo.
                                </p>
                                <div className="mt-auto">
                                    <LandingAvailabilityPreview />
                                </div>
                            </DarkBentoCard>

                            <DarkBentoCard className="lg:col-span-7">
                                <BentoIcon icon={Trophy} label="Torneos" />
                                <h3 className="font-display mb-3 text-3xl font-bold uppercase leading-none sm:text-4xl">
                                    Competí en torneos organizados
                                </h3>
                                <p className="mb-8 max-w-sm text-sm text-white/45">
                                    Inscribite, seguí la capacidad en tiempo
                                    real y jugá contra equipos de tu zona.
                                </p>
                                <div className="relative mt-auto">
                                    <div
                                        className="absolute inset-0 rounded-xl"
                                        style={{
                                            background:
                                                'radial-gradient(ellipse at center, rgba(245,158,11,0.06) 0%, transparent 70%)',
                                        }}
                                    />
                                    <LandingTournamentPreview />
                                </div>
                            </DarkBentoCard>
                        </div>
                    </div>
                </section>

                {/* How it works */}
                <section
                    className="py-24 md:py-32"
                    style={{
                        borderTop: '1px solid rgba(255,255,255,0.06)',
                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.015)',
                    }}
                >
                    <div className="container mx-auto max-w-6xl px-4">
                        <div className="mx-auto mb-16 flex max-w-2xl flex-col items-center gap-4 text-center">
                            <span className="text-xs font-semibold tracking-[0.2em] text-green-500 uppercase">
                                Cómo funciona
                            </span>
                            <h2 className="font-display text-5xl font-bold uppercase leading-none tracking-tight sm:text-6xl">
                                De cero a jugar en minutos.
                            </h2>
                        </div>

                        <div className="relative grid gap-10 md:grid-cols-3 md:gap-8">
                            <div
                                aria-hidden="true"
                                className="absolute top-7 right-0 left-0 hidden h-px md:block"
                                style={{
                                    background:
                                        'linear-gradient(to right, transparent, rgba(34,197,94,0.25) 20%, rgba(34,197,94,0.25) 80%, transparent)',
                                }}
                            />

                            {[
                                {
                                    step: '01',
                                    icon: Users,
                                    title: 'Armá tu equipo',
                                    description:
                                        'Creá el equipo, invitá jugadores con un enlace y asigná roles de capitán y vice-capitán.',
                                },
                                {
                                    step: '02',
                                    icon: CalendarDays,
                                    title: 'Programá el partido',
                                    description:
                                        'Publicá fecha, cancha y rival. Los jugadores confirman asistencia desde el celular.',
                                },
                                {
                                    step: '03',
                                    icon: Trophy,
                                    title: 'Jugá y registrá',
                                    description:
                                        'Anotá goles, seguí resultados y mirá cómo mejora tu equipo partido a partido.',
                                },
                            ].map(({ step, icon: Icon, title, description }) => (
                                <div
                                    key={step}
                                    className="relative flex flex-col gap-5"
                                >
                                    <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
                                        <Icon className="h-6 w-6 text-green-400" />
                                    </span>
                                    <div>
                                        <div className="mb-2 flex items-baseline gap-3">
                                            <span className="font-display text-5xl font-bold leading-none text-white/[0.1]">
                                                {step}
                                            </span>
                                            <h3 className="font-display text-2xl font-bold uppercase leading-none">
                                                {title}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-white/45">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="relative overflow-hidden py-28 md:py-36">
                    <PitchLines />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0"
                        style={{
                            background:
                                'radial-gradient(ellipse 60% 60% at 50% 60%, rgba(34,197,94,0.09) 0%, transparent 70%)',
                        }}
                    />

                    <div className="relative container mx-auto max-w-3xl px-4 text-center">
                        <div className="mb-6 flex justify-center">
                            <span className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/[0.1] px-3 py-1 text-xs font-medium text-green-400">
                                <Globe className="h-3 w-3" />
                                Empezá hoy
                            </span>
                        </div>
                        <h2 className="font-display mb-6 text-6xl font-bold uppercase leading-none tracking-tight sm:text-7xl md:text-8xl">
                            Dejá el caos atrás.
                            <br />
                            <span className="text-green-400">
                                Armá el próximo partido.
                            </span>
                        </h2>
                        <p className="mx-auto mb-10 max-w-xl text-lg text-white/50">
                            Gratis, sin publicidad, y hecho por gente que
                            también juega los sábados.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                            {ctaButtons}
                        </div>
                    </div>
                </section>

                <LandingFooter canRegister={canRegister} />
            </div>
        </>
    );
}
