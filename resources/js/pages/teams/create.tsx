import { CreateTeamForm } from '@/components/create-team-modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Crear Equipo
                    </h1>
                    <p className="text-muted-foreground">
                        Configura tu equipo para empezar a jugar partidos y
                        torneos.
                    </p>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Datos del equipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CreateTeamForm />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
