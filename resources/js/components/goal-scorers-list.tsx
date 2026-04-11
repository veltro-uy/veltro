import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import matchEvents from '@/routes/match-events';
import { router } from '@inertiajs/react';
import { Pencil, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
}

interface MatchEvent {
    id: number;
    team_id: number;
    user_id?: number;
    user?: User;
    event_type: string;
    minute?: number;
    description?: string;
}

interface GoalScorersListProps {
    events: MatchEvent[];
    teamId: number;
    isLeader: boolean;
    alignment: 'left' | 'right';
    matchStatus: string;
    onRecordGoal?: () => void;
}

export function GoalScorersList({
    events,
    teamId,
    isLeader,
    alignment,
    matchStatus,
    onRecordGoal,
}: GoalScorersListProps) {
    const [goalToDelete, setGoalToDelete] = useState<number | null>(null);

    // Ensure type consistency by converting both to numbers for comparison
    const goals = events
        .filter(
            (e) =>
                Number(e.team_id) === Number(teamId) && e.event_type === 'goal',
        )
        .sort((a, b) => (a.minute || 0) - (b.minute || 0));

    const handleDeleteEvent = () => {
        if (goalToDelete === null) return;
        router.delete(matchEvents.destroy(goalToDelete).url, {
            onSuccess: () => {
                setGoalToDelete(null);
                toast.success('Gol eliminado exitosamente');
            },
            onError: () => {
                setGoalToDelete(null);
                toast.error('Error al eliminar el gol');
            },
        });
    };

    if (goals.length === 0 && !isLeader) {
        return null;
    }

    return (
        <>
            <div
                className={cn(
                    'mt-2 max-h-28 space-y-1 overflow-y-auto',
                    alignment === 'right' ? 'text-right' : 'text-left',
                )}
            >
                {goals.map((goal) => (
                    <div
                        key={goal.id}
                        className={cn(
                            'group flex items-center gap-1.5 text-xs',
                            alignment === 'right'
                                ? 'flex-row-reverse justify-start'
                                : 'flex-row justify-start',
                        )}
                    >
                        <Target className="h-3 w-3 flex-shrink-0 text-green-600" />
                        <span
                            className={cn(
                                'truncate',
                                !goal.user && 'text-muted-foreground italic',
                            )}
                        >
                            {goal.user?.name || 'Sin asignar'}
                        </span>
                        <span className="text-muted-foreground">
                            {goal.minute}'
                        </span>
                        {isLeader &&
                            (matchStatus === 'in_progress' ||
                                matchStatus === 'completed') && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                                    aria-label="Eliminar gol"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setGoalToDelete(goal.id);
                                    }}
                                >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                            )}
                    </div>
                ))}

                {isLeader &&
                    (matchStatus === 'in_progress' ||
                        matchStatus === 'completed') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                                'mt-1 h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground',
                                alignment === 'right' && 'ml-auto',
                            )}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onRecordGoal?.();
                            }}
                        >
                            <Pencil className="h-3 w-3" />
                            <span>Registrar Gol</span>
                        </Button>
                    )}
            </div>

            <AlertDialog
                open={goalToDelete !== null}
                onOpenChange={(open) => {
                    if (!open) setGoalToDelete(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Eliminar Gol</AlertDialogTitle>
                        <AlertDialogDescription>
                            ¿Estás seguro de que quieres eliminar este gol? Esta
                            acción no se puede deshacer.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteEvent}
                            className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                        >
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
