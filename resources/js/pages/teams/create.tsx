import { CreateTeamWizard } from '@/components/create-team-wizard';
import AppLayout from '@/layouts/app-layout';
import teams from '@/routes/teams';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Equipos',
        href: teams.index().url,
    },
    {
        title: 'Crear Equipo',
        href: teams.create().url,
    },
];

export default function CreateTeam() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Equipo" />

            <div className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
                <div className="mb-6">
                    <p className="font-display text-sm font-bold tracking-[0.18em] text-primary uppercase">
                        Nuevo equipo
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        Crear Equipo
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Armá tu equipo para empezar a jugar partidos y torneos.
                    </p>
                </div>

                <CreateTeamWizard />
            </div>
        </AppLayout>
    );
}
