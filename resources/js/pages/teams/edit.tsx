import { Head, useForm } from "@inertiajs/react";
import type { FormEventHandler } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import AppLayout from "@/layouts/app-layout";
import teams from "@/routes/teams";
import type { BreadcrumbItem } from "@/types";

interface Team {
	id: number;
	name: string;
	variant: string;
	logo_url?: string;
	description?: string;
}

interface Props {
	team: Team;
}

export default function Edit({ team }: Props) {
	const breadcrumbs: BreadcrumbItem[] = [
		{
			title: "Equipos",
			href: teams.index().url,
		},
		{
			title: team.name,
			href: teams.show(team.id).url,
		},
		{
			title: "Editar",
			href: teams.edit(team.id).url,
		},
	];

	const { data, setData, put, processing, errors } = useForm({
		name: team.name || "",
		variant: team.variant || "football_11",
		description: team.description || "",
	});

	const submit: FormEventHandler = (e) => {
		e.preventDefault();
		put(teams.update(team.id).url);
	};

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title={`Editar ${team.name}`} />
			<div className="flex h-full flex-1 flex-col gap-6 p-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Editar Equipo</h1>
					<p className="text-muted-foreground">Actualiza la información de tu equipo</p>
				</div>

				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Información del Equipo</CardTitle>
						<CardDescription>
							Actualiza los detalles de tu equipo
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={submit} className="space-y-6">
							{/* Team Name */}
							<div className="space-y-2">
								<Label htmlFor="name">
									Nombre del Equipo <span className="text-destructive">*</span>
								</Label>
								<Input
									id="name"
									value={data.name}
									onChange={(e) => setData("name", e.target.value)}
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
									value={data.variant}
									onValueChange={(value) => setData("variant", value)}
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
									value={data.description}
									onChange={(e) => setData("description", e.target.value)}
									placeholder="Cuéntanos sobre tu equipo..."
									rows={4}
								/>
								{errors.description && (
									<p className="text-sm text-destructive">
										{errors.description}
									</p>
								)}
							</div>

							<div className="flex gap-4 pt-4">
								<Button type="submit" disabled={processing}>
									{processing ? "Guardando..." : "Guardar Cambios"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => window.history.back()}
								>
									Cancelar
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}
