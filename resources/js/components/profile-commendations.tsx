import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CommendationStats } from '@/types';
import { Award, Crown, SmilePlus, Trophy, Users } from 'lucide-react';
import { useState } from 'react';
import { CommendationDialog } from './commendation-dialog';

interface ProfileCommendationsProps {
    userId: number;
    stats: CommendationStats;
    canCommend?: boolean;
    onStatsUpdate?: (stats: CommendationStats) => void;
}

export function ProfileCommendations({
    userId,
    stats,
    canCommend = false,
    onStatsUpdate,
}: ProfileCommendationsProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    const categories = [
        {
            key: 'friendly' as const,
            label: 'Amigable',
            icon: SmilePlus,
            color: 'text-blue-500',
        },
        {
            key: 'skilled' as const,
            label: 'Habilidoso',
            icon: Trophy,
            color: 'text-yellow-500',
        },
        {
            key: 'teamwork' as const,
            label: 'Trabajo en equipo',
            icon: Users,
            color: 'text-green-500',
        },
        {
            key: 'leadership' as const,
            label: 'Liderazgo',
            icon: Crown,
            color: 'text-purple-500',
        },
    ];

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Award className="h-4 w-4" />
                        Reconocimientos
                    </CardTitle>
                    {canCommend && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Award className="mr-2 h-4 w-4" />
                            Reconocer
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                        {categories.map((category) => {
                            const Icon = category.icon;
                            return (
                                <div
                                    key={category.key}
                                    className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3"
                                >
                                    <Icon
                                        className={`h-5 w-5 ${category.color}`}
                                    />
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">
                                            {category.label}
                                        </div>
                                        <div className="text-2xl font-bold">
                                            {stats[category.key]}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {stats.total === 0 && (
                        <p className="mt-3 text-center text-sm text-muted-foreground">
                            No hay reconocimientos todavía
                        </p>
                    )}
                </CardContent>
            </Card>

            {canCommend && (
                <CommendationDialog
                    userId={userId}
                    isOpen={dialogOpen}
                    onClose={() => setDialogOpen(false)}
                    onSuccess={(newStats) => {
                        if (onStatsUpdate) {
                            onStatsUpdate(newStats);
                        }
                    }}
                />
            )}
        </>
    );
}
