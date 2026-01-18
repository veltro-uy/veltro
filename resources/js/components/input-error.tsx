import { cn } from '@/lib/utils';
import { AlertCircleIcon } from 'lucide-react';
import { type HTMLAttributes } from 'react';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    if (!message) {
        return null;
    }

    return (
        <p
            {...props}
            role="alert"
            aria-live="polite"
            className={cn(
                'flex animate-in items-start gap-1.5 text-sm font-medium text-destructive duration-200 fade-in-0 slide-in-from-top-1',
                className,
            )}
        >
            <AlertCircleIcon
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
            />
            <span className="leading-5">{message}</span>
        </p>
    );
}
