import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { VariantBadge } from '@/components/variant-badge';
import tournaments from '@/routes/tournaments';
import type { Tournament } from '@/types';
import { Link } from '@inertiajs/react';
import {
    Calendar,
    Clock,
    Edit,
    Play,
    Trash2,
    Trophy,
    Users,
    X,
} from 'lucide-react';

const statusConfig = {
    draft: { label: 'Borrador', variant: 'secondary' as const },
    registration_open: {
        label: 'Inscripción Abierta',
        variant: 'default' as const,
    },
    in_progress: { label: 'En Progreso', variant: 'default' as const },
    completed: { label: 'Completado', variant: 'outline' as const },
    cancelled: { label: 'Cancelado', variant: 'destructive' as const },
};

export function TournamentHeader({
    tournament,
    approvedTeamsCount,
    countdownLabel,
    permissions,
    processing,
    onOpenRegistration,
    onStart,
    onCancel,
    onDelete,
}: {
    tournament: Tournament;
    approvedTeamsCount: number;
    countdownLabel: string | null;
    permissions: {
        canEdit: boolean;
        canDelete: boolean;
        canStart: boolean;
        canCancel: boolean;
    };
    processing: boolean;
    onOpenRegistration: () => void;
    onStart: () => void;
    onCancel: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-1 gap-4">
                <Avatar className="size-14 rounded-lg">
                    {tournament.logo_url && (
                        <AvatarImage
                            src={tournament.logo_url}
                            alt={tournament.name}
                        />
                    )}
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                        <Trophy className="size-7" />
                    </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">
                            {tournament.name}
                        </h1>
                        <Badge
                            variant={statusConfig[tournament.status].variant}
                        >
                            {statusConfig[tournament.status].label}
                        </Badge>
                    </div>
                    {tournament.description && (
                        <p className="text-muted-foreground">
                            {tournament.description}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <VariantBadge variant={tournament.variant} />
                        {tournament.starts_at && (
                            <div className="flex items-center gap-1.5">
                                <Calendar className="size-4" />
                                <span>
                                    {new Date(
                                        tournament.starts_at,
                                    ).toLocaleDateString('es-UY', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </span>
                            </div>
                        )}
                        {countdownLabel && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="size-4" />
                                <span>{countdownLabel}</span>
                            </div>
                        )}
                    </div>
                    <div className="max-w-md space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <Users className="size-3.5" />
                                <span className="font-medium text-foreground">
                                    {approvedTeamsCount}
                                </span>
                                {' / '}
                                {tournament.max_teams} equipos
                            </span>
                            <span>mín. {tournament.min_teams}</span>
                        </div>
                        <Progress
                            value={
                                (approvedTeamsCount / tournament.max_teams) *
                                100
                            }
                            className="h-1.5"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {permissions.canEdit && (
                    <Link href={tournaments.edit(tournament.id).url}>
                        <Button variant="outline" size="sm" className="gap-2">
                            <Edit className="size-4" />
                            Editar
                        </Button>
                    </Link>
                )}
                {permissions.canEdit && tournament.status === 'draft' && (
                    <Button
                        onClick={onOpenRegistration}
                        disabled={processing}
                        size="sm"
                        className="gap-2"
                    >
                        <Users className="size-4" />
                        Abrir Inscripción
                    </Button>
                )}
                {permissions.canStart && (
                    <Button
                        onClick={onStart}
                        disabled={processing}
                        size="sm"
                        className="gap-2"
                    >
                        <Play className="size-4" />
                        Iniciar Torneo
                    </Button>
                )}
                {permissions.canCancel && (
                    <Button
                        variant="destructive"
                        onClick={onCancel}
                        disabled={processing}
                        size="sm"
                        className="gap-2"
                    >
                        <X className="size-4" />
                        Cancelar
                    </Button>
                )}
                {permissions.canDelete && (
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        disabled={processing}
                        size="sm"
                        className="gap-2"
                    >
                        <Trash2 className="size-4" />
                        Eliminar
                    </Button>
                )}
            </div>
        </div>
    );
}
