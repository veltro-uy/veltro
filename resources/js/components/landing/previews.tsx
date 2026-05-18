import { CalendarDays, Clock, MapPin, Trophy, Users } from 'lucide-react';

const teamInitial = (name: string) =>
    name
        .split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

const previewCard =
    'select-none rounded-lg border border-white/[0.08] bg-[#101312] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]';
const mutedText = 'text-white/50';

export function LandingMatchPreview() {
    return (
        <div aria-hidden="true" className={previewCard}>
            <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#48d17a] opacity-60" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#48d17a]" />
                    </span>
                    <span className={`text-xs font-medium ${mutedText}`}>
                        Comienza en 3 días
                    </span>
                </div>
                <span className="rounded-md border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/55 uppercase">
                    Fútbol 7
                </span>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="flex min-w-0 flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[#48d17a]/20 bg-[#48d17a]/10 text-base font-semibold text-[#48d17a]">
                        LT
                    </div>
                    <span className="max-w-full truncate text-center text-xs font-medium text-white">
                        Los Tigres FC
                    </span>
                </div>
                <div className="flex flex-col items-center gap-1 px-2">
                    <span className="text-xs font-semibold tracking-wider text-white/40">
                        VS
                    </span>
                    <span className="text-[10px] text-white/40">20:00</span>
                </div>
                <div className="flex min-w-0 flex-col items-center gap-2">
                    <div className="flex h-14 w-14 items-center justify-center rounded-md border border-white/[0.08] bg-white/[0.05] text-base font-semibold text-white/70">
                        BU
                    </div>
                    <span className="max-w-full truncate text-center text-xs font-medium text-white">
                        Barrio United
                    </span>
                </div>
            </div>

            <div className="mt-5 grid gap-2 border-t border-white/[0.08] pt-4 text-xs text-white/50">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-[#48d17a]" />
                    <span>Sábado · 20:00</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#48d17a]" />
                    <span>Cancha Parque Rodó</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-[#48d17a]" />
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
    available: 'bg-[#48d17a]',
    maybe: 'bg-[#d6b85f]',
    unavailable: 'bg-[#ef7777]',
};

const statusLabel: Record<string, string> = {
    available: 'Confirmado',
    maybe: 'Tal vez',
    unavailable: 'No va',
};

export function LandingAvailabilityPreview() {
    return (
        <div aria-hidden="true" className={previewCard}>
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <span className="text-xs text-white/50">Los Tigres FC</span>
                    <span className="mt-0.5 block text-sm font-semibold text-white">
                        Próximo partido
                    </span>
                </div>
                <div className="text-right">
                    <span className="text-2xl font-semibold text-white tabular-nums">
                        9
                        <span className="text-sm font-medium text-white/40">
                            /11
                        </span>
                    </span>
                    <span className="block text-[10px] text-white/40">
                        confirmados
                    </span>
                </div>
            </div>

            <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-white/[0.08]">
                <div
                    className="h-full rounded-full bg-[#48d17a]"
                    style={{ width: '82%' }}
                />
            </div>

            <div className="grid gap-2.5">
                {availabilityRoster.map((player) => (
                    <div
                        key={player.name}
                        className="flex items-center justify-between gap-3"
                    >
                        <div className="flex min-w-0 items-center gap-2.5">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/[0.07] text-[10px] font-semibold text-white/60">
                                {teamInitial(player.name)}
                            </div>
                            <span className="truncate text-xs font-medium text-white">
                                {player.name}
                            </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${statusDot[player.status]}`}
                            />
                            <span className="text-[10px] text-white/45">
                                {statusLabel[player.status]}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 border-t border-white/[0.08] pt-3 text-center text-[10px] text-white/40">
                +9 jugadores más
            </div>
        </div>
    );
}

export function LandingTournamentPreview() {
    return (
        <div aria-hidden="true" className={previewCard}>
            <div className="mb-5 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#48d17a]/20 bg-[#48d17a]/10 text-[#48d17a]">
                        <Trophy className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                        <span className="block truncate text-sm leading-tight font-semibold text-white">
                            Copa Veltro Verano
                        </span>
                        <span className="text-[10px] text-white/50">
                            Fútbol 7 · Montevideo
                        </span>
                    </div>
                </div>
                <span className="shrink-0 rounded-md border border-[#48d17a]/25 bg-[#48d17a]/10 px-2 py-1 text-[10px] font-semibold text-[#8df0ad]">
                    Abierta
                </span>
            </div>

            <div className="mb-4">
                <div className="mb-2 flex items-center justify-between text-[10px] text-white/50">
                    <span className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-[#48d17a]" />
                        Equipos inscritos
                    </span>
                    <span className="font-semibold text-white tabular-nums">
                        12/16
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                        className="h-full rounded-full bg-[#48d17a]"
                        style={{ width: '75%' }}
                    />
                </div>
            </div>

            <div className="mb-4 flex -space-x-2">
                {['LT', 'BU', 'RA', 'CP', 'VM'].map((team, idx) => (
                    <div
                        key={team}
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#101312] text-[10px] font-semibold ${
                            idx === 0
                                ? 'bg-[#48d17a] text-[#07110b]'
                                : 'bg-white/[0.08] text-white/65'
                        }`}
                    >
                        {team}
                    </div>
                ))}
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#101312] bg-white/[0.05] text-[9px] font-semibold text-white/45">
                    +7
                </div>
            </div>

            <div className="flex items-center gap-2 border-t border-white/[0.08] pt-3 text-[10px] text-white/50">
                <CalendarDays className="h-3 w-3 text-[#48d17a]" />
                <span>Comienza el 2 de mayo</span>
            </div>
        </div>
    );
}
