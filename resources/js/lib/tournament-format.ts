/**
 * Canonical tournament format/variant metadata and derivations for the UI.
 *
 * The backend is the source of truth (see `app/Services/Tournament/
 * TournamentFormatRules.php` and `TournamentController::tournamentRules`). The
 * helpers here only mirror those rules so the creation/edit wizard can give
 * instant feedback and a live summary — never as a replacement for server-side
 * validation.
 */
import type { TournamentFormat } from '@/types';
import { LayoutGrid, ListOrdered, Swords, type LucideIcon } from 'lucide-react';

export interface VariantOption {
    value: string;
    label: string;
}

/** The four football variants supported across the app. */
export const VARIANT_OPTIONS: VariantOption[] = [
    { value: 'football_11', label: 'Fútbol 11' },
    { value: 'football_7', label: 'Fútbol 7' },
    { value: 'football_5', label: 'Fútbol 5' },
    { value: 'futsal', label: 'Futsal' },
];

export interface FormatOption {
    value: TournamentFormat;
    label: string;
    /** Short, glanceable summary shown on the selector card. */
    tagline: string;
    /** Fuller explanation of how the format works. */
    description: string;
    icon: LucideIcon;
}

export const FORMAT_OPTIONS: FormatOption[] = [
    {
        value: 'single_elimination',
        label: 'Eliminación directa',
        tagline: 'Brackets, un partido por ronda',
        description:
            'Los equipos se enfrentan en llaves; el que pierde queda eliminado. Requiere una potencia de 2 (4, 8, 16…).',
        icon: Swords,
    },
    {
        value: 'league',
        label: 'Liga',
        tagline: 'Todos contra todos',
        description:
            'Cada equipo juega contra todos los demás. Gana quien sume más puntos al final.',
        icon: ListOrdered,
    },
    {
        value: 'group_stage_knockout',
        label: 'Fase de grupos + eliminación',
        tagline: 'Grupos primero, luego bracket',
        description:
            'Primero se juega en grupos; los dos mejores de cada grupo avanzan a una llave eliminatoria.',
        icon: LayoutGrid,
    },
];

/** Valid team counts for single-elimination brackets (powers of 2). */
export const SINGLE_ELIM_TEAM_OPTIONS = [4, 8, 16, 32, 64] as const;

/** Valid group counts for group-stage tournaments (powers of 2). */
export const GROUP_COUNT_OPTIONS = [2, 4, 8, 16] as const;

export const LEAGUE_MIN_TEAMS = 2;
export const LEAGUE_MAX_TEAMS = 64;
export const GROUP_SIZE_MIN = 2;
export const GROUP_SIZE_MAX = 16;

const VARIANT_LABELS: Record<string, string> = Object.fromEntries(
    VARIANT_OPTIONS.map((v) => [v.value, v.label]),
);

export function variantLabel(variant: string): string {
    return VARIANT_LABELS[variant] ?? variant;
}

export function formatOption(format: TournamentFormat): FormatOption {
    return (
        FORMAT_OPTIONS.find((option) => option.value === format) ??
        FORMAT_OPTIONS[0]
    );
}

export function formatLabel(format: TournamentFormat): string {
    return formatOption(format).label;
}

export interface TeamConfig {
    max_teams: number;
    group_count: number;
    group_size: number;
}

/**
 * Effective max team count. Mirrors `TournamentFormatRules::resolveMaxTeams`:
 * group-stage tournaments derive it from `group_count × group_size`.
 */
export function resolveMaxTeams(
    format: TournamentFormat,
    data: TeamConfig,
): number {
    if (format === 'group_stage_knockout') {
        return data.group_count * data.group_size;
    }
    return data.max_teams;
}

const isPowerOfTwo = (n: number): boolean => n > 0 && (n & (n - 1)) === 0;

/**
 * Whether the team configuration satisfies the backend's format constraints.
 * Used to gate the wizard before submit (server still re-validates).
 */
export function isTeamConfigValid(
    format: TournamentFormat,
    data: TeamConfig,
): boolean {
    if (format === 'single_elimination') {
        return (SINGLE_ELIM_TEAM_OPTIONS as readonly number[]).includes(
            data.max_teams,
        );
    }
    if (format === 'league') {
        return (
            data.max_teams >= LEAGUE_MIN_TEAMS &&
            data.max_teams <= LEAGUE_MAX_TEAMS
        );
    }
    // group_stage_knockout
    return (
        isPowerOfTwo(data.group_count) &&
        (GROUP_COUNT_OPTIONS as readonly number[]).includes(data.group_count) &&
        data.group_size >= GROUP_SIZE_MIN &&
        data.group_size <= GROUP_SIZE_MAX
    );
}

/** Number of knockout rounds for a power-of-2 bracket. */
function bracketRounds(teams: number): number {
    return teams >= 2 ? Math.ceil(Math.log2(teams)) : 0;
}

/**
 * Rough estimate of total matches in the tournament, for the live summary.
 * Display-only — not used for any persisted value.
 */
export function estimateTotalMatches(
    format: TournamentFormat,
    data: TeamConfig,
): number | null {
    const maxTeams = resolveMaxTeams(format, data);
    if (maxTeams < 2) return null;

    if (format === 'single_elimination') {
        return maxTeams - 1;
    }
    if (format === 'league') {
        return (maxTeams * (maxTeams - 1)) / 2;
    }
    // group_stage_knockout: round-robin per group + knockout among the
    // two qualifiers per group.
    const { group_count, group_size } = data;
    if (group_count < 1 || group_size < 2) return null;
    const groupMatches = group_count * ((group_size * (group_size - 1)) / 2);
    const qualifiers = group_count * 2;
    const knockoutMatches = qualifiers >= 2 ? qualifiers - 1 : 0;
    return groupMatches + knockoutMatches;
}

/**
 * Human description of the competition size, e.g. "8 equipos · 3 rondas".
 * Display-only.
 */
export function teamCountSummary(
    format: TournamentFormat,
    data: TeamConfig,
): string {
    const maxTeams = resolveMaxTeams(format, data);
    if (format === 'group_stage_knockout') {
        return `${maxTeams} equipos · ${data.group_count} grupos de ${data.group_size}`;
    }
    if (format === 'single_elimination') {
        return `${maxTeams} equipos · ${bracketRounds(maxTeams)} rondas`;
    }
    return `${maxTeams} equipos`;
}
