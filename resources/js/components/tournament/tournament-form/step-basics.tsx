import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { VARIANT_OPTIONS } from '@/lib/tournament-format';
import { ImagePlus, X } from 'lucide-react';
import type { RefObject } from 'react';
import type { FormErrors, SetField, TournamentFormData } from './types';

interface StepBasicsProps {
    data: TournamentFormData;
    setField: SetField;
    errors: FormErrors;
    logoPreview: string | null;
    fileInputRef: RefObject<HTMLInputElement | null>;
    onLogoSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onLogoRemove: () => void;
}

const RequiredMark = () => <span className="text-destructive">*</span>;

export function StepBasics({
    data,
    setField,
    errors,
    logoPreview,
    fileInputRef,
    onLogoSelect,
    onLogoRemove,
}: StepBasicsProps) {
    return (
        <div className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
                <Label htmlFor="name">
                    Nombre del torneo <RequiredMark />
                </Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Ej: Copa de Verano 2026"
                    autoFocus
                    required
                />
                <InputError message={errors.name} />
            </div>

            {/* Description */}
            <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                    id="description"
                    value={data.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Describe el torneo, premios, reglas, etc."
                    rows={4}
                />
                <InputError message={errors.description} />
            </div>

            {/* Logo */}
            <div className="space-y-2">
                <Label>Imagen del torneo</Label>
                <div className="flex items-center gap-4">
                    <Avatar className="size-16 rounded-lg">
                        {logoPreview && (
                            <AvatarImage src={logoPreview} alt="Vista previa" />
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
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Subir imagen
                            </Button>
                            {logoPreview && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={onLogoRemove}
                                >
                                    <X className="size-4" />
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
                        onChange={onLogoSelect}
                        className="hidden"
                    />
                </div>
                <InputError message={errors.logo} />
            </div>

            {/* Variant */}
            <div className="space-y-2">
                <Label>
                    Variante <RequiredMark />
                </Label>
                <ToggleGroup
                    type="single"
                    variant="outline"
                    value={data.variant}
                    onValueChange={(value) =>
                        value && setField('variant', value)
                    }
                    className="flex-wrap"
                >
                    {VARIANT_OPTIONS.map((option) => (
                        <ToggleGroupItem
                            key={option.value}
                            value={option.value}
                            className="px-4 data-[state=on]:border-primary data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                        >
                            {option.label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
                <p className="text-xs text-muted-foreground">
                    Define el tipo de fútbol del torneo.
                </p>
                <InputError message={errors.variant} />
            </div>
        </div>
    );
}
