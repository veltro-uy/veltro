import { home, login, register } from '@/routes';
import matches from '@/routes/matches';
import teams from '@/routes/teams';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import {
    FileText,
    HelpCircle,
    Mail,
    Shield,
    Trophy,
    Users,
} from 'lucide-react';
import AppLogoIcon from './app-logo-icon';

interface LandingFooterProps {
    canRegister?: boolean;
}

const footerLink =
    'flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white';

export default function LandingFooter({
    canRegister = true,
}: LandingFooterProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <footer className="border-t border-white/[0.08] bg-[#0c0f0d]">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
                    <div className="max-w-sm">
                        <Link
                            href={auth?.user ? teams.index().url : home().url}
                            className="flex items-center gap-3"
                        >
                            <span className="flex size-8 items-center justify-center rounded-md bg-[#48d17a]">
                                <AppLogoIcon className="size-5 fill-[#07110b]" />
                            </span>
                            <span className="text-sm font-semibold tracking-wide text-white">
                                Veltro
                            </span>
                        </Link>
                        <p className="mt-4 text-sm leading-6 text-white/50">
                            Plataforma centralizada para gestionar equipos de
                            fútbol amateur en Uruguay: partidos, disponibilidad,
                            estadísticas y torneos en un solo lugar.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Plataforma
                        </h3>
                        <nav className="mt-4 grid gap-3">
                            {auth?.user ? (
                                <>
                                    <Link
                                        href={teams.index().url}
                                        className={footerLink}
                                    >
                                        <Users className="h-4 w-4" />
                                        Explorar equipos
                                    </Link>
                                    <Link
                                        href={matches.index().url}
                                        className={footerLink}
                                    >
                                        <Trophy className="h-4 w-4" />
                                        Ver partidos
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {canRegister && (
                                        <Link
                                            href={register().url}
                                            className={footerLink}
                                        >
                                            <Users className="h-4 w-4" />
                                            Registrarse
                                        </Link>
                                    )}
                                    <Link
                                        href={login().url}
                                        className={footerLink}
                                    >
                                        <Trophy className="h-4 w-4" />
                                        Iniciar sesión
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Recursos
                        </h3>
                        <nav className="mt-4 grid gap-3">
                            <Link href="/help" className={footerLink}>
                                <HelpCircle className="h-4 w-4" />
                                Centro de ayuda
                            </Link>
                            <Link href="/contact" className={footerLink}>
                                <Mail className="h-4 w-4" />
                                Contacto
                            </Link>
                            <Link href="/about" className={footerLink}>
                                <FileText className="h-4 w-4" />
                                Acerca de
                            </Link>
                        </nav>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-white">
                            Legal
                        </h3>
                        <nav className="mt-4 grid gap-3">
                            <Link href="/terms" className={footerLink}>
                                <FileText className="h-4 w-4" />
                                Términos
                            </Link>
                            <Link href="/privacy" className={footerLink}>
                                <Shield className="h-4 w-4" />
                                Privacidad
                            </Link>
                        </nav>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/[0.08] pt-8 text-sm text-white/40 sm:flex-row">
                    <p className="text-center sm:text-left">
                        © {new Date().getFullYear()} Veltro. Todos los derechos
                        reservados.
                    </p>
                    <p>Hecho para equipos uruguayos amateurs.</p>
                </div>
            </div>
        </footer>
    );
}
