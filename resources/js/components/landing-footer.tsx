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
    'flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground';

export default function LandingFooter({
    canRegister = true,
}: LandingFooterProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <footer className="border-t border-border bg-sidebar">
            <div className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.25fr_1fr_1fr_1fr]">
                    <div className="max-w-sm">
                        <Link
                            href={auth?.user ? teams.index().url : home().url}
                            className="flex items-center gap-2.5"
                        >
                            <AppLogoIcon className="size-7 text-primary" />
                            <span className="text-display text-lg tracking-wide text-foreground">
                                Veltro
                            </span>
                        </Link>
                        <p className="mt-4 text-sm leading-6 text-muted-foreground">
                            Plataforma centralizada para gestionar equipos de
                            fútbol amateur en Uruguay: partidos, disponibilidad,
                            estadísticas y torneos en un solo lugar.
                        </p>
                    </div>

                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
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
                        <h3 className="text-sm font-semibold text-foreground">
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
                        <h3 className="text-sm font-semibold text-foreground">
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

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row">
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
