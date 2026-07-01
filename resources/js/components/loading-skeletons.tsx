import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Fallbacks for Inertia deferred props. Each mirrors the rough shape of the
 * component it stands in for so the layout doesn't jump when the real data
 * streams in.
 */

/** Stand-in for the sidebar AvailabilityPanel on matches/show. */
export function AvailabilitySkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-2.5 w-full" />
                <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-3 rounded-lg border p-2"
                        >
                            <Skeleton className="size-8 rounded-full" />
                            <Skeleton className="h-4 flex-1" />
                            <Skeleton className="h-5 w-16" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

/** Stand-in for the StandingsTable / GroupsGrid on tournaments/show. */
export function StandingsSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <Skeleton className="h-6 w-48" />
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <Skeleton className="size-6 rounded-full" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-10" />
                        <Skeleton className="h-4 w-10" />
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

/** Generic small card fallback (e.g. OpposingLeadersCard). */
export function CardSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-5 w-44" />
            </CardHeader>
            <CardContent className="space-y-3">
                {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <Skeleton className="size-8 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
