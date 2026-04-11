import type { MatchRequest } from '@/components/match/types';
import { TeamAvatar } from '@/components/team-avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

interface MatchRequestsCardProps {
    requests: MatchRequest[];
    onAccept: (requestId: number) => void;
    onReject: (requestId: number) => void;
}

export function MatchRequestsCard({
    requests,
    onAccept,
    onReject,
}: MatchRequestsCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Solicitudes de Partido</CardTitle>
                <CardDescription>
                    Equipos interesados en jugar este partido
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
                        >
                            <TeamAvatar
                                name={request.requesting_team.name}
                                logoUrl={request.requesting_team.logo_url}
                                size="md"
                            />
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold">
                                    {request.requesting_team.name}
                                </p>
                                {request.message && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {request.message}
                                    </p>
                                )}
                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => onAccept(request.id)}
                                    >
                                        Aceptar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onReject(request.id)}
                                    >
                                        Rechazar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
