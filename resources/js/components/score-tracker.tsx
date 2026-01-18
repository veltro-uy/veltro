import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import matches from '@/routes/matches';
import { useForm } from '@inertiajs/react';
import { Clock, Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Team {
    id: number;
    name: string;
}

interface Match {
    id: number;
    home_team_id: number;
    away_team_id?: number;
    home_score?: number;
    away_score?: number;
    status: string;
    scheduled_at: string;
    home_team: Team;
    away_team?: Team;
}

interface Props {
    match: Match;
    isLeader: boolean;
}

export function ScoreTracker({ match, isLeader }: Props) {
    const { data, setData, post, processing } = useForm({
        home_score: match.home_score ?? 0,
        away_score: match.away_score ?? 0,
    });

    const [countdown, setCountdown] = useState<string>('');
    const [matchHasStarted, setMatchHasStarted] = useState(false);

    // Calculate countdown and check if match has started
    useEffect(() => {
        const updateCountdown = () => {
            const matchTime = new Date(match.scheduled_at);
            const currentTime = new Date();
            const timeDiff = matchTime.getTime() - currentTime.getTime();

            if (timeDiff <= 0) {
                setMatchHasStarted(true);
                setCountdown('');
                return;
            }

            setMatchHasStarted(false);

            // Calculate time units
            const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
                (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            const minutes = Math.floor(
                (timeDiff % (1000 * 60 * 60)) / (1000 * 60),
            );
            const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

            // Format countdown string
            if (days > 0) {
                setCountdown(`${days}d ${hours}h ${minutes}m ${seconds}s`);
            } else if (hours > 0) {
                setCountdown(`${hours}h ${minutes}m ${seconds}s`);
            } else if (minutes > 0) {
                setCountdown(`${minutes}m ${seconds}s`);
            } else {
                setCountdown(`${seconds}s`);
            }
        };

        // Update immediately
        updateCountdown();

        // Update every second
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [match.scheduled_at]);

    useEffect(() => {
        setData({
            home_score: match.home_score ?? 0,
            away_score: match.away_score ?? 0,
        });
    }, [match.home_score, match.away_score, setData]);

    const handleUpdateScore = () => {
        post(matches.updateScore(match.id).url, {
            onSuccess: () => {
                toast.success('¡Marcador actualizado con éxito!');
            },
            onError: (errors) => {
                const firstError = Object.values(errors)[0];
                if (firstError) {
                    toast.error(firstError as string);
                }
            },
        });
    };

    const incrementHomeScore = () => {
        setData('home_score', data.home_score + 1);
    };

    const decrementHomeScore = () => {
        if (data.home_score > 0) {
            setData('home_score', data.home_score - 1);
        }
    };

    const incrementAwayScore = () => {
        setData('away_score', data.away_score + 1);
    };

    const decrementAwayScore = () => {
        if (data.away_score > 0) {
            setData('away_score', data.away_score - 1);
        }
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle>Marcador</CardTitle>
                {isLeader && match.status !== 'completed' && (
                    <CardDescription>
                        {!matchHasStarted
                            ? 'Las actualizaciones del marcador estarán disponibles cuando empiece el partido'
                            : 'Actualiza el marcador del partido a medida que avanza el juego'}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {!matchHasStarted &&
                    countdown &&
                    match.status !== 'completed' && (
                        <div className="mb-4 flex items-center justify-center gap-2 rounded-lg border bg-muted/50 p-3">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div className="text-center">
                                <p className="text-xs text-muted-foreground">
                                    El partido empieza en...
                                </p>
                                <p className="text-sm font-semibold">
                                    {countdown}
                                </p>
                            </div>
                        </div>
                    )}
                <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">
                            {match.home_team.name}
                        </p>
                        <div className="flex items-center gap-2">
                            {isLeader && match.status !== 'completed' && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={decrementHomeScore}
                                    disabled={
                                        processing ||
                                        data.home_score === 0 ||
                                        !matchHasStarted
                                    }
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                            )}
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-muted text-3xl font-bold">
                                {data.home_score}
                            </div>
                            {isLeader && match.status !== 'completed' && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={incrementHomeScore}
                                    disabled={processing || !matchHasStarted}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="text-xl font-bold text-muted-foreground">
                        -
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs font-medium text-muted-foreground">
                            {match.away_team?.name || 'Por confirmar'}
                        </p>
                        <div className="flex items-center gap-2">
                            {isLeader && match.status !== 'completed' && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={decrementAwayScore}
                                    disabled={
                                        processing ||
                                        data.away_score === 0 ||
                                        !matchHasStarted
                                    }
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                            )}
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 bg-muted text-3xl font-bold">
                                {data.away_score}
                            </div>
                            {isLeader && match.status !== 'completed' && (
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={incrementAwayScore}
                                    disabled={processing || !matchHasStarted}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {isLeader && match.status !== 'completed' && (
                    <div className="mt-4 flex justify-center">
                        <Button
                            onClick={handleUpdateScore}
                            disabled={
                                processing ||
                                !matchHasStarted ||
                                (data.home_score === match.home_score &&
                                    data.away_score === match.away_score)
                            }
                        >
                            {processing
                                ? 'Actualizando...'
                                : !matchHasStarted
                                  ? 'Partido No Iniciado'
                                  : 'Actualizar Marcador'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
