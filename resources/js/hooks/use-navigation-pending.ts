import { useMemo, useState } from 'react';

/**
 * Tracks whether an Inertia visit triggered from this component is in flight.
 *
 * Returns the pending flag plus `onStart`/`onFinish` handlers to spread into a
 * `router.get`/`router.post` options object. Because the discovery-list visits
 * use `preserveState: true`, the component stays mounted for the whole request,
 * so local state is enough — no global router listener needed.
 *
 * @example
 * const [isPending, pendingHandlers] = useNavigationPending();
 * router.get(url, params, { preserveState: true, ...pendingHandlers });
 */
export function useNavigationPending() {
    const [isPending, setIsPending] = useState(false);

    const handlers = useMemo(
        () => ({
            onStart: () => setIsPending(true),
            onFinish: () => setIsPending(false),
        }),
        [],
    );

    return [isPending, handlers] as const;
}
