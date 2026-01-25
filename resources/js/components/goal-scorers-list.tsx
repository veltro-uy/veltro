import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import matchEvents from '@/routes/match-events';
import { router } from '@inertiajs/react';
import { Pencil, Target, Trash2 } from 'lucide-react';
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
    const goals = events
        .filter((e) => e.team_id === teamId && e.event_type === 'goal')
        .sort((a, b) => (a.minute || 0) - (b.minute || 0));

    const handleDeleteEvent = (eventId: number) => {
        router.delete(matchEvents.destroy(eventId).url, {
            onSuccess: () => {
                toast.success('Gol eliminado exitosamente');
            },
            onError: () => {
                toast.error('Error al eliminar el gol');
            },
        });
    };

    if (goals.length === 0 && !isLeader) {
        return null;
    }

    return (
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
                    <span className="truncate">
                        {goal.user?.name || 'Jugador Desconocido'}
                    </span>
                    <span className="text-muted-foreground">
                        {goal.minute}'
                    </span>
                    {isLeader && matchStatus === 'completed' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteEvent(goal.id);
                            }}
                        >
                            <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                    )}
                </div>
            ))}

            {isLeader && matchStatus === 'completed' && (
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
    );
}
