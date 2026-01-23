import {
    AlertCircle,
    Check,
    ChevronDown,
    HelpCircle,
    Loader2,
    Users,
    X,
} from 'lucide-react';
import { useState } from 'react';

import { TeamAvatar } from '@/components/team-avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserAvatar } from '@/components/user-avatar';
import { UserNameLink } from '@/components/user-name-link';

import type {
    AvailabilityStats,
    AvailabilityStatus,
    MatchAvailability,
} from '@/types';

interface TeamData {
    id: number;
    name: string;
    logo_url?: string;
}

interface TeamAvailabilityData {
    team: TeamData;
    stats: AvailabilityStats;
    availability: MatchAvailability[];
    isLeader: boolean;
}

interface AvailabilityPanelProps {
    homeTeam: TeamAvailabilityData;
    awayTeam?: TeamAvailabilityData;
}

const statusConfig = {
    available: {
        icon: Check,
        label: 'Disponibles',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900',
        borderColor: 'border-green-200 dark:border-green-900',
        lightBg: 'bg-green-50 dark:bg-green-950',
    },
    maybe: {
        icon: HelpCircle,
        label: 'Tal vez',
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
        borderColor: 'border-yellow-200 dark:border-yellow-900',
        lightBg: 'bg-yellow-50 dark:bg-yellow-950',
    },
    unavailable: {
        icon: X,
        label: 'No Disponibles',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900',
        borderColor: 'border-red-200 dark:border-red-900',
        lightBg: 'bg-red-50 dark:bg-red-950',
    },
    pending: {
        icon: Loader2,
        label: 'Pendientes',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900',
        borderColor: 'border-gray-200 dark:border-gray-800',
        lightBg: 'bg-gray-50 dark:bg-gray-900',
    },
};

function CompactStats({
    stats,
    isLeader,
}: {
    stats: AvailabilityStats;
    isLeader: boolean;
}) {
    const hasEnoughPlayers = stats.available >= stats.minimum;

    return (
        <div className="space-y-3">
            {!hasEnoughPlayers && isLeader && (
                <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle className="text-sm">
                        Jugadores Insuficientes
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                        Necesitas {stats.minimum - stats.available} jugador(es)
                        más.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Confirmados</span>
                    <span className="font-medium">
                        {stats.available} / {stats.minimum} requeridos
                    </span>
                </div>
                <Progress
                    value={Math.min(
                        (stats.available / stats.minimum) * 100,
                        100,
                    )}
                    className="h-1.5"
                />
            </div>

            <div className="grid grid-cols-4 gap-2">
                {(
                    ['available', 'maybe', 'unavailable', 'pending'] as const
                ).map((status) => {
                    const config = statusConfig[status];
                    const Icon = config.icon;
                    const count = stats[status];
                    return (
                        <div
                            key={status}
                            className={`rounded-md border ${config.borderColor} ${config.lightBg} p-2 text-center`}
                        >
                            <div
                                className={`flex items-center justify-center gap-1 ${config.color}`}
                            >
                                <Icon className="h-3 w-3" />
                            </div>
                            <p className="mt-0.5 text-lg font-bold">{count}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function PlayerStatusGroup({
    availability,
    status,
    defaultOpen = false,
}: {
    availability: MatchAvailability[];
    status: AvailabilityStatus;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const config = statusConfig[status];
    const Icon = config.icon;

    const filteredPlayers = availability.filter(
        (item) => item.status === status,
    );

    if (filteredPlayers.length === 0) return null;

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-muted/50">
                <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <span className="font-medium">{config.label}</span>
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                        {filteredPlayers.length}
                    </Badge>
                </div>
                <ChevronDown
                    className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="mt-1 space-y-1 pl-6">
                    {filteredPlayers.map((item) => (
                        <div
                            key={item.id}
                            className={`flex items-center gap-2 rounded-md ${config.bgColor} px-2 py-1.5`}
                        >
                            {item.user && (
                                <>
                                    <UserAvatar
                                        name={item.user.name}
                                        avatarUrl={item.user.avatar_url}
                                        size="sm"
                                        className="h-5 w-5"
                                    />
                                    <span className="text-sm">
                                        <UserNameLink user={item.user} />
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
            </CollapsibleContent>
        </Collapsible>
    );
}

function TeamContent({
    stats,
    availability,
    isLeader,
}: Omit<TeamAvailabilityData, 'team'>) {
    return (
        <div className="space-y-4">
            <CompactStats stats={stats} isLeader={isLeader} />

            {isLeader && availability.length > 0 && (
                <div className="space-y-1 border-t pt-3">
                    <PlayerStatusGroup
                        availability={availability}
                        status="available"
                        defaultOpen={true}
                    />
                    <PlayerStatusGroup
                        availability={availability}
                        status="maybe"
                    />
                    <PlayerStatusGroup
                        availability={availability}
                        status="unavailable"
                    />
                    <PlayerStatusGroup
                        availability={availability}
                        status="pending"
                    />
                </div>
            )}

            <p className="text-center text-xs text-muted-foreground">
                {stats.total} miembros del equipo
            </p>
        </div>
    );
}

export function AvailabilityPanel({
    homeTeam,
    awayTeam,
}: AvailabilityPanelProps) {
    // If no away team, render without tabs
    if (!awayTeam) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-4 w-4" />
                        Disponibilidad - {homeTeam.team.name}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <TeamContent {...homeTeam} />
                </CardContent>
            </Card>
        );
    }

    // With away team, use tabs
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    Disponibilidad
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Tabs defaultValue="home">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                            value="home"
                            className="flex items-center gap-2"
                        >
                            <TeamAvatar
                                name={homeTeam.team.name}
                                logoUrl={homeTeam.team.logo_url}
                                size="sm"
                                className="h-5 w-5 text-[10px]"
                            />
                            <span className="hidden truncate sm:inline">
                                {homeTeam.team.name}
                            </span>
                            <Badge
                                variant={
                                    homeTeam.stats.available >=
                                    homeTeam.stats.minimum
                                        ? 'default'
                                        : 'destructive'
                                }
                                className="ml-auto h-5 px-1.5 text-xs"
                            >
                                {homeTeam.stats.available}/
                                {homeTeam.stats.minimum}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="away"
                            className="flex items-center gap-2"
                        >
                            <TeamAvatar
                                name={awayTeam.team.name}
                                logoUrl={awayTeam.team.logo_url}
                                size="sm"
                                className="h-5 w-5 text-[10px]"
                            />
                            <span className="hidden truncate sm:inline">
                                {awayTeam.team.name}
                            </span>
                            <Badge
                                variant={
                                    awayTeam.stats.available >=
                                    awayTeam.stats.minimum
                                        ? 'default'
                                        : 'destructive'
                                }
                                className="ml-auto h-5 px-1.5 text-xs"
                            >
                                {awayTeam.stats.available}/
                                {awayTeam.stats.minimum}
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="home" className="mt-3">
                        <TeamContent {...homeTeam} />
                    </TabsContent>
                    <TabsContent value="away" className="mt-3">
                        <TeamContent {...awayTeam} />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
