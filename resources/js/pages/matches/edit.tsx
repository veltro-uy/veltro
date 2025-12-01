import { Head, router, useForm } from "@inertiajs/react";
import { toast } from "sonner";
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
import matches from "@/routes/matches";
import type { BreadcrumbItem } from "@/types";

interface Team {
	id: number;
	name: string;
}

interface Match {
	id: number;
	scheduled_at: string;
	location: string;
	location_coords?: string;
	match_type: string;
	notes?: string;
	home_team: Team;
}

interface Props {
	match: Match;
}

export default function Edit({ match }: Props) {
	const breadcrumbs: BreadcrumbItem[] = [
		{
			title: "Partidos",
			href: matches.index().url,
		},
		{
			title: match.home_team.name,
			href: matches.show(match.id).url,
		},
		{
			title: "Editar",
			href: matches.edit(match.id).url,
		},
	];

	const { data, setData, put, processing, errors } = useForm({
		scheduled_at: match.scheduled_at.slice(0, 16), // Format for datetime-local input
		location: match.location,
		location_coords: match.location_coords || "",
		match_type: match.match_type,
		notes: match.notes || "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		put(matches.update(match.id).url, {
			onError: (errors) => {
				const firstError = Object.values(errors)[0];
				if (firstError) {
					toast.error(firstError as string);
				}
			},
		});
	};

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Editar Partido" />
			<div className="flex h-full flex-1 flex-col gap-6 p-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Editar Partido</h1>
					<p className="text-muted-foreground">
						Actualiza los detalles de disponibilidad de tu partido
					</p>
				</div>

				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Detalles del Partido</CardTitle>
						<CardDescription>
							Actualiza los detalles de tu partido
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="scheduled_at">Fecha y Hora del Partido</Label>
							<Input
								id="scheduled_at"
								type="datetime-local"
								value={data.scheduled_at}
								onChange={(e) => setData("scheduled_at", e.target.value)}
							/>
							{errors.scheduled_at && (
								<p className="text-sm text-destructive">
									{errors.scheduled_at}
								</p>
							)}
						</div>

							<div className="space-y-2">
								<Label htmlFor="location">Ubicación</Label>
								<Input
									id="location"
									type="text"
									placeholder="Ingresa la ubicación del partido"
									value={data.location}
									onChange={(e) => setData("location", e.target.value)}
								/>
								{errors.location && (
									<p className="text-sm text-destructive">{errors.location}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="match_type">Tipo de Partido</Label>
								<Select
									value={data.match_type}
									onValueChange={(value) => setData("match_type", value)}
								>
									<SelectTrigger id="match_type">
										<SelectValue placeholder="Selecciona el tipo de partido" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="friendly">Amistoso</SelectItem>
										<SelectItem value="competitive">Competitivo</SelectItem>
									</SelectContent>
								</Select>
								{errors.match_type && (
									<p className="text-sm text-destructive">
										{errors.match_type}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="notes">Notas (Opcional)</Label>
								<Textarea
									id="notes"
									placeholder="Agrega cualquier información adicional sobre el partido..."
									value={data.notes}
									onChange={(e) => setData("notes", e.target.value)}
									rows={4}
								/>
								{errors.notes && (
									<p className="text-sm text-destructive">{errors.notes}</p>
								)}
							</div>

							<div className="flex gap-3">
								<Button type="submit" disabled={processing}>
									{processing ? "Actualizando..." : "Actualizar Partido"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => router.visit(matches.show(match.id).url)}
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

