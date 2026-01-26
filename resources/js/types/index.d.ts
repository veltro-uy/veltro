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
    avatar_path?: string;
    phone_number?: string;
    bio?: string;
    location?: string;
    date_of_birth?: string;
    age?: number;
    email_verified_at: string | null;
    two_factor_enabled?: boolean;
    onboarding_completed?: boolean;
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

export interface UserStatistics {
    teams_count: number;
    matches_played: number;
    member_since: string;
}

export interface UserProfile extends User {
    statistics: UserStatistics;
    teams: Team[];
}

export interface Team {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
    logo_path?: string;
    description?: string;
    max_members?: number;
    created_at: string;
    updated_at: string;
    team_members?: TeamMember[];
    [key: string]: unknown;
}

export interface TeamMember {
    id: number;
    user_id: number;
    team_id: number;
    role: string;
    position?: string | null;
    status: string;
    joined_at?: string;
    user?: User;
    [key: string]: unknown;
}

export type NotificationType =
    | 'match_request_received'
    | 'match_request_accepted'
    | 'match_request_rejected'
    | 'match_cancelled'
    | 'match_score_updated'
    | 'availability_reminder'
    | 'team_invitation';

export interface NotificationData {
    type: NotificationType;
    title: string;
    message: string;
    action_url: string;
    icon: string;
    related_model: {
        match_id?: number;
        team_id?: number;
        match_request_id?: number;
        invited_by_id?: number;
    };
    created_at: string;
}

export interface Notification {
    id: string;
    type: string;
    notifiable_type: string;
    notifiable_id: number;
    data: NotificationData;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaginatedNotifications {
    current_page: number;
    data: Notification[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}
