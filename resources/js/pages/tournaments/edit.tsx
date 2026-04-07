import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem, Tournament } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, ImagePlus, Save, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';

interface PageProps {
    tournament: Tournament;
}

const breadcrumbs = (tournament: Tournament): BreadcrumbItem[] => [
    { title: 'Torneos', href: '/tournaments' },
    { title: tournament.name, href: `/tournaments/${tournament.id}` },
    { title: 'Editar', href: `/tournaments/${tournament.id}/edit` },
];

interface FormData {
    name: string;
    description: string;
    visibility: 'public' | 'invite_only';
    variant: string;
    max_teams: number;
    min_teams: number;
    registration_deadline: string;
    starts_at: string;
    ends_at: string;
}

export default function TournamentEdit({ tournament }: PageProps) {
    const [data, setDataState] = useState<FormData>({
        name: tournament.name,
        description: tournament.description || '',
        visibility: tournament.visibility,
        variant: tournament.variant,
        max_teams: tournament.max_teams,
        min_teams: tournament.min_teams,
        registration_deadline: tournament.registration_deadline
            ? new Date(tournament.registration_deadline)
                  .toISOString()
                  .slice(0, 16)
            : '',
        starts_at: tournament.starts_at
            ? new Date(tournament.starts_at).toISOString().slice(0, 16)
            : '',
        ends_at: tournament.ends_at
            ? new Date(tournament.ends_at).toISOString().slice(0, 16)
            : '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(
        tournament.logo_url || null,
    );
    const [removeLogo, setRemoveLogo] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const setData = <K extends keyof FormData>(key: K, value: FormData[K]) => {
        setDataState((prev) => ({ ...prev, [key]: value }));
    };

    const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (
            !['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(
                file.type,
            )
        ) {
            setErrors((prev) => ({
                ...prev,
                logo: 'Por favor selecciona una imagen válida (JPG, PNG o WEBP)',
            }));
            return;
        }

        if (file.size > 2048 * 1024) {
            setErrors((prev) => ({
                ...prev,
                logo: 'La imagen no debe superar los 2MB',
            }));
            return;
        }

        if (previewUrl && previewUrl.startsWith('blob:'))
            URL.revokeObjectURL(previewUrl);
        setSelectedLogo(file);
        setPreviewUrl(URL.createObjectURL(file));
        setRemoveLogo(false);
        setErrors((prev) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { logo: _, ...rest } = prev;
            return rest;
        });
    };

    const handleRemoveLogo = () => {
        if (previewUrl && previewUrl.startsWith('blob:'))
            URL.revokeObjectURL(previewUrl);
        setSelectedLogo(null);
        setPreviewUrl(null);
        setRemoveLogo(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData();
        formData.append('_method', 'PUT');
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, String(value));
        });
        if (selectedLogo) {
            formData.append('logo', selectedLogo);
        } else if (removeLogo) {
            formData.append('remove_logo', '1');
        }

        router.post(`/tournaments/${tournament.id}`, formData, {
            onSuccess: () => setProcessing(false),
            onError: (errs) => {
                setProcessing(false);
                setErrors(errs as Record<string, string>);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs(tournament)}>
            <Head title={`Editar ${tournament.name}`} />

            <div className="flex h-full flex-1 flex-col p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Editar Torneo
                        </h1>
                        <p className="text-muted-foreground">
                            Actualiza la información del torneo
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    Información del Torneo
                                </CardTitle>
                                <CardDescription>
                                    Modifica los detalles del torneo
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nombre del Torneo{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        required
                                    />
                                    {errors.name && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">
                                        Descripción
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.description}
                                        </p>
                                    )}
                                </div>

                                {/* Logo */}
                                <div className="space-y-2">
                                    <Label>Imagen del Torneo</Label>
                                    <div className="flex items-center gap-4">
                                        <Avatar className="size-16 rounded-lg">
                                            {previewUrl && (
                                                <AvatarImage
                                                    src={previewUrl}
                                                    alt="Preview"
                                                />
                                            )}
                                            <AvatarFallback className="rounded-lg bg-muted">
                                                <ImagePlus className="size-6 text-muted-foreground" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        fileInputRef.current?.click()
                                                    }
                                                >
                                                    Cambiar imagen
                                                </Button>
                                                {(previewUrl ||
                                                    tournament.logo_url) &&
                                                    !removeLogo && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive"
                                                            onClick={
                                                                handleRemoveLogo
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
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
                                            onChange={handleLogoSelect}
                                            className="hidden"
                                        />
                                    </div>
                                    {errors.logo && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.logo}
                                        </p>
                                    )}
                                </div>

                                {/* Variant */}
                                <div className="space-y-2">
                                    <Label htmlFor="variant">
                                        Variante{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={data.variant}
                                        onValueChange={(value) =>
                                            setData('variant', value)
                                        }
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="football_11">
                                                Fútbol 11
                                            </SelectItem>
                                            <SelectItem value="football_7">
                                                Fútbol 7
                                            </SelectItem>
                                            <SelectItem value="football_5">
                                                Fútbol 5
                                            </SelectItem>
                                            <SelectItem value="futsal">
                                                Futsal
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.variant && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.variant}
                                        </p>
                                    )}
                                </div>

                                {/* Visibility */}
                                <div className="space-y-2">
                                    <Label htmlFor="visibility">
                                        Visibilidad{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={data.visibility}
                                        onValueChange={(
                                            value: 'public' | 'invite_only',
                                        ) => setData('visibility', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public">
                                                Público - Cualquier equipo puede
                                                registrarse
                                            </SelectItem>
                                            <SelectItem value="invite_only">
                                                Solo por invitación - Requiere
                                                aprobación
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.visibility && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.visibility}
                                        </p>
                                    )}
                                </div>

                                {/* Max Teams */}
                                <div className="space-y-2">
                                    <Label htmlFor="max_teams">
                                        Número Máximo de Equipos{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </Label>
                                    <Select
                                        value={data.max_teams.toString()}
                                        onValueChange={(value) =>
                                            setData(
                                                'max_teams',
                                                parseInt(value),
                                            )
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="4">
                                                4 equipos
                                            </SelectItem>
                                            <SelectItem value="8">
                                                8 equipos
                                            </SelectItem>
                                            <SelectItem value="16">
                                                16 equipos
                                            </SelectItem>
                                            <SelectItem value="32">
                                                32 equipos
                                            </SelectItem>
                                            <SelectItem value="64">
                                                64 equipos
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.max_teams && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.max_teams}
                                        </p>
                                    )}
                                </div>

                                {/* Min Teams */}
                                <div className="space-y-2">
                                    <Label htmlFor="min_teams">
                                        Número Mínimo de Equipos
                                    </Label>
                                    <Input
                                        id="min_teams"
                                        type="number"
                                        value={data.min_teams}
                                        onChange={(e) =>
                                            setData(
                                                'min_teams',
                                                parseInt(e.target.value),
                                            )
                                        }
                                        min={2}
                                        max={data.max_teams}
                                    />
                                    {errors.min_teams && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.min_teams}
                                        </p>
                                    )}
                                </div>

                                {/* Registration Deadline */}
                                <div className="space-y-2">
                                    <Label htmlFor="registration_deadline">
                                        Fecha Límite de Inscripción
                                    </Label>
                                    <Input
                                        id="registration_deadline"
                                        type="datetime-local"
                                        value={data.registration_deadline}
                                        onChange={(e) =>
                                            setData(
                                                'registration_deadline',
                                                e.target.value,
                                            )
                                        }
                                    />
                                    {errors.registration_deadline && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.registration_deadline}
                                        </p>
                                    )}
                                </div>

                                {/* Start Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="starts_at">
                                        Fecha de Inicio
                                    </Label>
                                    <Input
                                        id="starts_at"
                                        type="datetime-local"
                                        value={data.starts_at}
                                        onChange={(e) =>
                                            setData('starts_at', e.target.value)
                                        }
                                    />
                                    {errors.starts_at && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.starts_at}
                                        </p>
                                    )}
                                </div>

                                {/* End Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="ends_at">
                                        Fecha de Finalización
                                    </Label>
                                    <Input
                                        id="ends_at"
                                        type="datetime-local"
                                        value={data.ends_at}
                                        onChange={(e) =>
                                            setData('ends_at', e.target.value)
                                        }
                                    />
                                    {errors.ends_at && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.ends_at}
                                        </p>
                                    )}
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => window.history.back()}
                                        className="gap-2"
                                    >
                                        <ArrowLeft className="size-4" />
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="gap-2"
                                    >
                                        <Save className="size-4" />
                                        Guardar Cambios
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
