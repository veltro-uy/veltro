import type { MatchEvent, MatchPageMatch } from '@/components/match/types';
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
import { AlertCircle, Target } from 'lucide-react';

interface CompleteMatchDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    match: MatchPageMatch;
    events: MatchEvent[];
    onConfirm: () => void;
}

export function CompleteMatchDialog({
    open,
    onOpenChange,
    match,
    events,
    onConfirm,
}: CompleteMatchDialogProps) {
    const homeScore = match.home_score ?? 0;
    const awayScore = match.away_score ?? 0;

    const homeRegisteredGoals = events.filter(
        (e) =>
            Number(e.team_id) === Number(match.home_team.id) &&
            e.event_type === 'goal',
    ).length;
    const awayRegisteredGoals = match.away_team
        ? events.filter(
              (e) =>
                  match.away_team &&
                  Number(e.team_id) === Number(match.away_team.id) &&
                  e.event_type === 'goal',
          ).length
        : 0;

    const hasScoreMismatch =
        homeRegisteredGoals !== homeScore ||
        (!!match.away_team && awayRegisteredGoals !== awayScore);

    const isTournamentDraw = !!match.tournament_id && homeScore === awayScore;

    const homeGoals = events
        .filter(
            (e) =>
                Number(e.team_id) === Number(match.home_team.id) &&
                e.event_type === 'goal',
        )
        .sort((a, b) => (a.minute || 0) - (b.minute || 0));

    const awayGoals = match.away_team
        ? events
              .filter(
                  (e) =>
                      match.away_team &&
                      Number(e.team_id) === Number(match.away_team.id) &&
                      e.event_type === 'goal',
              )
              .sort((a, b) => (a.minute || 0) - (b.minute || 0))
        : [];

    const hasAnyGoals = homeGoals.length + awayGoals.length > 0;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Completar Partido</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div className="space-y-4">
                            <p>
                                ¿Estás seguro de que quieres marcar este partido
                                como completado?
                            </p>

                            <div className="rounded-lg border bg-muted/50 p-4">
                                <div className="flex items-center justify-center gap-4 text-lg font-bold">
                                    <span>{match.home_team.name}</span>
                                    <span className="rounded-md bg-background px-3 py-1 text-2xl">
                                        {homeScore} - {awayScore}
                                    </span>
                                    <span>{match.away_team?.name}</span>
                                </div>

                                {hasAnyGoals && (
                                    <div className="mt-3 grid grid-cols-2 gap-4 border-t pt-3">
                                        <div className="space-y-1">
                                            {homeGoals.map((goal) => (
                                                <div
                                                    key={goal.id}
                                                    className="flex items-center gap-1.5 text-xs"
                                                >
                                                    <Target className="h-3 w-3 text-green-600" />
                                                    <span className="truncate">
                                                        {goal.user?.name ||
                                                            'Sin asignar'}
                                                    </span>
                                                    {goal.minute && (
                                                        <span className="text-muted-foreground">
                                                            {goal.minute}'
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-1">
                                            {awayGoals.map((goal) => (
                                                <div
                                                    key={goal.id}
                                                    className="flex items-center gap-1.5 text-xs"
                                                >
                                                    <Target className="h-3 w-3 text-green-600" />
                                                    <span className="truncate">
                                                        {goal.user?.name ||
                                                            'Sin asignar'}
                                                    </span>
                                                    {goal.minute && (
                                                        <span className="text-muted-foreground">
                                                            {goal.minute}'
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {homeScore === 0 && awayScore === 0 && (
                                <div className="flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    El partido terminará 0 - 0
                                </div>
                            )}

                            {hasScoreMismatch && (
                                <div className="flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    Los goles registrados no coinciden con el
                                    marcador
                                </div>
                            )}

                            {isTournamentDraw && (
                                <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-400">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    Los partidos de torneo no pueden terminar en
                                    empate. Actualiza el marcador.
                                </div>
                            )}
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isTournamentDraw}
                    >
                        Completar Partido
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
