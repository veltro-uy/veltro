import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface FormAlertProps {
    message: string;
    type?: 'error' | 'success' | 'warning';
    className?: string;
}

export function FormAlert({ message, type = 'error', className }: FormAlertProps) {
    const icons = {
        error: XCircle,
        success: CheckCircle2,
        warning: AlertCircle,
    };

    const Icon = icons[type];

    const variants = {
        error: 'bg-destructive/10 border-destructive/20 text-destructive',
        success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-400',
        warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-900 dark:text-yellow-400',
    };

    return (
        <Alert className={cn(variants[type], 'animate-in fade-in-0 slide-in-from-top-2', className)}>
            <Icon className="h-4 w-4" />
            <AlertDescription className="ml-2">
                {message}
            </AlertDescription>
        </Alert>
    );
}
