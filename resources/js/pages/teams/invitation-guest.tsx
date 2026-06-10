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
import { Head, Link } from '@inertiajs/react';

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
    token: string;
    role: string;
    expires_at: string;
}

interface Props {
    invitation: Invitation;
    team: Team;
    inviter: User;
}

export default function InvitationGuest({ invitation, team, inviter }: Props) {
    const registerHref = `/register?invitation=${encodeURIComponent(invitation.token)}`;

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
                        {inviter.name} te ha invitado a unirte a {team.name}.
                        Crea tu cuenta para sumarte al equipo.
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
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button asChild className="w-full">
                            <Link href={registerHref}>
                                Crear cuenta para unirme
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/login">Ya tengo cuenta</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
