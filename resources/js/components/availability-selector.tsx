import { router } from '@inertiajs/react';
import { Check, HelpCircle, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

import type { AvailabilityStatus, MatchAvailability } from '@/types';

interface AvailabilitySelectorProps {
    matchId: number;
    currentStatus?: MatchAvailability;
    onUpdate?: () => void;
}

function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'hace un momento';
    if (diffMins < 60) return `hace ${diffMins}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    if (diffDays < 7) return `hace ${diffDays}d`;

    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
    });
}

export function AvailabilitySelector({
    matchId,
    currentStatus,
    onUpdate,
}: AvailabilitySelectorProps) {
    const [status, setStatus] = useState<AvailabilityStatus>(
        currentStatus?.status ?? 'pending',
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleStatusChange = (newStatus: string) => {
        if (!newStatus || newStatus === status) return;

        const previousStatus = status;
        setStatus(newStatus as AvailabilityStatus);
        setIsSubmitting(true);

        router.post(
            `/matches/${matchId}/availability`,
            {
                status: newStatus,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Disponibilidad actualizada');
                    onUpdate?.();
                },
                onError: () => {
                    setStatus(previousStatus);
                    toast.error('Error al actualizar disponibilidad');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">Tu Disponibilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <ToggleGroup
                    type="single"
                    value={status === 'pending' ? '' : status}
                    onValueChange={handleStatusChange}
                    disabled={isSubmitting}
                    className="w-full"
                    variant="outline"
                >
                    <ToggleGroupItem
                        value="available"
                        className="flex-1 gap-1.5 data-[state=on]:border-green-500 data-[state=on]:bg-green-100 data-[state=on]:text-green-700 dark:data-[state=on]:border-green-600 dark:data-[state=on]:bg-green-950 dark:data-[state=on]:text-green-400"
                        aria-label="Disponible"
                    >
                        <Check className="h-4 w-4" />
                        <span className="hidden sm:inline">Voy</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="maybe"
                        className="flex-1 gap-1.5 data-[state=on]:border-yellow-500 data-[state=on]:bg-yellow-100 data-[state=on]:text-yellow-700 dark:data-[state=on]:border-yellow-600 dark:data-[state=on]:bg-yellow-950 dark:data-[state=on]:text-yellow-400"
                        aria-label="Tal vez"
                    >
                        <HelpCircle className="h-4 w-4" />
                        <span className="hidden sm:inline">Quizás</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                        value="unavailable"
                        className="flex-1 gap-1.5 data-[state=on]:border-red-500 data-[state=on]:bg-red-100 data-[state=on]:text-red-700 dark:data-[state=on]:border-red-600 dark:data-[state=on]:bg-red-950 dark:data-[state=on]:text-red-400"
                        aria-label="No disponible"
                    >
                        <X className="h-4 w-4" />
                        <span className="hidden sm:inline">No voy</span>
                    </ToggleGroupItem>
                </ToggleGroup>

                {isSubmitting && (
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Actualizando...</span>
                    </div>
                )}

                {!isSubmitting && currentStatus?.confirmed_at && (
                    <p className="text-center text-xs text-muted-foreground">
                        Actualizado{' '}
                        {formatRelativeTime(currentStatus.confirmed_at)}
                    </p>
                )}

                {!isSubmitting && status === 'pending' && (
                    <p className="text-center text-xs text-muted-foreground">
                        Selecciona tu disponibilidad
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
