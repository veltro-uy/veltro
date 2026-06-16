import { RadioGroupItem } from '@/components/ui/radio-group';
import type { FormatOption } from '@/lib/tournament-format';
import { cn } from '@/lib/utils';

interface FormatOptionCardProps {
    option: FormatOption;
    selected: boolean;
    disabled?: boolean;
}

export function FormatOptionCard({
    option,
    selected,
    disabled,
}: FormatOptionCardProps) {
    const id = `format-${option.value}`;
    const Icon = option.icon;

    return (
        <label
            htmlFor={id}
            className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
                selected
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/40 hover:bg-muted/40',
                disabled &&
                    'cursor-not-allowed opacity-60 hover:bg-transparent',
            )}
        >
            <span
                className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-lg',
                    selected
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                )}
            >
                <Icon className="size-5" />
            </span>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                        {option.tagline}
                    </span>
                </div>
                <p className="text-sm text-muted-foreground">
                    {option.description}
                </p>
            </div>

            <RadioGroupItem
                id={id}
                value={option.value}
                disabled={disabled}
                className="mt-1"
            />
        </label>
    );
}
