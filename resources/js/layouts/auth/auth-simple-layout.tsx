import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import { Link } from '@inertiajs/react';
import { CalendarDays, Trophy, Users } from 'lucide-react';
import { type PropsWithChildren } from 'react';

interface AuthLayoutProps {
    name?: string;
    title?: string;
    description?: string;
}

const PitchLines = () => (
    <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 800 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.05 }}
    >
        <g fill="none" stroke="white" strokeWidth="1.5">
            <rect x="50" y="50" width="700" height="800" />
            <line x1="400" y1="50" x2="400" y2="850" />
            <circle cx="400" cy="450" r="100" />
            <circle cx="400" cy="450" r="4" fill="white" stroke="none" />
            <rect x="50" y="270" width="160" height="260" />
            <rect x="590" y="270" width="160" height="260" />
            <rect x="50" y="340" width="55" height="120" />
            <rect x="695" y="340" width="55" height="120" />
            <path d="M50,50 Q70,50 70,70" />
            <path d="M750,50 Q730,50 730,70" />
            <path d="M50,850 Q70,850 70,830" />
            <path d="M750,850 Q730,850 730,830" />
            <circle cx="130" cy="450" r="4" fill="white" stroke="none" />
            <circle cx="670" cy="450" r="4" fill="white" stroke="none" />
        </g>
    </svg>
);

const features = [
    { icon: Users, text: 'Invitá a tu plantel con un enlace' },
    { icon: CalendarDays, text: 'Organizá partidos en segundos' },
    { icon: Trophy, text: 'Competí en torneos organizados' },
];

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: PropsWithChildren<AuthLayoutProps>) {
    return (
        <>
            <div
                className="flex min-h-svh flex-col text-white lg:flex-row"
                style={{ background: '#060d17' }}
            >
                {/* Left: brand panel — desktop only */}
                <div className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[45%]">
                    <PitchLines />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full blur-[130px]"
                        style={{ background: 'rgba(34,197,94,0.1)' }}
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-[-10%] bottom-[-10%] h-[300px] w-[300px] rounded-full blur-[100px]"
                        style={{ background: 'rgba(34,197,94,0.06)' }}
                    />

                    {/* Logo */}
                    <Link
                        href={home()}
                        className="relative z-10 flex items-center gap-3"
                    >
                        <div className="flex aspect-square size-9 items-center justify-center rounded-md bg-green-500">
                            <AppLogoIcon className="size-5 fill-black" />
                        </div>
                        <span className="text-sm font-semibold">Veltro</span>
                    </Link>

                    {/* Tagline + features */}
                    <div className="relative z-10">
                        <h2 className="font-display mb-4 text-5xl font-bold uppercase leading-none xl:text-6xl">
                            Tu equipo.
                            <br />
                            <span className="text-green-400">Sin caos.</span>
                        </h2>
                        <p className="mb-10 max-w-xs text-sm leading-relaxed text-white/50">
                            La plataforma para equipos de fútbol amateur en
                            Uruguay. Partidos, asistencia y torneos en un solo
                            lugar.
                        </p>
                        <div className="flex flex-col gap-4">
                            {features.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-3">
                                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-green-500/[0.15] text-green-400">
                                        <Icon className="h-3.5 w-3.5" />
                                    </span>
                                    <span className="text-sm text-white/55">
                                        {text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bottom badge */}
                    <div className="relative z-10">
                        <span className="inline-flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/[0.1] px-3 py-1 text-xs font-medium text-green-400">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-400" />
                            </span>
                            Hecho en Uruguay · 100% Gratis
                        </span>
                    </div>
                </div>

                {/* Right: form panel */}
                <div
                    className="flex flex-1 flex-col items-center justify-center p-6 md:p-10 lg:p-12"
                    style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}
                >
                    {/* Mobile logo */}
                    <Link
                        href={home()}
                        className="mb-10 flex items-center gap-2 lg:hidden"
                    >
                        <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-green-500">
                            <AppLogoIcon className="size-5 fill-black" />
                        </div>
                        <span className="text-sm font-semibold">Veltro</span>
                    </Link>

                    <div className="w-full max-w-sm">
                        <div className="mb-8">
                            <h1 className="font-display mb-2 text-4xl font-bold uppercase leading-none">
                                {title}
                            </h1>
                            <p className="text-sm text-white/50">
                                {description}
                            </p>
                        </div>

                        {children}

                        <div className="mt-8 text-center">
                            <Link
                                href={home()}
                                className="text-xs text-white/30 transition-colors hover:text-white/60"
                            >
                                ← Volver al inicio
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
