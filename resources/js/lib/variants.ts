/**
 * Football variant metadata. `value` must match the backend enum
 * (`football_11 | football_7 | football_5 | futsal`). Used by the create-team
 * wizard's variant picker; labels also mirror `variant-badge.tsx`.
 */
export interface VariantOption {
    value: string;
    label: string;
    playersOnPitch: number;
    maxMembers: number;
    blurb: string;
}

export const VARIANTS: VariantOption[] = [
    {
        value: 'football_11',
        label: 'Fútbol 11',
        playersOnPitch: 11,
        maxMembers: 25,
        blurb: 'Cancha grande, once contra once.',
    },
    {
        value: 'football_7',
        label: 'Fútbol 7',
        playersOnPitch: 7,
        maxMembers: 15,
        blurb: 'El clásico de la canchita.',
    },
    {
        value: 'football_5',
        label: 'Fútbol 5',
        playersOnPitch: 5,
        maxMembers: 10,
        blurb: 'Rápido, técnico y en corto.',
    },
    {
        value: 'futsal',
        label: 'Futsal',
        playersOnPitch: 5,
        maxMembers: 12,
        blurb: 'Bajo techo, pelota pesada.',
    },
];

export const DEFAULT_VARIANT = 'football_11';

/** Roster capacity for a variant, falling back to the football_11 default. */
export function variantMaxMembers(variant: string): number {
    return VARIANTS.find((v) => v.value === variant)?.maxMembers ?? 25;
}
