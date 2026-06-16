import { VariantBadge } from '@/components/variant-badge';
import { formatDateTime } from '@/lib/datetime';
import {
    estimateTotalMatches,
    formatLabel,
    teamCountSummary,
} from '@/lib/tournament-format';
import {
    CalendarClock,
    Globe,
    Info,
    Lock,
    Trophy,
    Users,
    type LucideIcon,
} from 'lucide-react';
import type { TournamentFormData } from './types';

interface TournamentSummaryProps {
    data: TournamentFormData;
}

function Row({
    icon: Icon,
    label,
    children,
}: {
    icon: LucideIcon;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start gap-3 px-4 py-3">
            <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <div className="mt-0.5 text-sm font-medium">{children}</div>
            </div>
        </div>
    );
}

function DateLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-baseline justify-between gap-2">
            <span className="text-xs font-normal text-muted-foreground">
                {label}
            </span>
            <span className="text-right text-sm">{formatDateTime(value)}</span>
        </div>
    );
}

export function TournamentSummary({ data }: TournamentSummaryProps) {
    const totalMatches = estimateTotalMatches(data.format, data);
    const hasDates =
        data.registration_deadline || data.starts_at || data.ends_at;
    const isPublic = data.visibility === 'public';

    return (
        <div className="flex flex-col overflow-hidden rounded-xl border bg-muted/30">
            <h3 className="border-b px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Resumen
            </h3>
            <div className="divide-y divide-border">
                <Row icon={Trophy} label="Torneo">
                    <span className="line-clamp-2">
                        {data.name || 'Sin nombre'}
                    </span>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {data.variant && (
                            <VariantBadge variant={data.variant} />
                        )}
                        <span className="text-xs font-normal text-muted-foreground">
                            {formatLabel(data.format)}
                        </span>
                    </div>
                </Row>

                <Row icon={Users} label="Equipos">
                    {teamCountSummary(data.format, data)}
                    {totalMatches !== null && (
                        <span className="font-normal text-muted-foreground">
                            {' · '}~{totalMatches} partidos
                        </span>
                    )}
                </Row>

                <Row icon={isPublic ? Globe : Lock} label="Visibilidad">
                    {isPublic ? 'Público' : 'Solo por invitación'}
                </Row>

                <Row icon={CalendarClock} label="Programación">
                    {hasDates ? (
                        <div className="space-y-1">
                            {data.registration_deadline && (
                                <DateLine
                                    label="Cierre"
                                    value={data.registration_deadline}
                                />
                            )}
                            {data.starts_at && (
                                <DateLine
                                    label="Inicio"
                                    value={data.starts_at}
                                />
                            )}
                            {data.ends_at && (
                                <DateLine label="Fin" value={data.ends_at} />
                            )}
                        </div>
                    ) : (
                        <span className="font-normal text-muted-foreground">
                            Sin fechas definidas
                        </span>
                    )}
                </Row>
            </div>

            <div className="mt-auto flex items-start gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                <span>Podrás editar estos datos luego de crear el torneo.</span>
            </div>
        </div>
    );
}
