import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VariantBadge } from '@/components/variant-badge';
import { formatDate } from '@/lib/datetime';
import {
    TOURNAMENT_STATUS_META,
    tournamentFormatLabel,
} from '@/lib/tournament';
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

export function TournamentHeader({
    tournament,
    countdownLabel,
    permissions,
    processing,
    onOpenRegistration,
    onStart,
    onCancel,
    onDelete,
}: {
    tournament: Tournament;
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
    const status = TOURNAMENT_STATUS_META[tournament.status];

    return (
        <div className="relative overflow-hidden rounded-2xl border border-border">
            <div
                aria-hidden
                className="bg-pitch-glow pointer-events-none absolute inset-0"
            />
            <div className="relative flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-1 gap-4">
                    <Avatar className="size-16 shrink-0 rounded-xl ring-2 ring-primary/20">
                        {tournament.logo_url && (
                            <AvatarImage
                                src={tournament.logo_url}
                                alt={tournament.name}
                            />
                        )}
                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary">
                            <Trophy className="size-8" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-2">
                        <p className="font-display text-xs font-bold tracking-[0.18em] text-primary uppercase">
                            {tournamentFormatLabel(tournament.format)}
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                {tournament.name}
                            </h1>
                            <Badge
                                variant="secondary"
                                className={status.badgeClassName}
                            >
                                {status.label}
                            </Badge>
                        </div>
                        {tournament.description && (
                            <p className="max-w-2xl text-sm text-muted-foreground">
                                {tournament.description}
                            </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-sm text-muted-foreground">
                            <VariantBadge variant={tournament.variant} />
                            {tournament.starts_at && (
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="size-4" />
                                    <span>
                                        {formatDate(tournament.starts_at, {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            )}
                            {countdownLabel && (
                                <div className="flex items-center gap-1.5 text-primary">
                                    <Clock className="size-4" />
                                    <span className="font-medium">
                                        {countdownLabel}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    {permissions.canEdit && (
                        <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Link href={tournaments.edit(tournament.id).url}>
                                <Edit className="size-4" />
                                Editar
                            </Link>
                        </Button>
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
        </div>
    );
}
