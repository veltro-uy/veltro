import { CreateMatchWizard } from '@/components/create-match-wizard';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import matches from '@/routes/matches';
import teams from '@/routes/teams';
import type { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Users } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Partidos',
        href: matches.index().url,
    },
    {
        title: 'Publicar Partido',
        href: matches.create().url,
    },
];

export default function CreateMatch({ teams: myTeams }: { teams: Team[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Publicar Partido" />

            <div className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
                <div className="mb-6">
                    <p className="font-display text-sm font-bold tracking-[0.18em] text-primary uppercase">
                        Nuevo partido
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        Publicar Partido
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Publicá una fecha disponible y dejá que otros equipos
                        pidan jugar.
                    </p>
                </div>

                {myTeams.length === 0 ? (
                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-border p-10 text-center">
                        <div
                            aria-hidden
                            className="bg-pitch-glow pointer-events-none absolute inset-0"
                        />
                        <div className="relative flex flex-col items-center gap-4">
                            <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Necesitás liderar un equipo
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Solo capitanes y subcapitanes pueden
                                    publicar partidos. Creá tu equipo para
                                    empezar.
                                </p>
                            </div>
                            <Button asChild>
                                <Link href={teams.create().url}>
                                    Crear Equipo
                                </Link>
                            </Button>
                        </div>
                    </div>
                ) : (
                    <CreateMatchWizard teams={myTeams} />
                )}
            </div>
        </AppLayout>
    );
}
