import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepperProps {
    steps: string[];
    current: number;
    /** Steps the user is allowed to jump to directly. */
    reachable: (index: number) => boolean;
    onStepClick: (index: number) => void;
}

export function Stepper({
    steps,
    current,
    reachable,
    onStepClick,
}: StepperProps) {
    return (
        <ol className="flex items-center">
            {steps.map((label, index) => {
                const isCompleted = index < current;
                const isActive = index === current;
                const canNavigate = reachable(index) && index !== current;

                return (
                    <li
                        key={label}
                        className={cn(
                            'flex items-center',
                            index < steps.length - 1 && 'flex-1',
                        )}
                    >
                        <button
                            type="button"
                            onClick={() => canNavigate && onStepClick(index)}
                            disabled={!canNavigate}
                            aria-current={isActive ? 'step' : undefined}
                            className={cn(
                                'group flex items-center gap-2.5 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                canNavigate && 'cursor-pointer',
                                !canNavigate && 'cursor-default',
                            )}
                        >
                            <span
                                className={cn(
                                    'flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors',
                                    isActive &&
                                        'border-primary bg-primary text-primary-foreground',
                                    isCompleted &&
                                        'border-primary bg-primary/10 text-primary',
                                    !isActive &&
                                        !isCompleted &&
                                        'border-border bg-background text-muted-foreground',
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="size-4" />
                                ) : (
                                    index + 1
                                )}
                            </span>
                            <span
                                className={cn(
                                    'hidden text-sm font-medium sm:block',
                                    isActive
                                        ? 'text-foreground'
                                        : 'text-muted-foreground',
                                )}
                            >
                                {label}
                            </span>
                        </button>

                        {index < steps.length - 1 && (
                            <span
                                aria-hidden
                                className={cn(
                                    'mx-3 h-px flex-1 transition-colors',
                                    index < current
                                        ? 'bg-primary'
                                        : 'bg-border',
                                )}
                            />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}
