import { AddCommentForm } from '@/components/add-comment-form';
import { ProfileCommendations } from '@/components/profile-commendations';
import { ProfileComments } from '@/components/profile-comments';
import { TeamAvatar } from '@/components/team-avatar';
import { UserAvatar } from '@/components/user-avatar';
import { VariantBadge } from '@/components/variant-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { edit } from '@/routes/profile';
import { Head, Link } from '@inertiajs/react';
import type {
    BreadcrumbItem,
    CommendationStats,
    Team,
    UserProfile,
    UserStatistics,
} from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Calendar,
    ChevronRight,
    MapPin,
    MessageCircle,
    Settings,
    Trophy,
    TrendingUp,
    Users,
} from 'lucide-react';
import { useState } from 'react';

interface Props {
    user: UserProfile;
    statistics: UserStatistics;
    teams: Team[];
    commendation_stats: CommendationStats;
    comments_count: number;
    can_commend?: boolean;
    is_own_profile: boolean;
}

export default function Show({
    user,
    statistics,
    teams,
    commendation_stats,
    comments_count,
    can_commend = false,
    is_own_profile,
}: Props) {
    const [currentCommendationStats, setCurrentCommendationStats] =
        useState<CommendationStats>(commendation_stats);
    const [currentCommentsCount, setCurrentCommentsCount] =
        useState(comments_count);

    const formatMemberSince = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return format(date, 'MMMM yyyy', { locale: es });
        } catch {
            return dateString;
        }
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { title: user.name, href: `/jugadores/${user.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} - Perfil`} />

            <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6 lg:px-8">
                {/* Hero Header Section */}
                <div className="relative">
                    {/* Background Accent */}
                    <div className="absolute inset-0 -z-10 h-32 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent md:h-40" />
                    
                    <Card className="border-none shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-6">
                                {/* Avatar with subtle ring */}
                                <div className="relative flex-shrink-0">
                                    <div className="rounded-full bg-gradient-to-br from-primary/20 to-primary/5 p-1">
                                        <UserAvatar
                                            name={user.name}
                                            avatarUrl={user.avatar_url}
                                            size="xl"
                                            className="h-24 w-24 border-4 border-background md:h-28 md:w-28"
                                        />
                                    </div>
                                    {is_own_profile && (
                                        <Badge 
                                            variant="secondary" 
                                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs"
                                        >
                                            Tu perfil
                                        </Badge>
                                    )}
                                </div>

                                {/* User Info */}
                                <div className="flex-1 space-y-3">
                                    <div className="space-y-2">
                                        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                                            {user.name}
                                        </h1>
                                        
                                        {/* Meta Badges */}
                                        <div className="flex flex-wrap items-center gap-2">
                                            {user.location && (
                                                <Badge variant="outline" className="gap-1 text-xs">
                                                    <MapPin className="h-3 w-3" />
                                                    {user.location}
                                                </Badge>
                                            )}
                                            {user.age && (
                                                <Badge variant="outline" className="gap-1 text-xs">
                                                    <Calendar className="h-3 w-3" />
                                                    {user.age} años
                                                </Badge>
                                            )}
                                            {/* Matches Played - Highlighted */}
                                            <Badge className="gap-1.5 bg-primary/10 text-primary hover:bg-primary/20">
                                                <Trophy className="h-3.5 w-3.5" />
                                                <span className="font-semibold">
                                                    {statistics.matches_played} {statistics.matches_played === 1 ? 'partido' : 'partidos'}
                                                </span>
                                            </Badge>
                                            <Badge variant="outline" className="gap-1 text-xs">
                                                <TrendingUp className="h-3 w-3" />
                                                Desde {formatMemberSince(statistics.member_since)}
                                            </Badge>
                                        </div>
                                    </div>

                                    {/* Bio */}
                                    {user.bio && (
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {user.bio}
                                        </p>
                                    )}

                                    {/* Quick Actions */}
                                    {is_own_profile && (
                                        <div className="pt-1">
                                            <Button asChild variant="default" size="sm">
                                                <Link href={edit().url}>
                                                    <Settings className="mr-2 h-4 w-4" />
                                                    Editar Perfil
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Teams Section - Full Width */}
                {teams && teams.length > 0 && (
                    <section>
                        <Card>
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" />
                                            Equipos
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {teams.length} {teams.length === 1 ? 'equipo' : 'equipos'}
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {teams.map((team: Team) => (
                                        <Link
                                            key={team.id}
                                            href={`/teams/${team.id}`}
                                            className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:bg-accent/50 hover:shadow-md"
                                        >
                                            <TeamAvatar
                                                name={team.name}
                                                logoUrl={team.logo_url}
                                                size="md"
                                                className="h-12 w-12 transition-transform group-hover:scale-105"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate font-semibold group-hover:text-primary transition-colors">
                                                    {team.name}
                                                </div>
                                                <VariantBadge
                                                    variant={team.variant}
                                                    className="mt-1"
                                                />
                                            </div>
                                            <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                )}

                {/* Main Content - Single Column */}
                <div className="space-y-6">
                    {/* Commendations Section */}
                    <section>
                        <ProfileCommendations
                            userId={user.id}
                            stats={currentCommendationStats}
                            canCommend={can_commend}
                            onStatsUpdate={(newStats) => {
                                setCurrentCommendationStats(newStats);
                            }}
                        />
                    </section>

                    {/* Comments Section */}
                    <section className="space-y-6">
                        {/* Section Header */}
                        <div>
                            <h2 className="flex items-center gap-2 text-xl font-bold tracking-tight">
                                <MessageCircle className="h-5 w-5 text-primary" />
                                Comentarios
                                {currentCommentsCount > 0 && (
                                    <Badge variant="secondary" className="ml-1 text-xs">
                                        {currentCommentsCount}
                                    </Badge>
                                )}
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {is_own_profile 
                                    ? currentCommentsCount > 0
                                        ? `${currentCommentsCount} ${currentCommentsCount === 1 ? 'comentario' : 'comentarios'} en tu perfil`
                                        : 'Aún no tienes comentarios en tu perfil'
                                    : currentCommentsCount > 0 
                                        ? `${currentCommentsCount} ${currentCommentsCount === 1 ? 'comentario' : 'comentarios'} en el perfil`
                                        : 'Sé el primero en dejar un comentario'
                                }
                            </p>
                        </div>
                        
                        {/* Comment Form - Only show if NOT own profile */}
                        {!is_own_profile && (
                            <Card>
                                <CardContent className="p-4">
                                    <AddCommentForm
                                        userId={user.id}
                                        onCommentAdded={() => {
                                            setCurrentCommentsCount((prev) => prev + 1);
                                        }}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Comments List */}
                        {currentCommentsCount > 0 ? (
                            <ProfileComments
                                userId={user.id}
                                onCommentDeleted={() => {
                                    setCurrentCommentsCount((prev) =>
                                        Math.max(0, prev - 1),
                                    );
                                }}
                            />
                        ) : (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                                    <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
                                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                                        {is_own_profile 
                                            ? 'Aún no hay comentarios en tu perfil'
                                            : 'No hay comentarios todavía'
                                        }
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
