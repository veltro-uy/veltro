import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { User } from '@/types';

interface UserNameLinkProps {
    user: User | { id: number; name: string };
    className?: string;
}

export function UserNameLink({ user, className }: UserNameLinkProps) {
    return (
        <Link
            href={`/jugadores/${user.id}`}
            className={cn(
                'cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-200 hover:decoration-current dark:decoration-neutral-500',
                className,
            )}
        >
            {user.name}
        </Link>
    );
}
