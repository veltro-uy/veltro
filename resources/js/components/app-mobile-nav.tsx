import AppLogoIcon from '@/components/app-logo-icon';
import { NotificationBell } from '@/components/notification-bell';
import { UserMenu } from '@/components/user-menu';
import { mainNavItems } from '@/lib/nav-items';
import { cn, resolveUrl } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';

/**
 * Mobile shell (`md:hidden`): a minimal sticky top header (brand + notifications)
 * plus a floating glass dock pinned to the bottom for thumb-reachable navigation.
 * The dock mirrors the desktop command bar's destinations plus the user menu.
 */
export function AppMobileNav() {
    const page = usePage();

    return (
        <>
            {/* Top header */}
            <header className="glass-bar sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between px-4 md:hidden">
                <Link
                    href="/dashboard"
                    prefetch
                    className="flex items-center gap-2 rounded-md ring-ring outline-none focus-visible:ring-2"
                    aria-label="Veltro — Inicio"
                >
                    <AppLogoIcon className="size-7 text-primary" />
                    <span className="text-lg font-semibold tracking-tight">
                        Veltro
                    </span>
                </Link>
                <NotificationBell />
            </header>

            {/* Floating bottom dock */}
            <nav
                className="glass-dock fixed inset-x-0 bottom-0 z-50 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full p-1.5 md:hidden"
                aria-label="Navegación principal"
            >
                {mainNavItems.map((item) => {
                    const isActive = page.url.startsWith(resolveUrl(item.href));
                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                'flex min-w-14 flex-col items-center gap-0.5 rounded-full px-2 py-1.5 text-[10px] font-medium ring-ring transition-colors outline-none focus-visible:ring-2',
                                isActive
                                    ? 'bg-primary/12 text-primary ring-1 ring-primary/25'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {item.icon && <item.icon className="size-5" />}
                            {item.title}
                        </Link>
                    );
                })}
                <span aria-hidden className="mx-0.5 h-8 w-px bg-border" />
                <div className="flex min-w-14 items-center justify-center">
                    <UserMenu side="top" align="end" />
                </div>
            </nav>
        </>
    );
}
