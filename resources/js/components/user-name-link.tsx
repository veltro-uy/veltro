import { UserProfileModal } from '@/components/user-profile-modal';
import { cn } from '@/lib/utils';
import type { User } from '@/types';
import { useState } from 'react';

interface UserNameLinkProps {
    user: User | { id: number; name: string };
    className?: string;
}

export function UserNameLink({ user, className }: UserNameLinkProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={cn(
                    'cursor-pointer text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-200 hover:decoration-current dark:decoration-neutral-500',
                    className,
                )}
            >
                {user.name}
            </button>

            <UserProfileModal
                userId={user.id}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    );
}
