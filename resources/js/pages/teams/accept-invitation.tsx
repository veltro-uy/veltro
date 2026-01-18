import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { VariantBadge } from '@/components/variant-badge';
import { Head, useForm } from '@inertiajs/react';

interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
    description?: string;
}

interface User {
    id: number;
    name: string;
}

interface Invitation {
    id: number;
    token: string;
    role: string;
    expires_at: string;
}

interface Props {
    invitation: Invitation;
    team: Team;
    inviter: User;
}

export default function AcceptInvitation({ invitation, team, inviter }: Props) {
    const { post, processing } = useForm();

    const handleAccept = () => {
        post(`/teams/invite/${invitation.token}/accept`);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Head title={`Invitación a ${team.name}`} />

            <Card className="w-full max-w-lg">
                <CardHeader className="text-center">
                    <div className="mb-4 flex justify-center">
                        <TeamAvatar
                            name={team.name}
                            logoUrl={team.logo_url}
                            size="xl"
                        />
                    </div>
                    <CardTitle className="text-2xl">
                        ¡Has sido invitado a unirte!
                    </CardTitle>
                    <CardDescription>
                        {inviter.name} te ha invitado a unirte a {team.name}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="mb-2 font-semibold">Equipo</h3>
                            <div className="flex items-center gap-3">
                                <TeamAvatar
                                    name={team.name}
                                    logoUrl={team.logo_url}
                                />
                                <div>
                                    <p className="font-medium">{team.name}</p>
                                    <VariantBadge variant={team.variant} />
                                </div>
                            </div>
                        </div>

                        {team.description && (
                            <div>
                                <h3 className="mb-2 font-semibold">
                                    Descripción
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {team.description}
                                </p>
                            </div>
                        )}

                        <div>
                            <h3 className="mb-2 font-semibold">Tu rol</h3>
                            <p className="text-sm text-muted-foreground">
                                {invitation.role === 'player'
                                    ? 'Jugador'
                                    : 'Vice-Capitán'}
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 font-semibold">Expira</h3>
                            <p className="text-sm text-muted-foreground">
                                {new Date(
                                    invitation.expires_at,
                                ).toLocaleDateString('es-UY', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => window.history.back()}
                        >
                            Rechazar
                        </Button>
                        <Button
                            className="flex-1"
                            onClick={handleAccept}
                            disabled={processing}
                        >
                            {processing ? 'Aceptando...' : 'Aceptar Invitación'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
