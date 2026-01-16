import { AlertCircle, Check, HelpCircle, Loader2, X } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import type { AvailabilityStats } from '@/types';

interface AvailabilityStatsProps {
    stats: AvailabilityStats;
    teamName: string;
    isLeader?: boolean;
}

export function AvailabilityStatsComponent({ stats, teamName, isLeader = false }: AvailabilityStatsProps) {
    const hasEnoughPlayers = stats.available >= stats.minimum;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                    <span>Resumen {teamName}</span>
                    <span className={hasEnoughPlayers ? 'text-green-600' : 'text-red-600'}>
                        {stats.available}/{stats.minimum}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Alerta si no hay suficientes jugadores */}
                {!hasEnoughPlayers && isLeader && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Jugadores Insuficientes</AlertTitle>
                        <AlertDescription>
                            Necesitas al menos {stats.minimum} jugadores confirmados. Actualmente solo{' '}
                            {stats.available} disponibles.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Barra de progreso */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Confirmados Disponibles</span>
                        <span className="font-medium">
                            {stats.available} / {stats.minimum} requeridos
                        </span>
                    </div>
                    <Progress
                        value={(stats.available / stats.minimum) * 100}
                        className="h-2"
                    />
                </div>

                {/* Desglose de estadísticas */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            <span className="text-xs font-medium">Disponibles</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold">{stats.available}</p>
                    </div>

                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
                        <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                            <HelpCircle className="h-4 w-4" />
                            <span className="text-xs font-medium">Tal vez</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold">{stats.maybe}</p>
                    </div>

                    <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                            <X className="h-4 w-4" />
                            <span className="text-xs font-medium">No Disponibles</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold">{stats.unavailable}</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Loader2 className="h-4 w-4" />
                            <span className="text-xs font-medium">Pendientes</span>
                        </div>
                        <p className="mt-1 text-2xl font-bold">{stats.pending}</p>
                    </div>
                </div>

                {/* Texto de resumen */}
                <p className="text-center text-sm text-muted-foreground">
                    {stats.total} miembros del equipo en total
                </p>
            </CardContent>
        </Card>
    );
}
