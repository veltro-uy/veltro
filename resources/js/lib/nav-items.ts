import matches from '@/routes/matches';
import teams from '@/routes/teams';
import type { NavItem } from '@/types';
import { Award, Home, Trophy, Users } from 'lucide-react';

/**
 * Primary navigation destinations for the authenticated app. Shared between the
 * desktop command bar (`app-topbar`) and the mobile floating dock
 * (`app-mobile-nav`) so both shells stay in sync.
 */
export const mainNavItems: NavItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
        icon: Home,
    },
    {
        title: 'Equipos',
        href: teams.index(),
        icon: Users,
    },
    {
        title: 'Partidos',
        href: matches.index(),
        icon: Trophy,
    },
    {
        title: 'Torneos',
        href: '/tournaments',
        icon: Award,
    },
];
