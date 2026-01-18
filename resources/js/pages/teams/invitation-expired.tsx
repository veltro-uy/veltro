import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import teams from '@/routes/teams';
import { Head, Link } from '@inertiajs/react';
import { Clock } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    logo_url?: string;
}

interface Props {
    team: Team;
}

export default function InvitationExpired({ team }: Props) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Head title="Invitación Expirada" />

            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="rounded-full bg-orange-100 p-4">
                            <Clock className="h-12 w-12 text-orange-600" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl">
                        Invitación Expirada
                    </CardTitle>
                    <CardDescription>
                        Esta invitación para unirte a {team.name} ha expirado
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-center gap-3 rounded-lg border p-4">
                        <TeamAvatar name={team.name} logoUrl={team.logo_url} />
                        <p className="font-medium">{team.name}</p>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                        Las invitaciones expiran después de 7 días. Pídele al
                        capitán del equipo que genere una nueva invitación.
                    </p>

                    <div className="flex flex-col gap-3">
                        <Button asChild>
                            <Link href={teams.show(team.id).url}>
                                Ver Equipo
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href={teams.index().url}>
                                Explorar Equipos
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
