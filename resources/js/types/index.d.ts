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
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    win_rate: number;
    favorite_position: string | null;
}

export interface TeamStatistics {
    matches_played: number;
    wins: number;
    draws: number;
    losses: number;
    goals_scored: number;
    goals_conceded: number;
    yellow_cards: number;
    red_cards: number;
    top_scorer: { user: User; goals: number } | null;
    recent_form: ('W' | 'D' | 'L')[];
}

export interface UserProfile extends User {
    statistics: UserStatistics;
    teams: Team[];
    commendation_stats: CommendationStats;
    comments_count: number;
    can_commend?: boolean;
}

export interface UserCommendation {
    id: number;
    from_user_id: number;
    to_user_id: number;
    category: CommendationCategory;
    created_at: string;
    from_user?: User;
}

export type CommendationCategory =
    | 'friendly'
    | 'skilled'
    | 'teamwork'
    | 'leadership';

export interface CommendationStats {
    friendly: number;
    skilled: number;
    teamwork: number;
    leadership: number;
    total: number;
}

export interface ProfileComment {
    id: number;
    user_id: number;
    profile_user_id: number;
    comment: string;
    created_at: string;
    updated_at: string;
    author?: User;
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
    | 'team_invitation'
    | 'commendation_received'
    | 'profile_comment'
    | 'join_request_accepted'
    | 'join_request_rejected';

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

export interface JoinRequest {
    id: number;
    user_id: number;
    team_id: number;
    status: 'pending' | 'accepted' | 'rejected';
    message?: string;
    team?: Team;
    user?: User;
    created_at: string;
    updated_at: string;
}

export type TournamentVisibility = 'public' | 'invite_only';

export type TournamentStatus =
    | 'draft'
    | 'registration_open'
    | 'in_progress'
    | 'completed'
    | 'cancelled';

export type TournamentTeamStatus =
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'withdrawn';

export interface Tournament {
    id: number;
    name: string;
    description?: string;
    logo_url?: string;
    logo_path?: string;
    organizer_id: number;
    organizer?: User;
    visibility: TournamentVisibility;
    status: TournamentStatus;
    variant: string;
    max_teams: number;
    min_teams: number;
    registered_teams_count?: number;
    registration_deadline?: string;
    starts_at?: string;
    ends_at?: string;
    created_at: string;
    updated_at: string;
    tournament_teams?: TournamentTeam[];
    rounds?: TournamentRound[];
    [key: string]: unknown;
}

export interface TournamentTeam {
    id: number;
    tournament_id: number;
    team_id: number;
    team?: Team;
    status: TournamentTeamStatus;
    seed?: number;
    registered_by: number;
    registered_at: string;
    approved_at?: string;
    created_at: string;
    updated_at: string;
}

export interface TournamentRound {
    id: number;
    tournament_id: number;
    round_number: number;
    name: string;
    starts_at?: string;
    created_at: string;
    updated_at: string;
    matches?: FootballMatch[];
}

export interface FootballMatch {
    id: number;
    home_team_id: number;
    away_team_id?: number;
    tournament_id?: number;
    tournament?: Tournament;
    tournament_round_id?: number;
    tournament_round?: TournamentRound;
    bracket_position?: number;
    variant: string;
    scheduled_at: string;
    location: string;
    location_coords?: string;
    match_type: string;
    status: string;
    home_score?: number;
    away_score?: number;
    notes?: string;
    created_by: number;
    confirmed_at?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    home_team?: Team;
    away_team?: Team;
    creator?: User;
    availability?: MatchAvailability[];
    [key: string]: unknown;
}
