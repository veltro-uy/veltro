import { useForm } from "@inertiajs/react";
import { Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import matchRequests from "@/routes/match-requests";

interface Team {
	id: number;
	name: string;
	variant: string;
}

interface Props {
	matchId: number;
	eligibleTeams: Team[];
}

export function CreateMatchRequestDialog({ matchId, eligibleTeams }: Props) {
	const [open, setOpen] = useState(false);
	const { data, setData, post, processing, reset } = useForm({
		match_id: matchId,
		team_id: eligibleTeams.length > 0 ? eligibleTeams[0].id.toString() : "",
		message: "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		post(matchRequests.create().url, {
			onSuccess: () => {
				toast.success("¡Solicitud de partido enviada con éxito!");
				setOpen(false);
				reset();
			},
			onError: (errors) => {
				const firstError = Object.values(errors)[0];
				if (firstError) {
					toast.error(firstError as string);
				}
			},
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Send className="mr-2 h-4 w-4" />
					Solicitar Partido
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px]">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Solicitar Jugar Este Partido</DialogTitle>
						<DialogDescription>
							Selecciona con cuál de tus equipos quieres jugar y envía una
							solicitud al organizador.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="team_id">Selecciona Tu Equipo</Label>
							<Select
								value={data.team_id}
								onValueChange={(value) => setData("team_id", value)}
							>
								<SelectTrigger id="team_id">
									<SelectValue placeholder="Selecciona un equipo" />
								</SelectTrigger>
								<SelectContent>
									{eligibleTeams.map((team) => (
										<SelectItem key={team.id} value={team.id.toString()}>
											{team.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="message">Mensaje (Opcional)</Label>
							<Textarea
								id="message"
								placeholder="Añade un mensaje a tu solicitud..."
								value={data.message}
								onChange={(e) => setData("message", e.target.value)}
								rows={4}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={processing}>
							{processing ? "Enviando..." : "Enviar Solicitud"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
