import { Head, usePage } from '@inertiajs/react';
import { Bell, BellOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import HeadingSmall from '@/components/heading-small';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import {
    getPushState,
    isPushSupported,
    subscribeToPush,
    unsubscribeFromPush,
    type PushState,
} from '@/lib/push';
import { edit as editNotifications } from '@/routes/notifications';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Notificaciones push',
        href: editNotifications().url,
    },
];

export default function Notifications() {
    const { vapidPublicKey } = usePage<SharedData>().props;

    const [state, setState] = useState<PushState | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getPushState().then(setState);
    }, []);

    const handleToggle = async () => {
        if (!state) return;
        setLoading(true);
        try {
            if (state.subscribed) {
                const next = await unsubscribeFromPush();
                setState(next);
                toast.success('Notificaciones push desactivadas');
            } else {
                if (!vapidPublicKey) {
                    toast.error(
                        'Las notificaciones push no están configuradas en el servidor.',
                    );
                    return;
                }
                const next = await subscribeToPush(vapidPublicKey);
                setState(next);
                if (next.subscribed) {
                    toast.success('Notificaciones push activadas');
                } else if (next.permission === 'denied') {
                    toast.error(
                        'Permiso denegado. Habilitá las notificaciones en tu navegador.',
                    );
                }
            }
        } catch {
            toast.error(
                'No se pudo actualizar la suscripción. Intentá de nuevo.',
            );
        } finally {
            setLoading(false);
        }
    };

    const unsupported = state ? !state.supported : !isPushSupported();
    const denied = state?.permission === 'denied' && !state.subscribed;
    const subscribed = !!state?.subscribed;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notificaciones push" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Notificaciones push"
                        description="Recibí avisos de partidos, invitaciones y actividad de tu equipo aunque no tengas la app abierta."
                    />

                    {unsupported ? (
                        <Alert>
                            <BellOff className="h-4 w-4" />
                            <AlertTitle>No disponible</AlertTitle>
                            <AlertDescription>
                                Tu navegador no admite notificaciones push. En
                                iPhone/iPad, instalá Veltro en la pantalla de
                                inicio (iOS 16.4 o superior) para habilitarlas.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                                <div className="flex items-start gap-3">
                                    {subscribed ? (
                                        <Bell className="mt-0.5 h-5 w-5 text-primary" />
                                    ) : (
                                        <BellOff className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                    )}
                                    <div>
                                        <p className="text-sm font-medium">
                                            {subscribed
                                                ? 'Activadas en este dispositivo'
                                                : 'Desactivadas en este dispositivo'}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {subscribed
                                                ? 'Vas a recibir notificaciones push en este navegador.'
                                                : 'Activá las notificaciones para no perderte novedades.'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={handleToggle}
                                    disabled={loading || !state || denied}
                                    variant={subscribed ? 'outline' : 'default'}
                                >
                                    {subscribed ? 'Desactivar' : 'Activar'}
                                </Button>
                            </div>

                            {denied && (
                                <Alert>
                                    <BellOff className="h-4 w-4" />
                                    <AlertTitle>Permiso bloqueado</AlertTitle>
                                    <AlertDescription>
                                        Bloqueaste las notificaciones para este
                                        sitio. Habilitalas desde la
                                        configuración de tu navegador para poder
                                        activarlas.
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    )}
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
