import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * Underline-style view tab used by list pages (teams, matches) to switch
 * between top-level views. Rows of these sit on a shared `border-b` so the
 * active green underline reads as a continuous tab bar. Keep the tab row a
 * fixed height (tabs only — no inputs) so the underline never shifts between
 * views.
 */
export function ViewTab({
    icon: Icon,
    label,
    count,
    active,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-current={active ? 'page' : undefined}
            className={cn(
                '-mb-px flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
            <span
                className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums transition-colors',
                    active
                        ? 'bg-primary/15 text-primary'
                        : 'bg-muted text-muted-foreground',
                )}
            >
                {count}
            </span>
        </button>
    );
}

/**
 * Pill filter chip for secondary filtering (variant on teams, upcoming/history
 * on matches). Rendered in a scrollable/wrapping toolbar row below the tab bar.
 */
export function FilterChip({
    label,
    active,
    onClick,
    disabled,
    count,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    disabled?: boolean;
    count?: number;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
                active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground',
            )}
        >
            {label}
            {count !== undefined && (
                <span
                    className={cn(
                        'rounded-full px-1.5 text-xs font-semibold tabular-nums',
                        active
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    {count}
                </span>
            )}
        </button>
    );
}
