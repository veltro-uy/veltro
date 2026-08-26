import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { edit } from '@/routes/profile';
import type { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { PhoneMissed } from 'lucide-react';

/**
 * Whether the signed-in user may hold a leadership role (captain / co-captain).
 *
 * Leaders' phone numbers are shown to the rival team's leaders once a match is
 * confirmed, so a leader without one leaves the rival with no way to reach them.
 */
export function useCanLeadTeam(): boolean {
    const { auth } = usePage<SharedData>().props;

    return Boolean(auth?.user?.phone_number);
}

interface Props {
    /** Headline; defaults to the "cannot create a team" wording. */
    title?: string;
    /** Body copy explaining the consequence for this particular screen. */
    description?: string;
    className?: string;
    /** Show the "add it in your profile" link. Off when the missing phone
     *  belongs to someone else. */
    linkToProfile?: boolean;
}

export function PhoneRequiredNotice({
    title,
    description,
    className,
    linkToProfile = true,
}: Props) {
    return (
        <Alert className={className}>
            <PhoneMissed />
            <AlertTitle>{title ?? 'Falta tu número de teléfono'}</AlertTitle>
            <AlertDescription>
                {description ??
                    'Para ser capitán o vice-capitán necesitás un teléfono en tu perfil: los equipos rivales lo usan para coordinar los partidos confirmados.'}
                {linkToProfile && (
                    <>
                        {' '}
                        <Link
                            href={edit().url}
                            className="font-medium underline underline-offset-4"
                        >
                            Agregalo en tu perfil
                        </Link>
                        .
                    </>
                )}
            </AlertDescription>
        </Alert>
    );
}
