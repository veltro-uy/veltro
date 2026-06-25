import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Home } from 'lucide-react';

interface Props {
    status: number;
}

interface ErrorCopy {
    title: string;
    heading: string;
    description: string;
}

const COPY: Record<number, ErrorCopy> = {
    404: {
        title: 'Página no encontrada',
        heading: 'Esta cancha no existe',
        description:
            'La página que buscás no existe o fue movida. Revisá la dirección o volvé al inicio.',
    },
    403: {
        title: 'Acceso denegado',
        heading: 'No tenés permiso',
        description:
            'No estás autorizado para ver esta página. Si creés que es un error, contactá al capitán de tu equipo.',
    },
    419: {
        title: 'La sesión expiró',
        heading: 'Se venció la sesión',
        description:
            'Por seguridad, tu sesión expiró. Actualizá la página e intentá de nuevo.',
    },
    500: {
        title: 'Error del servidor',
        heading: 'Algo salió mal',
        description:
            'Tuvimos un problema de nuestro lado. Ya estamos trabajando para solucionarlo. Probá de nuevo en unos minutos.',
    },
    503: {
        title: 'En mantenimiento',
        heading: 'Volvemos enseguida',
        description:
            'Estamos haciendo mejoras en Veltro. Volvé en un rato. Gracias por la paciencia.',
    },
};

const FALLBACK: ErrorCopy = {
    title: 'Algo salió mal',
    heading: 'Algo salió mal',
    description:
        'Ocurrió un error inesperado. Volvé al inicio o intentá de nuevo más tarde.',
};

/** Subtle pitch-line motif, mirroring the landing-page backdrop. */
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
        </g>
    </svg>
);

export default function ErrorPage({ status }: Props) {
    const copy = COPY[status] ?? FALLBACK;

    return (
        <>
            <Head title={`${status} — ${copy.title}`} />

            <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-16 text-center">
                {/* Atmospheric backdrop: brand glow + pitch motif + film grain. */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0"
                >
                    <div className="bg-pitch-glow absolute inset-0" />
                    <PitchLines />
                    <div className="bg-grain absolute inset-0 opacity-[0.035] mix-blend-soft-light" />
                </div>

                <div className="relative z-10 flex w-full max-w-md flex-col items-center">
                    <Link
                        href={home().url}
                        className="mb-10 flex items-center gap-2"
                    >
                        <AppLogoIcon className="size-8 text-primary" />
                        <span className="text-lg font-semibold tracking-tight">
                            Veltro
                        </span>
                    </Link>

                    <p className="text-display text-7xl text-primary sm:text-8xl">
                        {status}
                    </p>

                    <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                        {copy.heading}
                    </h1>

                    <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                        {copy.description}
                    </p>

                    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
                        <Button size="lg" asChild>
                            <Link href={home().url}>
                                <Home className="size-4" />
                                Volver al inicio
                            </Link>
                        </Button>
                        <Button
                            size="lg"
                            variant="outline"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="size-4" />
                            Volver atrás
                        </Button>
                    </div>
                </div>
            </main>
        </>
    );
}
