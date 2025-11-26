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
            className={cn(
                'flex items-center gap-1.5 text-sm text-destructive animate-in fade-in-0 slide-in-from-top-1',
                className
            )}
        >
            <AlertCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{message}</span>
        </p>
    );
}
