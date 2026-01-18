import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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
import { UserAvatar } from '@/components/user-avatar';
import matchEvents from '@/routes/match-events';
import { router, useForm } from '@inertiajs/react';
import { Clock, Plus, Target, Trash2 } from 'lucide-react';
import { useState } from 'react';
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

interface MatchEvent {
    id: number;
    team_id: number;
    user_id?: number;
    user?: User;
    event_type: string;
    minute?: number;
    description?: string;
}

interface Team {
    id: number;
    name: string;
}

interface Match {
    id: number;
    home_team_id: number;
    away_team_id?: number;
    status: string;
    home_team: Team;
    away_team?: Team;
}

interface Props {
    match: Match;
    homeLineup: LineupPlayer[];
    awayLineup: LineupPlayer[];
    events: MatchEvent[];
    isHomeLeader: boolean;
    isAwayLeader: boolean;
}

export function MatchEventsManager({
    match,
    homeLineup,
    awayLineup,
    events,
    isHomeLeader,
    isAwayLeader,
}: Props) {
    const [open, setOpen] = useState(false);
    const canManage = isHomeLeader || isAwayLeader;

    // Determine which team the user can manage
    const managingTeamId = isHomeLeader
        ? match.home_team_id
        : match.away_team_id;
    const managingTeamName = isHomeLeader
        ? match.home_team.name
        : match.away_team?.name;
    const availablePlayers = isHomeLeader ? homeLineup : awayLineup;

    const { data, setData, post, processing, reset } = useForm({
        match_id: match.id,
        team_id: managingTeamId?.toString() || '',
        user_id: '',
        event_type: 'goal',
        minute: '',
        description: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(matchEvents.store().url, {
            onSuccess: () => {
                toast.success('Goal recorded successfully!');
                setOpen(false);
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

    const handleDeleteEvent = (eventId: number) => {
        router.delete(matchEvents.destroy(eventId).url, {
            onSuccess: () => {
                toast.success('Event deleted successfully');
            },
            onError: () => {
                toast.error('Failed to delete event');
            },
        });
    };

    // Group events by team
    const homeEvents = events.filter(
        (e) => e.team_id === match.home_team_id && e.event_type === 'goal',
    );
    const awayEvents = events.filter(
        (e) => e.team_id === match.away_team_id && e.event_type === 'goal',
    );

    const renderEventsList = (
        teamEvents: MatchEvent[],
        teamName: string,
        canDelete: boolean,
    ) => {
        if (teamEvents.length === 0) {
            return (
                <p className="text-sm text-muted-foreground">
                    No goals recorded yet
                </p>
            );
        }

        return (
            <div className="space-y-1.5">
                {teamEvents
                    .sort((a, b) => (a.minute || 0) - (b.minute || 0))
                    .map((event) => (
                        <div
                            key={event.id}
                            className="flex items-center justify-between rounded-lg border bg-card p-2"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-2">
                                {event.user && (
                                    <UserAvatar
                                        name={event.user.name}
                                        size="sm"
                                    />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-medium">
                                        {event.user?.name || 'Unknown Player'}
                                    </p>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        <span>{event.minute}'</span>
                                    </div>
                                </div>
                                <Target className="h-4 w-4 flex-shrink-0 text-green-600" />
                            </div>
                            {canDelete && match.status === 'completed' && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEvent(event.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    ))}
            </div>
        );
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Match Events</CardTitle>
                        <CardDescription>
                            Record all goals scored during the match
                        </CardDescription>
                    </div>
                    {canManage && match.status === 'completed' && (
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Record Goal
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <form onSubmit={handleSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>Record Goal</DialogTitle>
                                        <DialogDescription>
                                            Record a goal for {managingTeamName}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="user_id">
                                                Player
                                            </Label>
                                            <Select
                                                value={data.user_id}
                                                onValueChange={(value) =>
                                                    setData('user_id', value)
                                                }
                                            >
                                                <SelectTrigger id="user_id">
                                                    <SelectValue placeholder="Select player who scored" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {availablePlayers.map(
                                                        (player) => (
                                                            <SelectItem
                                                                key={
                                                                    player.user_id
                                                                }
                                                                value={player.user_id.toString()}
                                                            >
                                                                {
                                                                    player.user
                                                                        .name
                                                                }
                                                            </SelectItem>
                                                        ),
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="minute">
                                                Minute
                                            </Label>
                                            <Input
                                                id="minute"
                                                type="number"
                                                min="1"
                                                max="120"
                                                placeholder="e.g., 23"
                                                value={data.minute}
                                                onChange={(e) =>
                                                    setData(
                                                        'minute',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="description">
                                                Description (Optional)
                                            </Label>
                                            <Input
                                                id="description"
                                                type="text"
                                                placeholder="e.g., Header from corner"
                                                value={data.description}
                                                onChange={(e) =>
                                                    setData(
                                                        'description',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Recording...'
                                                : 'Record Goal'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <h4 className="mb-2 text-xs font-semibold">
                        {match.home_team.name}
                    </h4>
                    {renderEventsList(
                        homeEvents,
                        match.home_team.name,
                        isHomeLeader,
                    )}
                </div>
                {match.away_team && (
                    <div>
                        <h4 className="mb-2 text-xs font-semibold">
                            {match.away_team.name}
                        </h4>
                        {renderEventsList(
                            awayEvents,
                            match.away_team.name,
                            isAwayLeader,
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
