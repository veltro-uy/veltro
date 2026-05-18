// Components
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { Form, Head } from '@inertiajs/react';

export default function VerifyEmail({ status }: { status?: string }) {
    return (
        <AuthLayout
            title="Verificar correo electrónico"
            description="Por favor verifica tu correo electrónico haciendo clic en el enlace que te enviamos."
        >
            <Head title="Verificación de correo" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 rounded-md border border-[#48d17a]/25 bg-[#48d17a]/10 px-3 py-2 text-center text-sm font-medium text-[#8df0ad]">
                    Se ha enviado un nuevo enlace de verificación al correo
                    electrónico que proporcionaste durante el registro.
                </div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        <Button disabled={processing}>
                            {processing && <Spinner />}
                            Reenviar correo de verificación
                        </Button>

                        <TextLink
                            href={logout()}
                            className="mx-auto block text-sm"
                        >
                            Cerrar sesión
                        </TextLink>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
