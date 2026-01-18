import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar_url?: string;
    phone_number?: string;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    created_at: string;
    updated_at: string;
    [key: string]: unknown; // This allows for additional properties...
}

export type AvailabilityStatus =
    | 'pending'
    | 'available'
    | 'maybe'
    | 'unavailable';

export interface MatchAvailability {
    id: number;
    match_id: number;
    user_id: number;
    team_id: number;
    status: AvailabilityStatus;
    confirmed_at: string | null;
    reminded_at: string | null;
    created_at: string;
    updated_at: string;
    user?: User;
}

export interface AvailabilityStats {
    available: number;
    maybe: number;
    unavailable: number;
    pending: number;
    total: number;
    minimum: number;
}
