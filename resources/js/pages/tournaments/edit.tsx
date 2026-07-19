import { TournamentForm } from '@/components/tournament/tournament-form';
import AppLayout from '@/layouts/app-layout';
import tournaments from '@/routes/tournaments';
import type { BreadcrumbItem, Tournament } from '@/types';
import { Head } from '@inertiajs/react';

interface PageProps {
    tournament: Tournament;
}

const breadcrumbs = (tournament: Tournament): BreadcrumbItem[] => [
    { title: 'Torneos', href: tournaments.index().url },
    {
        title: tournament.name,
        href: tournaments.show(tournament.public_id).url,
    },
    { title: 'Editar', href: tournaments.edit(tournament.public_id).url },
];

export default function TournamentEdit({ tournament }: PageProps) {
    const formatLocked = (tournament.registered_teams_count ?? 0) > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs(tournament)}>
            <Head title={`Editar ${tournament.name}`} />

            <div className="flex h-full flex-1 flex-col p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Editar Torneo
                        </h1>
                        <p className="text-muted-foreground">
                            Actualiza la información del torneo
                        </p>
                    </div>

                    <TournamentForm
                        mode="edit"
                        tournament={tournament}
                        formatLocked={formatLocked}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
