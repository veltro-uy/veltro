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
import AppLogo from './app-logo';

interface LandingFooterProps {
    canRegister?: boolean;
}

export default function LandingFooter({
    canRegister = true,
}: LandingFooterProps) {
    const { auth } = usePage<SharedData>().props;

    return (
        <footer className="border-t bg-muted/30">
            <div className="container mx-auto px-4 py-12 md:px-6 md:py-16">
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                    {/* Brand Section */}
                    <div className="flex flex-col gap-4">
                        <Link
                            href={auth?.user ? teams.index().url : home().url}
                            className="flex items-center gap-2 font-semibold"
                        >
                            <AppLogo />
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            La plataforma centralizada para gestionar equipos de
                            fútbol amateur en Uruguay. Organiza partidos,
                            rastrea estadísticas y conecta con otros equipos.
                        </p>
                    </div>

                    {/* Platform Links */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-semibold">Plataforma</h3>
                        <nav className="flex flex-col gap-3">
                            {auth?.user ? (
                                <Link
                                    href={teams.index().url}
                                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    <Users className="h-4 w-4" />
                                    Ver Equipos
                                </Link>
                            ) : (
                                <>
                                    {canRegister && (
                                        <Link
                                            href={register().url}
                                            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            <Users className="h-4 w-4" />
                                            Registrarse
                                        </Link>
                                    )}
                                    <Link
                                        href={login().url}
                                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <Trophy className="h-4 w-4" />
                                        Iniciar sesión
                                    </Link>
                                </>
                            )}
                            {auth?.user && (
                                <>
                                    <Link
                                        href={teams.index().url}
                                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <Users className="h-4 w-4" />
                                        Explorar Equipos
                                    </Link>
                                    <Link
                                        href={matches.index().url}
                                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        <Trophy className="h-4 w-4" />
                                        Ver Partidos
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>

                    {/* Support & Resources */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-semibold">
                            Soporte y Recursos
                        </h3>
                        <nav className="flex flex-col gap-3">
                            <Link
                                href="/help"
                                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <HelpCircle className="h-4 w-4" />
                                Centro de Ayuda
                            </Link>
                            <Link
                                href="/contact"
                                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <Mail className="h-4 w-4" />
                                Contacto
                            </Link>
                            <Link
                                href="/about"
                                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <FileText className="h-4 w-4" />
                                Acerca de
                            </Link>
                        </nav>
                    </div>

                    {/* Legal */}
                    <div className="flex flex-col gap-4">
                        <h3 className="text-sm font-semibold">Legal</h3>
                        <nav className="flex flex-col gap-3">
                            <Link
                                href="/terms"
                                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <FileText className="h-4 w-4" />
                                Términos y Condiciones
                            </Link>
                            <Link
                                href="/privacy"
                                className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                            >
                                <Shield className="h-4 w-4" />
                                Política de Privacidad
                            </Link>
                        </nav>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 border-t pt-8">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="text-center text-sm text-muted-foreground sm:text-left">
                            © {new Date().getFullYear()} Veltro. Todos los
                            derechos reservados.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>
                                Hecho con ❤️ para equipos uruguayos amateurs
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
