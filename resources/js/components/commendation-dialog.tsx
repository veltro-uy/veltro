import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { usePage } from '@inertiajs/react';
import type {
    CommendationCategory,
    CommendationStats,
    SharedData,
} from '@/types';
import { Crown, SmilePlus, Trophy, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface CommendationDialogProps {
    userId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (stats: CommendationStats) => void;
}

export function CommendationDialog({
    userId,
    isOpen,
    onClose,
    onSuccess,
}: CommendationDialogProps) {
    const { auth } = usePage<SharedData>().props;
    const [selectedCategories, setSelectedCategories] = useState<
        CommendationCategory[]
    >([]);
    const [existingCommendations, setExistingCommendations] = useState<
        CommendationCategory[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const categories = [
        {
            key: 'friendly' as const,
            label: 'Amigable',
            description: 'Jugador amistoso y de buen trato',
            icon: SmilePlus,
            color: 'text-blue-500',
        },
        {
            key: 'skilled' as const,
            label: 'Habilidoso',
            description: 'Excelentes habilidades en el campo',
            icon: Trophy,
            color: 'text-yellow-500',
        },
        {
            key: 'teamwork' as const,
            label: 'Trabajo en equipo',
            description: 'Trabaja bien con el equipo',
            icon: Users,
            color: 'text-green-500',
        },
        {
            key: 'leadership' as const,
            label: 'Liderazgo',
            description: 'Lidera y motiva al equipo',
            icon: Crown,
            color: 'text-purple-500',
        },
    ];

    const fetchExistingCommendations = useCallback(async () => {
        if (!isOpen || !auth?.user) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/users/${userId}/commendations`);
            if (!response.ok) {
                throw new Error('Error al cargar reconocimientos');
            }
            await response.json();

            // Fetch user's given commendations to this user
            // We need to check which categories the current user has already given
            // This would require another endpoint or we can just try to commend and handle the error
            // For simplicity, we'll just track locally during this session
        } catch (error) {
            console.error('Error fetching commendations:', error);
        } finally {
            setLoading(false);
        }
    }, [userId, isOpen, auth]);

    useEffect(() => {
        if (isOpen) {
            fetchExistingCommendations();
            setSelectedCategories([]);
        }
    }, [isOpen, fetchExistingCommendations]);

    const toggleCategory = (category: CommendationCategory) => {
        if (existingCommendations.includes(category)) {
            return; // Can't toggle already given commendations
        }

        setSelectedCategories((prev) =>
            prev.includes(category)
                ? prev.filter((c) => c !== category)
                : [...prev, category],
        );
    };

    const handleSubmit = async () => {
        if (selectedCategories.length === 0) {
            toast.error('Selecciona al menos un reconocimiento');
            return;
        }

        setSubmitting(true);

        try {
            // Submit each category individually
            const promises = selectedCategories.map((category) =>
                fetch(`/api/users/${userId}/commendations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ category }),
                }),
            );

            const results = await Promise.allSettled(promises);

            // Check if any succeeded
            const succeeded = results.filter(
                (r) => r.status === 'fulfilled' && r.value.ok,
            );
            const failed = results.filter(
                (r) => r.status === 'rejected' || r.value.ok === false,
            );

            if (succeeded.length > 0) {
                // Get the last successful response for updated stats
                const lastSuccess = succeeded[succeeded.length - 1];
                if (lastSuccess.status === 'fulfilled') {
                    const data = await lastSuccess.value.json();
                    if (onSuccess && data.stats) {
                        onSuccess(data.stats);
                    }
                }

                toast.success(
                    `${succeeded.length} reconocimiento(s) enviado(s) exitosamente`,
                );

                // Add successful categories to existing commendations
                setExistingCommendations((prev) => [
                    ...prev,
                    ...selectedCategories.slice(0, succeeded.length),
                ]);
                setSelectedCategories([]);

                if (failed.length === 0) {
                    onClose();
                }
            }

            if (failed.length > 0) {
                toast.error(
                    `${failed.length} reconocimiento(s) no se pudieron enviar`,
                );
            }
        } catch (error) {
            toast.error('Error al enviar reconocimientos');
            console.error('Error submitting commendations:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Reconocer jugador</DialogTitle>
                    <DialogDescription>
                        Selecciona los aspectos por los que quieres reconocer a
                        este jugador
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const isExisting =
                            existingCommendations.includes(category.key);
                        const isSelected = selectedCategories.includes(
                            category.key,
                        );

                        return (
                            <button
                                key={category.key}
                                onClick={() => toggleCategory(category.key)}
                                disabled={isExisting || loading || submitting}
                                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                    isExisting
                                        ? 'cursor-not-allowed border-muted bg-muted/50 opacity-50'
                                        : isSelected
                                          ? 'border-primary bg-primary/10'
                                          : 'hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon
                                        className={`mt-0.5 h-5 w-5 ${category.color}`}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">
                                                {category.label}
                                            </span>
                                            {isExisting && (
                                                <span className="text-xs text-muted-foreground">
                                                    (Ya reconocido)
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={
                            selectedCategories.length === 0 ||
                            loading ||
                            submitting
                        }
                    >
                        {submitting
                            ? 'Enviando...'
                            : `Enviar ${selectedCategories.length > 0 ? `(${selectedCategories.length})` : ''}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
