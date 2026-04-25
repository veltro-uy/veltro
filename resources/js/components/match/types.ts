// Local match-page types. These are the enriched shapes that the match
// detail page and its subcomponents share. They differ from the global
// `FootballMatch` type in that `home_team` is required and team members
// are eagerly loaded.

export interface MatchPageUser {
    id: number;
    name: string;
}

export interface MatchPageTeam {
    id: number;
    name: string;
    variant: string;
    logo_url?: string;
    team_members?: Array<{
        id: number;
        user: MatchPageUser;
    }>;
}

export interface LineupPlayer {
    id: number;
    user_id: number;
    user: MatchPageUser;
}

export interface MatchEvent {
    id: number;
    team_id: number;
    user_id?: number;
    user?: MatchPageUser;
    event_type: string;
    minute?: number;
    description?: string;
}

export interface MatchRequest {
    id: number;
    requesting_team_id: number;
    status: string;
    message?: string;
    requesting_team: MatchPageTeam;
}

export interface OpposingTeamLeader {
    id: number;
    user_id: number;
    role: string;
    user: {
        id: number;
        name: string;
        phone_number?: string;
    };
}

export interface MatchPageMatch {
    id: number;
    home_team_id: number;
    away_team_id?: number;
    tournament_id?: number;
    variant: string;
    scheduled_at: string | null;
    location: string | null;
    match_type: string;
    status: string;
    home_score?: number;
    away_score?: number;
    notes?: string;
    home_team: MatchPageTeam;
    away_team?: MatchPageTeam;
    match_requests?: MatchRequest[];
}
