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
import { useForm } from '@inertiajs/react';
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
    availablePlayers: LineupPlayer[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RecordGoalDialog({
    matchId,
    teamId,
    teamName,
    availablePlayers,
    open,
    onOpenChange,
}: RecordGoalDialogProps) {
    const { data, setData, post, processing, reset } = useForm({
        match_id: matchId,
        team_id: teamId.toString(),
        user_id: '',
        event_type: 'goal',
        minute: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(matchEvents.store().url, {
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
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="user_id">Jugador</Label>
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
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Registrando...' : 'Registrar Gol'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
