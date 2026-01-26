import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserAvatar } from '@/components/user-avatar';
import { UserNameLink } from '@/components/user-name-link';
import AppLayout from '@/layouts/app-layout';
import matches from '@/routes/matches';
import type { BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
}

interface TeamMember {
    id: number;
    user_id: number;
    user: User;
    position?: string;
}

interface Team {
    id: number;
    name: string;
    variant: string;
    team_members: TeamMember[];
}

interface Match {
    id: number;
    home_team_id: number;
    away_team_id?: number;
    status: string;
}

interface LineupPlayer {
    id: number;
    user_id: number;
    position?: string;
    user: User;
}

interface Props {
    match: Match;
    team: Team;
    currentLineup: LineupPlayer[];
    minimumPlayers: number;
}

export default function Lineup({
    match,
    team,
    currentLineup,
    minimumPlayers,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Matches',
            href: matches.index().url,
        },
        {
            title: 'Lineup',
            href: matches.lineup.edit(match.id).url,
        },
    ];

    const [selectedPlayers, setSelectedPlayers] = useState<
        Array<{ user_id: number; position: string | null; is_starter: boolean }>
    >(
        currentLineup.map((p) => ({
            user_id: p.user_id,
            position: p.position || null,
            is_starter: true,
        })),
    );

    const handleTogglePlayer = (userId: number) => {
        setSelectedPlayers((prev) => {
            const existing = prev.find((p) => p.user_id === userId);
            if (existing) {
                return prev.filter((p) => p.user_id !== userId);
            }
            return [
                ...prev,
                { user_id: userId, position: null, is_starter: true },
            ];
        });
    };

    const handlePositionChange = (userId: number, position: string) => {
        setSelectedPlayers((prev) =>
            prev.map((p) =>
                p.user_id === userId ? { ...p, position: position || null } : p,
            ),
        );
    };

    const handleSubmit = () => {
        const players = selectedPlayers.map((p) => ({
            user_id: p.user_id,
            position: p.position,
            is_starter: true,
            is_substitute: false,
        }));

        router.post(
            matches.lineup.update(match.id).url,
            {
                team_id: team.id,
                players: players,
            },
            {
                onSuccess: () => {
                    toast.success('Lineup updated successfully!');
                    router.visit(matches.show(match.id).url);
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    if (firstError) {
                        toast.error(firstError as string);
                    }
                },
            },
        );
    };

    const isPlayerSelected = (userId: number) => {
        return selectedPlayers.some((p) => p.user_id === userId);
    };

    const getPlayerPosition = (userId: number): string => {
        const player = selectedPlayers.find((p) => p.user_id === userId);
        return player?.position || '';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Select Lineup" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Select Lineup
                    </h1>
                    <p className="text-muted-foreground">
                        Choose at least {minimumPlayers} players for your
                        starting lineup
                    </p>
                </div>

                <Card className="max-w-3xl">
                    <CardHeader>
                        <CardTitle>{team.name} - Starting Lineup</CardTitle>
                        <CardDescription>
                            Selected {selectedPlayers.length} / {minimumPlayers}{' '}
                            minimum players
                            {selectedPlayers.length < minimumPlayers && (
                                <span className="mt-1 block text-amber-600 dark:text-amber-500">
                                    ⚠️ Below minimum recommended players
                                </span>
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {team.team_members.map((member) => {
                            const isSelected = isPlayerSelected(member.user_id);
                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-4 rounded-lg border p-4"
                                >
                                    <Checkbox
                                        id={`player-${member.user_id}`}
                                        checked={isSelected}
                                        onCheckedChange={() =>
                                            handleTogglePlayer(member.user_id)
                                        }
                                    />
                                    <UserAvatar
                                        name={member.user.name}
                                        size="md"
                                    />
                                    <div className="flex-1">
                                        <Label
                                            htmlFor={`player-${member.user_id}`}
                                            className="cursor-pointer font-medium"
                                        >
                                            <UserNameLink user={member.user} />
                                        </Label>
                                    </div>
                                    {isSelected && (
                                        <div className="w-40">
                                            <Select
                                                value={getPlayerPosition(
                                                    member.user_id,
                                                )}
                                                onValueChange={(value) =>
                                                    handlePositionChange(
                                                        member.user_id,
                                                        value,
                                                    )
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Position" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="goalkeeper">
                                                        Goalkeeper
                                                    </SelectItem>
                                                    <SelectItem value="defender">
                                                        Defender
                                                    </SelectItem>
                                                    <SelectItem value="midfielder">
                                                        Midfielder
                                                    </SelectItem>
                                                    <SelectItem value="forward">
                                                        Forward
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="flex gap-3 pt-4">
                            <Button
                                onClick={handleSubmit}
                                disabled={selectedPlayers.length === 0}
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Save Lineup
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    router.visit(matches.show(match.id).url)
                                }
                            >
                                Cancel
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
