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
import tournamentMatches from '@/routes/tournaments/matches';
import type { FootballMatch } from '@/types';
import { router } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

function toLocalDatetimeInputValue(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    const offsetMs = date.getTimezoneOffset() * 60_000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export function ScheduleMatchDialog({
    match,
    tournamentId,
    open,
    onOpenChange,
}: {
    match: FootballMatch | null;
    tournamentId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                {match && (
                    <ScheduleMatchForm
                        key={match.id}
                        match={match}
                        tournamentId={tournamentId}
                        onClose={() => onOpenChange(false)}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}

function ScheduleMatchForm({
    match,
    tournamentId,
    onClose,
}: {
    match: FootballMatch;
    tournamentId: number;
    onClose: () => void;
}) {
    const [scheduledAt, setScheduledAt] = useState(() =>
        toLocalDatetimeInputValue(match.scheduled_at),
    );
    const [location, setLocation] = useState(() => match.location ?? '');
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        router.patch(
            tournamentMatches.update([tournamentId, match.id]).url,
            {
                scheduled_at: scheduledAt || null,
                location: location.trim() || null,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    onClose();
                },
                onError: (errs) => {
                    setErrors(errs as Record<string, string>);
                    toast.error('Revisá los datos del partido.');
                },
                onFinish: () => setSubmitting(false),
            },
        );
    };

    const homeName = match.home_team?.name ?? 'Por definir';
    const awayName = match.away_team?.name ?? 'Por definir';

    return (
        <>
            <DialogHeader>
                <DialogTitle>Programar partido</DialogTitle>
                <DialogDescription>
                    {homeName} vs {awayName}
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="scheduled_at">Fecha y hora</Label>
                    <Input
                        id="scheduled_at"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                    />
                    {errors.scheduled_at && (
                        <p className="text-sm text-destructive">
                            {errors.scheduled_at}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="location">Cancha</Label>
                    <Input
                        id="location"
                        type="text"
                        placeholder="Ej: Cancha 3 - Complejo Norte"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        maxLength={255}
                    />
                    {errors.location && (
                        <p className="text-sm text-destructive">
                            {errors.location}
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                        {submitting ? (
                            <Loader2 className="size-4 animate-spin" />
                        ) : (
                            'Guardar'
                        )}
                    </Button>
                </DialogFooter>
            </form>
        </>
    );
}
