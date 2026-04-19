import { CalendarDays, Clock, MapPin, Trophy, Users } from 'lucide-react';

const teamInitial = (name: string) =>
    name
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

export function LandingMatchPreview() {
    return (
        <div
            aria-hidden="true"
            className="select-none rounded-2xl border border-border/60 bg-background/70 p-5 shadow-xl ring-1 ring-black/[0.02] backdrop-blur-sm"
        >
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                        Comienza en 3 días
                    </span>
                </div>
                <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Fútbol 7
                </span>
            </div>

            <div className="flex items-center justify-between gap-3">
                <div className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-base font-bold text-primary">
                        LT
                    </div>
                    <span className="text-center text-xs font-medium">
                        Los Tigres FC
                    </span>
                </div>
                <div className="flex flex-col items-center gap-1 px-2">
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground">
                        VS
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        20:00
                    </span>
                </div>
                <div className="flex flex-1 flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-orange-500/5 text-base font-bold text-orange-600 dark:text-orange-400">
                        BU
                    </div>
                    <span className="text-center text-xs font-medium">
                        Barrio United
                    </span>
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>Sábado · 20:00</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Cancha Parque Rodó</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Amistoso · 90 minutos</span>
                </div>
            </div>
        </div>
    );
}

const availabilityRoster = [
    { name: 'Matías G.', status: 'available' },
    { name: 'Santiago R.', status: 'available' },
    { name: 'Bruno L.', status: 'available' },
    { name: 'Fede A.', status: 'maybe' },
    { name: 'Nico P.', status: 'unavailable' },
];

const statusDot: Record<string, string> = {
    available: 'bg-green-500',
    maybe: 'bg-amber-500',
    unavailable: 'bg-red-500',
};

const statusLabel: Record<string, string> = {
    available: 'Confirmado',
    maybe: 'Tal vez',
    unavailable: 'No va',
};

export function LandingAvailabilityPreview() {
    return (
        <div
            aria-hidden="true"
            className="select-none rounded-2xl border border-border/60 bg-background/70 p-5 shadow-xl ring-1 ring-black/[0.02] backdrop-blur-sm"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">
                        Los Tigres FC
                    </span>
                    <span className="text-sm font-semibold">
                        Próximo partido
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xl font-bold tabular-nums">
                        9
                        <span className="text-sm font-medium text-muted-foreground">
                            /11
                        </span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                        confirmados
                    </span>
                </div>
            </div>

            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400"
                    style={{ width: '82%' }}
                />
            </div>

            <div className="flex flex-col gap-2.5">
                {availabilityRoster.map((player) => (
                    <div
                        key={player.name}
                        className="flex items-center justify-between"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                                {teamInitial(player.name)}
                            </div>
                            <span className="text-xs font-medium">
                                {player.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${statusDot[player.status]}`}
                            />
                            <span className="text-[10px] text-muted-foreground">
                                {statusLabel[player.status]}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 border-t border-border/60 pt-3 text-center text-[10px] text-muted-foreground">
                +9 jugadores más
            </div>
        </div>
    );
}

export function LandingTournamentPreview() {
    return (
        <div
            aria-hidden="true"
            className="select-none rounded-2xl border border-border/60 bg-background/70 p-5 shadow-xl ring-1 ring-black/[0.02] backdrop-blur-sm"
        >
            <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-600 dark:text-amber-400">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold leading-tight">
                            Copa Veltro Verano
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            Fútbol 7 · Montevideo
                        </span>
                    </div>
                </div>
                <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-600 dark:text-green-400">
                    Abierta
                </span>
            </div>

            <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        Equipos inscritos
                    </span>
                    <span className="font-semibold text-foreground tabular-nums">
                        12/16
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                        style={{ width: '75%' }}
                    />
                </div>
            </div>

            <div className="mb-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                    {[
                        'bg-primary/20 text-primary',
                        'bg-orange-500/20 text-orange-600 dark:text-orange-400',
                        'bg-sky-500/20 text-sky-600 dark:text-sky-400',
                        'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
                        'bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400',
                    ].map((cls, idx) => (
                        <div
                            key={idx}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-background text-[10px] font-bold ${cls}`}
                        >
                            {['LT', 'BU', 'RA', 'CP', 'VM'][idx]}
                        </div>
                    ))}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] font-semibold text-muted-foreground">
                        +7
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-[10px] text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                <span>Comienza el 2 de mayo</span>
            </div>
        </div>
    );
}
