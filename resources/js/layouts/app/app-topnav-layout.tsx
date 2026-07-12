import { AppMobileNav } from '@/components/app-mobile-nav';
import { AppShell } from '@/components/app-shell';
import { AppTopbar } from '@/components/app-topbar';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';

/**
 * Adaptive app shell: a glassy top command bar on desktop and a floating bottom
 * dock on mobile. Replaces the legacy left sidebar layout. Content is
 * full-width; the mobile `<main>` gets bottom padding so it clears the dock.
 */
export default function AppTopnavLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="header">
            <AppTopbar />
            <AppMobileNav />

            {breadcrumbs.length > 1 && (
                <div className="hidden border-b border-border/60 px-6 py-2.5 md:block">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            )}

            <main className="flex w-full flex-1 flex-col pb-28 md:pb-0">
                {children}
            </main>
        </AppShell>
    );
}
