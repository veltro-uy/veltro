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
import type { BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertCircle, ArrowLeft, Save } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Torneos', href: '/tournaments' },
    { title: 'Crear Torneo', href: '/tournaments/create' },
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

export default function TournamentCreate() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        description: '',
        visibility: 'public',
        variant: '',
        max_teams: 8,
        min_teams: 4,
        registration_deadline: '',
        starts_at: '',
        ends_at: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/tournaments');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Torneo" />

            <div className="flex h-full flex-1 flex-col p-6">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Crear Torneo
                        </h1>
                        <p className="text-muted-foreground">
                            Organiza un nuevo torneo de fútbol para equipos
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">
                                    Información del Torneo
                                </CardTitle>
                                <CardDescription>
                                    Completa los detalles básicos para crear tu
                                    torneo
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
                                        placeholder="Ej: Copa de Verano 2026"
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
                                        placeholder="Describe el torneo, premios, reglas, etc."
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <p className="flex items-center gap-1 text-sm text-destructive">
                                            <AlertCircle className="size-3" />
                                            {errors.description}
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
                                            <SelectValue placeholder="Selecciona una variante" />
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
                                    <p className="text-xs text-muted-foreground">
                                        Debe ser una potencia de 2 para el
                                        bracket de eliminación
                                    </p>
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
                                        Crear Torneo
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
