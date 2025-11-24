import { router } from "@inertiajs/react";
import { UserPlus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import joinRequests from "@/routes/join-requests";

interface JoinRequestDialogProps {
	teamId: number;
	teamName: string;
}

export function JoinRequestDialog({ teamId, teamName }: JoinRequestDialogProps) {
	const [open, setOpen] = useState(false);
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const maxLength = 500;
	const remainingChars = maxLength - message.length;

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		router.post(
			joinRequests.store().url,
			{
				team_id: teamId,
				message: message.trim() || undefined,
			},
			{
				onSuccess: () => {
					setOpen(false);
					setMessage("");
					setIsSubmitting(false);
					toast.success("¡Solicitud de unión enviada exitosamente!", {
						description: "El capitán del equipo revisará tu solicitud.",
					});
				},
				onError: (errors) => {
					setIsSubmitting(false);
					const errorMessage = errors.message || errors.team_id || "Error al enviar la solicitud de unión";
					toast.error("Error", {
						description: errorMessage,
					});
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<UserPlus className="mr-2 h-4 w-4" />
					Solicitar Unirse
				</Button>
			</DialogTrigger>
			<DialogContent>
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>Solicitar Unirse a {teamName}</DialogTitle>
						<DialogDescription>
							Envía un mensaje al capitán del equipo para presentarte y
							explicar por qué te gustaría unirte al equipo.
						</DialogDescription>
					</DialogHeader>

					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="message">
								Mensaje <span className="text-muted-foreground">(Opcional)</span>
							</Label>
							<Textarea
								id="message"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder="¡Hola! Me encantaría unirme a tu equipo porque..."
								rows={4}
								maxLength={maxLength}
								className="resize-none"
							/>
							<p
								className={`text-sm ${
									remainingChars < 50
										? "text-destructive"
										: "text-muted-foreground"
								}`}
							>
								{remainingChars} caracteres restantes
							</p>
						</div>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => setOpen(false)}
							disabled={isSubmitting}
						>
							Cancelar
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Enviando..." : "Enviar Solicitud"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

