import type { OpposingTeamLeader } from '@/components/match/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';
import { UserNameLink } from '@/components/user-name-link';
import { Phone } from 'lucide-react';

const getWhatsAppUrl = (phone: string): string => {
    const cleaned = phone.replace(/[^\d+]/g, '');
    return `https://wa.me/${cleaned}`;
};

interface OpposingLeadersCardProps {
    leaders: OpposingTeamLeader[];
}

export function OpposingLeadersCard({ leaders }: OpposingLeadersCardProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Contacto del Equipo Rival</CardTitle>
                <CardDescription>
                    Coordina los detalles del partido con los líderes del equipo
                    oponente
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {leaders.map((leader) => (
                        <div
                            key={leader.id}
                            className="flex items-center justify-between rounded-lg border bg-card p-4"
                        >
                            <div className="flex items-center gap-3">
                                <UserAvatar name={leader.user.name} size="sm" />
                                <div>
                                    <p className="font-medium">
                                        <UserNameLink user={leader.user} />
                                    </p>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {leader.role === 'captain'
                                                ? 'Capitán'
                                                : 'Subcapitán'}
                                        </Badge>
                                        {leader.user.phone_number && (
                                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                <Phone className="h-3 w-3" />
                                                <span>
                                                    {leader.user.phone_number}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {leader.user.phone_number && (
                                <Button asChild variant="outline" size="sm">
                                    <a
                                        href={getWhatsAppUrl(
                                            leader.user.phone_number,
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Phone className="mr-2 h-4 w-4" />
                                        WhatsApp
                                    </a>
                                </Button>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
