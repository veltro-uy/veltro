import { TournamentForm } from '@/components/tournament/tournament-form';
import AppLayout from '@/layouts/app-layout';
import tournaments from '@/routes/tournaments';
import type { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Torneos', href: tournaments.index().url },
    { title: 'Crear Torneo', href: tournaments.create().url },
];

export default function TournamentCreate() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Torneo" />

            <div className="flex h-full flex-1 flex-col p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Crear Torneo
                        </h1>
                        <p className="text-muted-foreground">
                            Organiza un nuevo torneo de fútbol para equipos
                        </p>
                    </div>

                    <TournamentForm mode="create" />
                </div>
            </div>
        </AppLayout>
    );
}
