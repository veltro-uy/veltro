import { router } from '@inertiajs/react';
import { Check, HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { AvailabilityStatus, MatchAvailability } from '@/types';

interface AvailabilitySelectorProps {
    matchId: number;
    teamId: number;
    currentStatus?: MatchAvailability;
    onUpdate?: () => void;
}

export function AvailabilitySelector({
    matchId,
    teamId,
    currentStatus,
    onUpdate,
}: AvailabilitySelectorProps) {
    const [status, setStatus] = useState<AvailabilityStatus>(
        currentStatus?.status ?? 'pending',
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        setIsSubmitting(true);

        router.post(
            `/matches/${matchId}/availability`,
            {
                status,
                team_id: teamId,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onUpdate?.();
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    const hasChanged = status !== (currentStatus?.status ?? 'pending');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Confirma tu Disponibilidad</CardTitle>
                <CardDescription>
                    Informa a tu equipo si podrás asistir al partido
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <RadioGroup
                    value={status}
                    onValueChange={(value) =>
                        setStatus(value as AvailabilityStatus)
                    }
                >
                    <div className="flex items-center space-x-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950">
                        <RadioGroupItem value="available" id="available" />
                        <Label
                            htmlFor="available"
                            className="flex flex-1 cursor-pointer items-center gap-2"
                        >
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <div>
                                <div className="font-medium">Disponible</div>
                                <div className="text-sm text-muted-foreground">
                                    Estaré presente
                                </div>
                            </div>
                        </Label>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
                        <RadioGroupItem value="maybe" id="maybe" />
                        <Label
                            htmlFor="maybe"
                            className="flex flex-1 cursor-pointer items-center gap-2"
                        >
                            <HelpCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <div>
                                <div className="font-medium">Tal vez</div>
                                <div className="text-sm text-muted-foreground">
                                    No estoy seguro aún
                                </div>
                            </div>
                        </Label>
                    </div>

                    <div className="flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
                        <RadioGroupItem value="unavailable" id="unavailable" />
                        <Label
                            htmlFor="unavailable"
                            className="flex flex-1 cursor-pointer items-center gap-2"
                        >
                            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                            <div>
                                <div className="font-medium">No Disponible</div>
                                <div className="text-sm text-muted-foreground">
                                    No podré asistir
                                </div>
                            </div>
                        </Label>
                    </div>
                </RadioGroup>

                <Button
                    onClick={handleSubmit}
                    disabled={!hasChanged || isSubmitting}
                    className="w-full"
                >
                    {isSubmitting
                        ? 'Actualizando...'
                        : 'Actualizar Disponibilidad'}
                </Button>

                {currentStatus?.confirmed_at && (
                    <p className="text-center text-sm text-muted-foreground">
                        Última actualización:{' '}
                        {new Date(
                            currentStatus.confirmed_at,
                        ).toLocaleDateString('es-ES')}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
