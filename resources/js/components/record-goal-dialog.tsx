import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import matchEvents from '@/routes/match-events';
import { router, useForm } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
}

interface LineupPlayer {
    id: number;
    user_id: number;
    user: User;
}

interface RecordGoalDialogProps {
    matchId: number;
    teamId: number;
    teamName: string;
    teamScore: number;
    registeredGoals: number;
    availablePlayers: LineupPlayer[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RecordGoalDialog({
    matchId,
    teamId,
    teamName,
    teamScore,
    registeredGoals,
    availablePlayers,
    open,
    onOpenChange,
}: RecordGoalDialogProps) {
    const remainingGoals = teamScore - registeredGoals;
    const { data, setData, post, processing, reset } = useForm({
        match_id: matchId,
        team_id: teamId.toString(),
        user_id: '',
        event_type: 'goal',
        minute: '',
        description: '',
    });

    // Update team_id whenever teamId prop changes or dialog opens
    useEffect(() => {
        if (open && teamId) {
            setData('team_id', teamId.toString());
        }
    }, [open, teamId, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Prepare data, converting 'unassigned' to empty string
        const submitData = {
            ...data,
            user_id: data.user_id === 'unassigned' ? '' : data.user_id,
        };

        router.post(matchEvents.store().url, submitData, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('¡Gol registrado exitosamente!');
                onOpenChange(false);
                reset();
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                if (firstError) {
                    toast.error(firstError as string);
                }
            },
        });
    };

    const handleClose = () => {
        onOpenChange(false);
        reset();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Registrar Gol</DialogTitle>
                        <DialogDescription>
                            Registrar un gol para {teamName}
                            <span className="mt-2 block text-sm">
                                Marcador: {teamScore} goles | Registrados:{' '}
                                {registeredGoals} |
                                <span
                                    className={
                                        remainingGoals > 0
                                            ? 'font-semibold text-green-600 dark:text-green-500'
                                            : 'font-semibold text-red-600 dark:text-red-500'
                                    }
                                >
                                    {' '}
                                    {remainingGoals > 0
                                        ? `Disponibles: ${remainingGoals}`
                                        : 'No hay goles disponibles'}
                                </span>
                            </span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="user_id">Jugador (Opcional)</Label>
                            {availablePlayers.length > 0 ? (
                                <Select
                                    value={data.user_id}
                                    onValueChange={(value) =>
                                        setData('user_id', value)
                                    }
                                >
                                    <SelectTrigger id="user_id">
                                        <SelectValue placeholder="Seleccionar jugador que anotó" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">
                                            Sin asignar
                                        </SelectItem>
                                        {availablePlayers.map((player) => (
                                            <SelectItem
                                                key={player.user_id}
                                                value={player.user_id.toString()}
                                            >
                                                {player.user.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
                                    No hay jugadores en la alineación
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="minute">Minuto</Label>
                            <Input
                                id="minute"
                                type="number"
                                min="1"
                                max="120"
                                placeholder="ej. 23"
                                value={data.minute}
                                onChange={(e) =>
                                    setData('minute', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">
                                Descripción (Opcional)
                            </Label>
                            <Input
                                id="description"
                                type="text"
                                placeholder="ej. Cabezazo desde córner"
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || remainingGoals <= 0}
                        >
                            {processing
                                ? 'Registrando...'
                                : remainingGoals <= 0
                                  ? 'Límite alcanzado'
                                  : 'Registrar Gol'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
