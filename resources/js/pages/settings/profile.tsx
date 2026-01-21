import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UserAvatar } from '@/components/user-avatar';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Form, Head, Link, router, usePage } from '@inertiajs/react';
import { Loader2, Upload, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Configuración de perfil',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
    hasPassword,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    hasPassword: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [bioLength, setBioLength] = useState(auth.user.bio?.length || 0);

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingAvatar(true);
        const formData = new FormData();
        formData.append('avatar', file);

        router.post('/settings/avatar', formData, {
            preserveScroll: true,
            onSuccess: () => {
                setIsUploadingAvatar(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                toast.success('Foto de perfil actualizada');
            },
            onError: (errors) => {
                setIsUploadingAvatar(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                const errorMessage = errors.avatar || 'Error al subir la foto';
                toast.error(errorMessage);
            },
        });
    };

    const handleDeleteAvatar = () => {
        if (!confirm('¿Estás seguro de que deseas eliminar tu foto de perfil?'))
            return;

        router.delete('/settings/avatar', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Foto de perfil eliminada');
            },
            onError: () => {
                toast.error('Error al eliminar la foto');
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración de perfil" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Información del perfil"
                        description="Actualiza tu información personal"
                    />

                    {/* Avatar Upload Section */}
                    <div className="space-y-4 rounded-lg border bg-card p-6">
                        <h3 className="text-sm font-semibold">
                            Foto de perfil
                        </h3>
                        <div className="flex items-center gap-6">
                            <UserAvatar
                                name={auth.user.name}
                                avatarUrl={auth.user.avatar_url}
                                size="lg"
                                className="h-20 w-20"
                            />
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        disabled={isUploadingAvatar}
                                    >
                                        {isUploadingAvatar ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Subiendo...
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="mr-2 h-4 w-4" />
                                                Subir foto
                                            </>
                                        )}
                                    </Button>
                                    {auth.user.avatar_path && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleDeleteAvatar}
                                            disabled={isUploadingAvatar}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Eliminar
                                        </Button>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    JPG, PNG o WEBP. Máximo 2MB.
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                className="hidden"
                                onChange={handleAvatarUpload}
                            />
                        </div>
                    </div>

                    <Form
                        {...ProfileController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        className="space-y-6"
                    >
                        {({ processing, recentlySuccessful, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Nombre</Label>

                                    <Input
                                        id="name"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.name}
                                        name="name"
                                        required
                                        autoComplete="name"
                                        placeholder="Nombre completo"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.name}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        Correo electrónico
                                    </Label>

                                    <Input
                                        id="email"
                                        type="email"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.email}
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Correo electrónico"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone_number">
                                        Número de teléfono
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            (Opcional)
                                        </span>
                                    </Label>

                                    <Input
                                        id="phone_number"
                                        type="tel"
                                        className="mt-1 block w-full"
                                        defaultValue={
                                            auth.user.phone_number || ''
                                        }
                                        name="phone_number"
                                        autoComplete="tel"
                                        placeholder="+34 600 000 000"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.phone_number}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Tu número de teléfono será visible para
                                        los líderes de equipos oponentes en
                                        partidos confirmados.
                                    </p>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="bio">
                                        Biografía
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            (Opcional)
                                        </span>
                                    </Label>

                                    <Textarea
                                        id="bio"
                                        className="mt-1 block w-full resize-none"
                                        defaultValue={auth.user.bio || ''}
                                        name="bio"
                                        rows={4}
                                        maxLength={500}
                                        placeholder="Cuéntanos sobre ti..."
                                        onChange={(e) =>
                                            setBioLength(e.target.value.length)
                                        }
                                    />

                                    <div className="flex items-center justify-between">
                                        <InputError
                                            className="mt-2"
                                            message={errors.bio}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {bioLength}/500 caracteres
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="location">
                                        Ubicación
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            (Opcional)
                                        </span>
                                    </Label>

                                    <Input
                                        id="location"
                                        type="text"
                                        className="mt-1 block w-full"
                                        defaultValue={auth.user.location || ''}
                                        name="location"
                                        placeholder="ej: Montevideo, Uruguay"
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.location}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="date_of_birth">
                                        Fecha de nacimiento
                                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                                            (Opcional)
                                        </span>
                                    </Label>

                                    <Input
                                        id="date_of_birth"
                                        type="date"
                                        className="mt-1 block w-full"
                                        defaultValue={
                                            auth.user.date_of_birth || ''
                                        }
                                        name="date_of_birth"
                                        max={
                                            new Date()
                                                .toISOString()
                                                .split('T')[0]
                                        }
                                    />

                                    <InputError
                                        className="mt-2"
                                        message={errors.date_of_birth}
                                    />
                                </div>

                                {mustVerifyEmail &&
                                    auth.user.email_verified_at === null && (
                                        <div>
                                            <p className="-mt-4 text-sm text-muted-foreground">
                                                Tu correo electrónico no está
                                                verificado.{' '}
                                                <Link
                                                    href={send()}
                                                    as="button"
                                                    className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                                >
                                                    Haz clic aquí para reenviar
                                                    el correo de verificación.
                                                </Link>
                                            </p>

                                            {status ===
                                                'verification-link-sent' && (
                                                <div className="mt-2 text-sm font-medium text-green-600">
                                                    Se ha enviado un nuevo
                                                    enlace de verificación a tu
                                                    correo electrónico.
                                                </div>
                                            )}
                                        </div>
                                    )}

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={processing}
                                        data-test="update-profile-button"
                                    >
                                        Guardar
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Guardado
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>

                <DeleteUser hasPassword={hasPassword} />
            </SettingsLayout>
        </AppLayout>
    );
}
