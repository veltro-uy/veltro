import type { TournamentFormat, TournamentVisibility } from '@/types';

export interface TournamentFormData {
    name: string;
    description: string;
    visibility: TournamentVisibility;
    variant: string;
    format: TournamentFormat;
    group_count: number;
    group_size: number;
    max_teams: number;
    min_teams: number;
    registration_deadline: string;
    starts_at: string;
    ends_at: string;
    logo: File | null;
    remove_logo: boolean;
}

export type FormErrors = Partial<Record<string, string>>;

export type SetField = <K extends keyof TournamentFormData>(
    key: K,
    value: TournamentFormData[K],
) => void;

/** Fields owned by each wizard step, in order. Used to map server-side
 * validation errors back to the step that should be shown. */
export const STEP_FIELDS: string[][] = [
    ['name', 'description', 'logo', 'variant'],
    ['format', 'max_teams', 'group_count', 'group_size', 'min_teams'],
    ['registration_deadline', 'starts_at', 'ends_at', 'visibility'],
];

export const STEP_LABELS = [
    'Información básica',
    'Formato y equipos',
    'Programación',
];
