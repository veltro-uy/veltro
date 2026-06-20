import { useEffect, useRef } from 'react';

/**
 * Scroll-reveal hook. Attach the returned ref to a container; any descendant
 * carrying the `reveal` class animates in (via the `is-revealed` class) once it
 * scrolls into view. Honors `prefers-reduced-motion` through the CSS utility.
 *
 * Staggering is handled per-element with an inline `transition-delay`.
 */
export function useReveal<T extends HTMLElement = HTMLElement>() {
    const ref = useRef<T>(null);

    useEffect(() => {
        const root = ref.current;
        if (!root) return;

        const targets = Array.from(
            root.querySelectorAll<HTMLElement>('.reveal'),
        );
        if (targets.length === 0) return;

        // No IntersectionObserver (or SSR) — reveal everything immediately.
        if (typeof IntersectionObserver === 'undefined') {
            targets.forEach((el) => el.classList.add('is-revealed'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
        );

        targets.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return ref;
}
