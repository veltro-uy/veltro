import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { skip, update } from '@/routes/onboarding';
import { User } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { Phone, SkipForward } from 'lucide-react';
import { useState } from 'react';

interface Props {
    user: Pick<User, 'name' | 'email' | 'phone_number'>;
}

export default function PhoneNumber({ user }: Props) {
    const [isSkipping, setIsSkipping] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        phone_number: user.phone_number || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(update().url);
    };

    const handleSkip = () => {
        setIsSkipping(true);
        router.post(
            skip().url,
            {},
            {
                onFinish: () => setIsSkipping(false),
            },
        );
    };

    return (
        <AuthLayout
            title={`¡Bienvenido, ${user.name.split(' ')[0]}!`}
            description="Solo un paso más para completar tu perfil"
        >
            <Head title="Completar perfil" />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="phone_number">
                            <Phone className="mr-2 inline h-4 w-4" />
                            Número de teléfono
                        </Label>
                        <Input
                            id="phone_number"
                            type="tel"
                            name="phone_number"
                            autoFocus
                            autoComplete="tel"
                            placeholder="+598 99 123 456"
                            value={data.phone_number}
                            onChange={(e) =>
                                setData('phone_number', e.target.value)
                            }
                            error={Boolean(errors.phone_number)}
                        />
                        <InputError message={errors.phone_number} />
                        <p className="text-sm text-muted-foreground">
                            Tu número será visible para los líderes de equipos
                            oponentes en partidos confirmados, facilitando la
                            coordinación.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={processing || isSkipping}
                    >
                        {processing && <Spinner className="mr-2" />}
                        Continuar
                    </Button>

                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        onClick={handleSkip}
                        disabled={processing || isSkipping}
                    >
                        {isSkipping ? (
                            <Spinner className="mr-2" />
                        ) : (
                            <SkipForward className="mr-2 h-4 w-4" />
                        )}
                        Omitir por ahora
                    </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                    Siempre puedes agregar o cambiar tu número de teléfono más
                    tarde en la configuración de tu perfil.
                </p>
            </form>
        </AuthLayout>
    );
}
