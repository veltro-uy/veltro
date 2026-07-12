import AppLogoIcon from '@/components/app-logo-icon';
import { NotificationBell } from '@/components/notification-bell';
import { UserMenu } from '@/components/user-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { mainNavItems } from '@/lib/nav-items';
import { cn, resolveUrl } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { useLayoutEffect, useRef, useState } from 'react';

/**
 * Desktop command bar — a slim glassy top nav with a sliding brand-green active
 * pill. The pill position is measured from the active link so it animates as the
 * route changes. Hidden below `md`; the mobile dock (`AppMobileNav`) takes over.
 */
export function AppTopbar() {
    const page = usePage();
    const isMobile = useIsMobile();

    const listRef = useRef<HTMLElement>(null);
    const itemRefs = useRef<(HTMLElement | null)[]>([]);
    const [pill, setPill] = useState<{ left: number; width: number } | null>(
        null,
    );

    const activeIndex = mainNavItems.findIndex((item) =>
        page.url.startsWith(resolveUrl(item.href)),
    );

    useLayoutEffect(() => {
        const list = listRef.current;
        const active = itemRefs.current[activeIndex];
        if (!list || !active) {
            setPill(null);
            return;
        }

        const update = () => {
            const listBox = list.getBoundingClientRect();
            const box = active.getBoundingClientRect();
            setPill({ left: box.left - listBox.left, width: box.width });
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(list);
        return () => observer.disconnect();
    }, [activeIndex, page.url, isMobile]);

    return (
        <header className="glass-bar sticky top-0 z-40 hidden h-16 shrink-0 items-center gap-4 px-4 md:flex lg:px-6">
            {/* Brand */}
            <Link
                href="/dashboard"
                prefetch
                className="flex shrink-0 items-center gap-2 rounded-md ring-ring outline-none focus-visible:ring-2"
                aria-label="Veltro — Inicio"
            >
                <AppLogoIcon className="size-7 text-primary" />
                <span className="text-lg font-semibold tracking-tight">
                    Veltro
                </span>
            </Link>

            {/* Centered primary nav with sliding pill */}
            <nav
                ref={listRef}
                className="relative mx-auto flex items-center gap-1"
            >
                {pill && (
                    <span
                        aria-hidden
                        className="absolute top-1/2 -z-0 h-9 -translate-y-1/2 rounded-full bg-primary/12 ring-1 ring-primary/25 transition-[left,width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                        style={{ left: pill.left, width: pill.width }}
                    />
                )}
                {mainNavItems.map((item, index) => {
                    const isActive = index === activeIndex;
                    return (
                        <Link
                            key={item.title}
                            ref={(el) => {
                                itemRefs.current[index] =
                                    el as HTMLElement | null;
                            }}
                            href={item.href}
                            prefetch
                            className={cn(
                                'relative z-10 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ring-ring transition-colors outline-none focus-visible:ring-2',
                                isActive
                                    ? 'text-primary'
                                    : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {item.icon && <item.icon className="size-4" />}
                            {item.title}
                        </Link>
                    );
                })}
            </nav>

            {/* Right cluster */}
            <div className="flex shrink-0 items-center gap-1">
                <NotificationBell />
                <UserMenu className="ml-1" />
            </div>
        </header>
    );
}
