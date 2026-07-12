import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/user-avatar';
import { UserMenuContent } from '@/components/user-menu-content';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

/**
 * Standalone avatar dropdown for the top command bar and mobile dock. Unlike
 * `NavUser`, it is not coupled to the shadcn sidebar; it reuses the shared
 * `UserMenuContent` (Perfil / Configuración / Cerrar sesión).
 */
export function UserMenu({
    className,
    side,
    align = 'end',
}: {
    className?: string;
    side?: 'top' | 'bottom';
    align?: 'start' | 'center' | 'end';
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className={cn(
                    'rounded-full ring-ring transition-[box-shadow] outline-none focus-visible:ring-2',
                    className,
                )}
                aria-label="Abrir menú de usuario"
            >
                <UserAvatar
                    name={auth.user.name}
                    avatarUrl={auth.user.avatar_url}
                    size="sm"
                    className="ring-2 ring-transparent transition-[--tw-ring-color] hover:ring-primary/40"
                />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="min-w-56 rounded-lg"
                align={align}
                side={side}
                sideOffset={8}
            >
                <UserMenuContent user={auth.user} />
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
