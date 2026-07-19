import { cn } from '@/lib/utils';
import users from '@/routes/users';
import type { User } from '@/types';
import { Link } from '@inertiajs/react';

interface UserNameLinkProps {
    user: User | { public_id: string; name: string };
    className?: string;
}

export function UserNameLink({ user, className }: UserNameLinkProps) {
    return (
        <Link
            href={users.show(user).url}
            className={cn(
                'cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-200 hover:decoration-current dark:decoration-neutral-500',
                className,
            )}
        >
            {user.name}
        </Link>
    );
}
