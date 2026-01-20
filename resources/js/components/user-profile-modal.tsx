import { TeamAvatar } from '@/components/team-avatar';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/user-avatar';
import { VariantBadge } from '@/components/variant-badge';
import type { Team, UserProfile, UserStatistics } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, MapPin, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserProfileModalProps {
    userId: number;
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfileModal({
    userId,
    isOpen,
    onClose,
}: UserProfileModalProps) {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        }
    }, [isOpen, userId]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                throw new Error('Error al cargar el perfil');
            }
            const data = await response.json();
            setProfile({
                ...data.user,
                statistics: data.statistics,
                teams: data.teams,
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al cargar el perfil',
            );
        } finally {
            setLoading(false);
        }
    };

    const formatMemberSince = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, 'MMMM yyyy', { locale: es });
        } catch {
            return dateString;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Perfil de usuario</DialogTitle>
                </DialogHeader>

                {loading && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-20 w-20 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-40" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        </div>
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                )}

                {error && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm text-destructive">
                        {error}
                    </div>
                )}

                {!loading && !error && profile && (
                    <div className="space-y-6">
                        {/* Header with Avatar and Basic Info */}
                        <div className="flex items-start gap-4">
                            <UserAvatar
                                name={profile.name}
                                avatarUrl={profile.avatar_url}
                                size="lg"
                                className="h-20 w-20"
                            />
                            <div className="flex-1 space-y-2">
                                <h2 className="text-2xl font-bold">
                                    {profile.name}
                                </h2>
                                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                    {profile.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4" />
                                            <span>{profile.location}</span>
                                        </div>
                                    )}
                                    {profile.age && (
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{profile.age} años</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bio Section */}
                        {profile.bio && (
                            <div className="space-y-2">
                                <h3 className="font-semibold">Acerca de</h3>
                                <p className="text-sm text-muted-foreground">
                                    {profile.bio}
                                </p>
                            </div>
                        )}

                        {/* Statistics */}
                        <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/50 p-4">
                            <div className="space-y-1 text-center">
                                <div className="text-2xl font-bold">
                                    {profile.statistics.teams_count}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Equipos
                                </div>
                            </div>
                            <div className="space-y-1 text-center">
                                <div className="text-2xl font-bold">
                                    {profile.statistics.matches_played}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Partidos
                                </div>
                            </div>
                            <div className="space-y-1 text-center">
                                <div className="text-sm font-semibold">
                                    {formatMemberSince(
                                        profile.statistics.member_since,
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Miembro desde
                                </div>
                            </div>
                        </div>

                        {/* Teams List */}
                        <div className="space-y-3">
                            <h3 className="flex items-center gap-2 font-semibold">
                                <Users className="h-4 w-4" />
                                Equipos
                            </h3>
                            {profile.teams && profile.teams.length > 0 ? (
                                <div className="space-y-2">
                                    {profile.teams.map((team: Team) => (
                                        <div
                                            key={team.id}
                                            className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
                                        >
                                            <TeamAvatar
                                                name={team.name}
                                                logoUrl={team.logo_url}
                                                size="md"
                                            />
                                            <div className="flex-1">
                                                <div className="font-medium">
                                                    {team.name}
                                                </div>
                                            </div>
                                            <VariantBadge
                                                variant={team.variant}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-sm text-muted-foreground">
                                    No es miembro de ningún equipo todavía
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
