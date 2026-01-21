import { router } from "@inertiajs/react";
import { Edit, Upload, X } from "lucide-react";
import type { FormEventHandler, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { TeamAvatar } from "@/components/team-avatar";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import teams from "@/routes/teams";

interface TeamData {
	id: number;
	name: string;
	variant: string;
	description?: string;
	logo_url?: string;
	logo_path?: string;
}

interface Props {
	team: TeamData;
	trigger?: ReactNode;
}

export function EditTeamModal({ team, trigger }: Props) {
	const [open, setOpen] = useState(false);
	const [processing, setProcessing] = useState(false);
	const [errors, setErrors] = useState<Record<string, string>>({});
	const [formData, setFormData] = useState({
		name: team.name || "",
		variant: team.variant || "football_11",
		description: team.description || "",
	});
	const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [removeLogo, setRemoveLogo] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Cleanup preview URL when component unmounts or preview changes
	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
		};
	}, [previewUrl]);

	const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Validate file type
		if (
			!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
				file.type,
			)
		) {
			toast.error("Por favor selecciona una imagen válida (JPG, PNG o WEBP)");
			return;
		}

		// Validate file size (2MB)
		if (file.size > 2048 * 1024) {
			toast.error("La imagen no debe superar los 2MB");
			return;
		}

		// Revoke old preview URL
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
		}

		setSelectedLogo(file);
		setPreviewUrl(URL.createObjectURL(file));
		setRemoveLogo(false);
	};

	const handleRemoveLogo = () => {
		if (selectedLogo && previewUrl) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
			setSelectedLogo(null);
		}
		setRemoveLogo(true);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleReset = () => {
		setFormData({
			name: team.name || "",
			variant: team.variant || "football_11",
			description: team.description || "",
		});
		setSelectedLogo(null);
		setRemoveLogo(false);
		if (previewUrl) {
			URL.revokeObjectURL(previewUrl);
			setPreviewUrl(null);
		}
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
		setErrors({});
	};

	const submit: FormEventHandler = (e) => {
		e.preventDefault();
		setProcessing(true);
		setErrors({});

		const data = new FormData();
		data.append("name", formData.name);
		data.append("variant", formData.variant);
		data.append("description", formData.description || "");
		data.append("_method", "PUT");

		if (selectedLogo) {
			data.append("logo", selectedLogo);
		} else if (removeLogo) {
			data.append("remove_logo", "1");
		}

		router.post(teams.update(team.id).url, data, {
			onSuccess: () => {
				setProcessing(false);
				setOpen(false);
				handleReset();
				toast.success("¡Equipo actualizado exitosamente!");
			},
			onError: (errors) => {
				setProcessing(false);
				setErrors(errors as Record<string, string>);
				const errorMessage =
					(errors as Record<string, string>).logo ||
					(errors as Record<string, string>).name ||
					"Error al actualizar el equipo";
				toast.error(errorMessage);
			},
		});
	};

	const getCurrentLogoUrl = () => {
		if (previewUrl) return previewUrl;
		if (removeLogo) return undefined;
		return team.logo_url;
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(newOpen) => {
				setOpen(newOpen);
				if (!newOpen) {
					handleReset();
				}
			}}
		>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<Edit className="mr-2 h-4 w-4" />
						Editar Equipo
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Editar Equipo</DialogTitle>
					<DialogDescription>
						Actualiza la información de tu equipo
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-6">
					{/* Logo Upload */}
					<div className="space-y-3">
						<Label className="text-base font-semibold">Logo del Equipo</Label>
						<div className="flex flex-col items-center gap-4 rounded-lg border border-border bg-muted/20 p-6">
							<TeamAvatar
								name={formData.name}
								logoUrl={getCurrentLogoUrl()}
								size="2xl"
							/>
							<div className="flex w-full flex-col gap-2">
								<div className="flex w-full gap-2">
									<Button
										type="button"
										variant="outline"
										size="default"
										className="flex-1"
										onClick={() => fileInputRef.current?.click()}
									>
										<Upload className="mr-2 h-4 w-4" />
										{selectedLogo || team.logo_path
											? "Cambiar Logo"
											: "Subir Logo"}
									</Button>
									{(selectedLogo || (team.logo_path && !removeLogo)) && (
										<Button
											type="button"
											variant="outline"
											size="default"
											onClick={handleRemoveLogo}
										>
											<X className="mr-2 h-4 w-4" />
											Eliminar
										</Button>
									)}
								</div>
								<div className="text-center">
									<p className="text-xs text-muted-foreground">
										Formatos: JPG, PNG o WEBP · Tamaño máximo: 2MB
									</p>
									{selectedLogo && (
										<p className="mt-2 text-sm font-medium text-green-600">
											✓ Nueva imagen seleccionada
										</p>
									)}
									{removeLogo && (
										<p className="mt-2 text-sm font-medium text-orange-600">
											⚠ Logo será eliminado al guardar
										</p>
									)}
								</div>
							</div>
						</div>
						<input
							ref={fileInputRef}
							type="file"
							accept="image/jpeg,image/jpg,image/png,image/webp"
							className="hidden"
							onChange={handleLogoSelect}
						/>
						{errors.logo && (
							<p className="text-sm text-destructive">{errors.logo}</p>
						)}
					</div>

					{/* Team Name */}
					<div className="space-y-2">
						<Label htmlFor="name">
							Nombre del Equipo <span className="text-destructive">*</span>
						</Label>
						<Input
							id="name"
							value={formData.name}
							onChange={(e) =>
								setFormData({
									...formData,
									name: e.target.value,
								})
							}
							placeholder="Ingresa el nombre del equipo"
							required
						/>
						{errors.name && (
							<p className="text-sm text-destructive">{errors.name}</p>
						)}
					</div>

					{/* Variant */}
					<div className="space-y-2">
						<Label htmlFor="variant">
							Variante de Fútbol <span className="text-destructive">*</span>
						</Label>
						<Select
							value={formData.variant}
							onValueChange={(value) =>
								setFormData({ ...formData, variant: value })
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="football_11">Fútbol 11</SelectItem>
								<SelectItem value="football_7">Fútbol 7</SelectItem>
								<SelectItem value="football_5">Fútbol 5</SelectItem>
								<SelectItem value="futsal">Futsal</SelectItem>
							</SelectContent>
						</Select>
						{errors.variant && (
							<p className="text-sm text-destructive">{errors.variant}</p>
						)}
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description">Descripción</Label>
						<Textarea
							id="description"
							value={formData.description}
							onChange={(e) =>
								setFormData({
									...formData,
									description: e.target.value,
								})
							}
							placeholder="Cuéntanos sobre tu equipo..."
							rows={3}
						/>
						{errors.description && (
							<p className="text-sm text-destructive">{errors.description}</p>
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
							{processing ? "Guardando..." : "Guardar Cambios"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
