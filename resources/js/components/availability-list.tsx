import { Check, HelpCircle, Loader2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/user-avatar';

import type { AvailabilityStatus, MatchAvailability } from '@/types';

interface AvailabilityListProps {
    availability: MatchAvailability[];
    teamName: string;
}

export function AvailabilityList({
    availability,
    teamName,
}: AvailabilityListProps) {
    const getStatusConfig = (status: AvailabilityStatus) => {
        switch (status) {
            case 'available':
                return {
                    icon: Check,
                    label: 'Disponibles',
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-100 dark:bg-green-900',
                };
            case 'maybe':
                return {
                    icon: HelpCircle,
                    label: 'Tal vez',
                    color: 'text-yellow-600 dark:text-yellow-400',
                    bgColor: 'bg-yellow-100 dark:bg-yellow-900',
                };
            case 'unavailable':
                return {
                    icon: X,
                    label: 'No Disponibles',
                    color: 'text-red-600 dark:text-red-400',
                    bgColor: 'bg-red-100 dark:bg-red-900',
                };
            case 'pending':
                return {
                    icon: Loader2,
                    label: 'Pendientes',
                    color: 'text-gray-600 dark:text-gray-400',
                    bgColor: 'bg-gray-100 dark:bg-gray-900',
                };
        }
    };

    // Group by status
    const grouped = availability.reduce(
        (acc, item) => {
            acc[item.status].push(item);
            return acc;
        },
        {
            available: [] as MatchAvailability[],
            maybe: [] as MatchAvailability[],
            unavailable: [] as MatchAvailability[],
            pending: [] as MatchAvailability[],
        },
    );

    const renderGroup = (
        status: AvailabilityStatus,
        items: MatchAvailability[],
    ) => {
        if (items.length === 0) return null;

        const config = getStatusConfig(status);
        const Icon = config.icon;

        return (
            <div key={status} className="space-y-2">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <h4 className="text-sm font-medium">{config.label}</h4>
                    <Badge variant="secondary" className="ml-auto">
                        {items.length}
                    </Badge>
                </div>
                <div className="space-y-1">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-2 rounded-md p-2 ${config.bgColor}`}
                        >
                            {item.user && (
                                <>
                                    <UserAvatar
                                        name={item.user.name}
                                        avatarUrl={item.user.avatar_url}
                                        size="sm"
                                        className="h-6 w-6"
                                    />
                                    <span className="text-sm">
                                        {item.user.name}
                                    </span>
                                </>
                            )}
                            {!item.user && (
                                <span className="text-sm text-muted-foreground">
                                    Jugador Desconocido
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">
                    {teamName} - Disponibilidad de Jugadores
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {renderGroup('available', grouped.available)}
                {renderGroup('maybe', grouped.maybe)}
                {renderGroup('unavailable', grouped.unavailable)}
                {renderGroup('pending', grouped.pending)}

                {availability.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                        Aún no hay datos de disponibilidad
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
