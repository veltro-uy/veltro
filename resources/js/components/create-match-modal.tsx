import { useForm } from "@inertiajs/react";
import { Plus } from "lucide-react";
import type { FormEventHandler, ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
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
import matches from "@/routes/matches";

interface Team {
	id: number;
	name: string;
	variant: string;
}

interface Props {
	teams: Team[];
	trigger?: ReactNode;
}

export function CreateMatchModal({ teams, trigger }: Props) {
	const [open, setOpen] = useState(false);
	const { data, setData, post, processing, errors, reset } = useForm({
		team_id: teams.length > 0 ? teams[0].id.toString() : "",
		scheduled_at: "",
		location: "",
		location_coords: "",
		match_type: "friendly",
		notes: "",
	});

	const submit: FormEventHandler = (e) => {
		e.preventDefault();
		post(matches.store().url, {
			onSuccess: () => {
				setOpen(false);
				reset();
				toast.success("¡Disponibilidad de partido creada exitosamente!");
			},
			onError: (errors) => {
				const firstError = Object.values(errors)[0];
				if (firstError) {
					toast.error(firstError as string);
				}
			},
		});
	};

	// Check if user has teams to create matches
	if (teams.length === 0) {
		return (
			<Button disabled>
				<Plus className="mr-2 h-4 w-4" />
				Publicar Partido
			</Button>
		);
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button>
						<Plus className="mr-2 h-4 w-4" />
						Publicar Partido
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Publicar Partido Disponible</DialogTitle>
					<DialogDescription>
						Crea una disponibilidad de partido para que otros equipos puedan
						solicitar jugar
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={submit} className="space-y-4">
					{/* Team Selection */}
					<div className="space-y-2">
						<Label htmlFor="team_id">
							Tu Equipo <span className="text-destructive">*</span>
						</Label>
						<Select
							value={data.team_id}
							onValueChange={(value) => setData("team_id", value)}
						>
							<SelectTrigger id="team_id">
								<SelectValue placeholder="Selecciona un equipo" />
							</SelectTrigger>
							<SelectContent>
								{teams.map((team) => (
									<SelectItem key={team.id} value={team.id.toString()}>
										{team.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{errors.team_id && (
							<p className="text-sm text-destructive">{errors.team_id}</p>
						)}
					</div>

					{/* Scheduled Date & Time */}
					<div className="space-y-2">
						<Label htmlFor="scheduled_at">
							Fecha y Hora del Partido <span className="text-destructive">*</span>
						</Label>
						<Input
							id="scheduled_at"
							type="datetime-local"
							value={data.scheduled_at}
							onChange={(e) => setData("scheduled_at", e.target.value)}
							required
						/>
						{errors.scheduled_at && (
							<p className="text-sm text-destructive">{errors.scheduled_at}</p>
						)}
					</div>

					{/* Location */}
					<div className="space-y-2">
						<Label htmlFor="location">
							Ubicación <span className="text-destructive">*</span>
						</Label>
						<Input
							id="location"
							type="text"
							placeholder="Ingresa la ubicación del partido"
							value={data.location}
							onChange={(e) => setData("location", e.target.value)}
							required
						/>
						{errors.location && (
							<p className="text-sm text-destructive">{errors.location}</p>
						)}
					</div>

					{/* Match Type */}
					<div className="space-y-2">
						<Label htmlFor="match_type">
							Tipo de Partido <span className="text-destructive">*</span>
						</Label>
						<Select
							value={data.match_type}
							onValueChange={(value) => setData("match_type", value)}
						>
							<SelectTrigger id="match_type">
								<SelectValue placeholder="Selecciona el tipo" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="friendly">Amistoso</SelectItem>
								<SelectItem value="competitive">Competitivo</SelectItem>
							</SelectContent>
						</Select>
						{errors.match_type && (
							<p className="text-sm text-destructive">{errors.match_type}</p>
						)}
					</div>

					{/* Notes */}
					<div className="space-y-2">
						<Label htmlFor="notes">Notas (Opcional)</Label>
						<Textarea
							id="notes"
							placeholder="Agrega información adicional sobre el partido..."
							value={data.notes}
							onChange={(e) => setData("notes", e.target.value)}
							rows={3}
						/>
						{errors.notes && (
							<p className="text-sm text-destructive">{errors.notes}</p>
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
							{processing ? "Publicando..." : "Publicar Partido"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
