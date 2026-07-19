import { JoinRequestDialog } from '@/components/join-request-dialog';
import { TeamAvatar } from '@/components/team-avatar';
import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarGroupCount,
    AvatarImage,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { VariantBadge } from '@/components/variant-badge';
import { cn } from '@/lib/utils';
import { variantMaxMembers } from '@/lib/variants';
import teams from '@/routes/teams';
import type { Team, TeamMember } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowRight, Crown, Shield, Star, UserPlus } from 'lucide-react';

interface TeamCardProps {
    team: Team;
    mode: 'mine' | 'discover';
    currentUserId: number;
}

const MAX_STACK = 5;

/** Green under 80%, orange at 80–99%, red at 100%. */
function capacityColor(pct: number): string {
    if (pct >= 100) return 'bg-destructive';
    if (pct >= 80) return 'bg-orange-500';
    return 'bg-primary';
}

/** First+last initial (or first two chars) — mirrors TeamAvatar's logic for people. */
function personInitials(name: string): string {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
        return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

/** Captain first, then co-captains, then players — so the crest of the squad leads the stack. */
const ROLE_ORDER: Record<string, number> = {
    captain: 0,
    co_captain: 1,
};

function orderedMembers(members: TeamMember[]): TeamMember[] {
    return [...members].sort(
        (a, b) => (ROLE_ORDER[a.role] ?? 2) - (ROLE_ORDER[b.role] ?? 2),
    );
}

function RoleBadge({ role }: { role: string }) {
    if (role === 'captain') {
        return (
            <Badge variant="default" className="gap-1">
                <Star className="h-3 w-3" />
                Capitán
            </Badge>
        );
    }
    if (role === 'co_captain') {
        return (
            <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Vice-Capitán
            </Badge>
        );
    }
    return <Badge variant="outline">Jugador</Badge>;
}

export function TeamCard({ team, mode, currentUserId }: TeamCardProps) {
    const members = team.team_members ?? [];
    const maxMembers = team.max_members ?? variantMaxMembers(team.variant);
    const currentMembers = members.length;
    const isFull = currentMembers >= maxMembers;
    const pct =
        maxMembers > 0
            ? Math.min(100, Math.round((currentMembers / maxMembers) * 100))
            : 0;

    const ordered = orderedMembers(members);
    const captain = ordered.find((m) => m.role === 'captain');
    const userMembership =
        mode === 'mine'
            ? members.find((m) => m.user_id === currentUserId)
            : undefined;

    const stack = ordered.slice(0, MAX_STACK);
    const overflow = currentMembers - stack.length;

    return (
        <Card className="group flex flex-col overflow-hidden transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
            <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                    <TeamAvatar
                        name={team.name}
                        logoUrl={team.logo_url}
                        size="lg"
                    />
                    <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-1 text-base">
                            {team.name}
                        </CardTitle>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <VariantBadge variant={team.variant} />
                            {userMembership && (
                                <RoleBadge role={userMembership.role} />
                            )}
                        </div>
                        {captain?.user && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Crown className="h-3.5 w-3.5 text-primary/80" />
                                <span className="truncate">
                                    Capitán · {captain.user.name}
                                </span>
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4">
                {team.description ? (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                        {team.description}
                    </p>
                ) : (
                    mode === 'discover' && (
                        <p className="text-sm text-muted-foreground/60 italic">
                            Sin descripción
                        </p>
                    )
                )}

                {/* Squad strip — the signature: who's here + how full the roster is. */}
                <div className="mt-auto flex items-center justify-between gap-3">
                    {currentMembers > 0 ? (
                        <AvatarGroup>
                            {stack.map((member) => (
                                <Avatar key={member.id} size="sm">
                                    {member.user?.avatar_url && (
                                        <AvatarImage
                                            src={member.user.avatar_url}
                                            alt={member.user.name}
                                        />
                                    )}
                                    <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                                        {personInitials(
                                            member.user?.name ?? '?',
                                        )}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                            {overflow > 0 && (
                                <AvatarGroupCount>+{overflow}</AvatarGroupCount>
                            )}
                        </AvatarGroup>
                    ) : (
                        <span className="text-xs text-muted-foreground/60 italic">
                            Sin jugadores aún
                        </span>
                    )}

                    <div className="min-w-0 flex-1 text-right">
                        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                            Plantilla{' '}
                            <span className="font-bold text-foreground tabular-nums">
                                {currentMembers}
                            </span>
                            <span className="tabular-nums">/{maxMembers}</span>
                            {isFull && (
                                <span className="ml-1 text-destructive">
                                    · Completo
                                </span>
                            )}
                        </span>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-500',
                                    capacityColor(pct),
                                )}
                                style={{ width: `${Math.max(pct, 4)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    {mode === 'mine' ? (
                        <Button asChild variant="outline" className="w-full">
                            <Link href={teams.show(team.public_id).url}>
                                Ver equipo
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    ) : isFull ? (
                        <>
                            <Button
                                disabled
                                variant="secondary"
                                className="flex-1"
                            >
                                Completo
                            </Button>
                            <Button asChild variant="outline">
                                <Link href={teams.show(team.public_id).url}>
                                    Ver
                                </Link>
                            </Button>
                        </>
                    ) : (
                        <>
                            <JoinRequestDialog
                                teamId={team.id}
                                teamName={team.name}
                                trigger={
                                    <Button className="flex-1">
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Solicitar
                                    </Button>
                                }
                            />
                            <Button asChild variant="outline">
                                <Link href={teams.show(team.public_id).url}>
                                    Ver
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
