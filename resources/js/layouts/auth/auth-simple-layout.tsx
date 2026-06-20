import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ShieldCheck, Trophy, Users } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

const PitchLines = () => (
    <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full text-foreground"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.045 }}
    >
        <g fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="58" y="60" width="684" height="780" rx="8" />
            <line x1="400" y1="60" x2="400" y2="840" />
            <circle cx="400" cy="450" r="98" />
            <circle cx="400" cy="450" r="4" fill="currentColor" stroke="none" />
            <rect x="58" y="274" width="158" height="252" rx="4" />
            <rect x="584" y="274" width="158" height="252" rx="4" />
            <rect x="58" y="342" width="54" height="116" rx="3" />
            <rect x="688" y="342" width="54" height="116" rx="3" />
        </g>
    </svg>
);

/** Atmospheric backdrop matching the landing page: brand glow + pitch + grain. */
const Decor = () => (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="bg-pitch-glow absolute inset-0" />
        <PitchLines />
        <div className="bg-grain absolute inset-0 opacity-[0.035] mix-blend-soft-light" />
    </div>
);

const features = [
    { icon: Users, text: 'Invitá a tu plantel con un enlace' },
    { icon: CalendarDays, text: 'Organizá partidos sin perseguir mensajes' },
    { icon: Trophy, text: 'Competí con estructura de torneo real' },
];

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <>
            <Head />

            <div className="grid min-h-svh bg-background text-foreground lg:grid-cols-[0.92fr_1.08fr]">
                <aside className="relative hidden overflow-hidden border-r border-border bg-secondary/30 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
                    <Decor />

                    <Link
                        href={home()}
                        className="relative z-10 flex items-center gap-2.5"
                    >
                        <AppLogoIcon className="size-8 text-primary" />
                        <span className="text-display text-xl tracking-wide text-foreground">
                            Veltro
                        </span>
                    </Link>

                    <div className="relative z-10 max-w-md">
                        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-accent-foreground">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Hecho en Uruguay para capitanes amateur
                        </span>

                        <h2 className="text-display text-5xl text-foreground xl:text-6xl">
                            <span className="block">La casa del</span>
                            <span className="block text-primary">
                                fútbol amateur
                            </span>
                        </h2>

                        <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">
                            Partidos, asistencia, estadísticas y torneos en una
                            experiencia simple para capitanes y clara para
                            jugadores. Todo en un solo lugar.
                        </p>

                        <div className="mt-9 grid gap-3">
                            {features.map(({ icon: Icon, text }) => (
                                <div
                                    key={text}
                                    className="flex items-center gap-3 rounded-lg border border-border bg-background/60 px-3 py-3"
                                >
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="text-sm text-muted-foreground">
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="relative z-10 text-xs text-muted-foreground">
                        Gratis, sin publicidad y preparado para fútbol 11, 7, 5
                        y futsal.
                    </p>
                </aside>

                <section className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-12">
                    <div className="bg-pitch-glow absolute inset-0" />
                    <PitchLines />

                    <div className="relative z-10 w-full max-w-[430px]">
                        <Link
                            href={home()}
                            className="mb-8 flex items-center justify-center gap-2.5 lg:hidden"
                        >
                            <AppLogoIcon className="size-8 text-primary" />
                            <span className="text-display text-xl tracking-wide text-foreground">
                                Veltro
                            </span>
                        </Link>

                        <div className="rounded-xl border border-border bg-card/96 p-6 shadow-[0_28px_90px_-20px_rgba(0,0,0,0.6)] sm:p-8">
                            <div className="mb-7">
                                <h1 className="text-display text-3xl text-foreground">
                                    {title}
                                </h1>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {description}
                                </p>
                            </div>

                            <div className="auth-form-surface">{children}</div>
                        </div>

                        <div className="mt-6 text-center">
                            <Link
                                href={home()}
                                className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                            >
                                Volver al inicio
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
