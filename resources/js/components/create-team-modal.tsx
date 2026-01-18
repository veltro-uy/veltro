import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import teams from '@/routes/teams';
import { useForm } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type { FormEventHandler, ReactNode } from 'react';
import { useState } from 'react';

interface Props {
    trigger?: ReactNode;
}

export function CreateTeamModal({ trigger }: Props) {
    const [open, setOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        variant: 'football_11',
        description: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(teams.store().url, {
            onSuccess: () => {
                setOpen(false);
                reset();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Equipo
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Equipo</DialogTitle>
                    <DialogDescription>
                        Configura tu equipo y comienza a organizar partidos
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    {/* Team Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Nombre del Equipo{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Ingresa el nombre del equipo"
                            required
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">
                                {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Variant */}
                    <div className="space-y-2">
                        <Label htmlFor="variant">
                            Variante de Fútbol{' '}
                            <span className="text-destructive">*</span>
                        </Label>
                        <Select
                            value={data.variant}
                            onValueChange={(value) => setData('variant', value)}
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
                                <SelectItem value="futsal">Futsal</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.variant && (
                            <p className="text-sm text-destructive">
                                {errors.variant}
                            </p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                            id="description"
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                            placeholder="Cuéntanos sobre tu equipo..."
                            rows={3}
                        />
                        {errors.description && (
                            <p className="text-sm text-destructive">
                                {errors.description}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creando...' : 'Crear Equipo'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
