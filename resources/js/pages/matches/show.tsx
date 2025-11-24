import { Head, Link, router, usePage } from "@inertiajs/react";
import {
	Calendar,
	Clock,
	Edit,
	MapPin,
	Trophy,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CreateMatchRequestDialog } from "@/components/create-match-request-dialog";
import { MatchEventsManager } from "@/components/match-events-manager";
import { ScoreTracker } from "@/components/score-tracker";
import { TeamAvatar } from "@/components/team-avatar";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { VariantBadge } from "@/components/variant-badge";
import AppLayout from "@/layouts/app-layout";
import matchRequests from "@/routes/match-requests";
import matches from "@/routes/matches";
import type { BreadcrumbItem } from "@/types";

interface Team {
	id: number;
	name: string;
	variant: string;
	logo_url?: string;
	team_members?: Array<{
		id: number;
		user: {
			id: number;
			name: string;
		};
	}>;
}

interface User {
	id: number;
	name: string;
}

interface LineupPlayer {
	id: number;
	user_id: number;
	user: User;
}

interface MatchEvent {
	id: number;
	team_id: number;
	user_id?: number;
	user?: User;
	event_type: string;
	minute?: number;
	description?: string;
}

interface MatchRequest {
	id: number;
	requesting_team_id: number;
	status: string;
	message?: string;
	requesting_team: Team;
}

interface Match {
	id: number;
	home_team_id: number;
	away_team_id?: number;
	variant: string;
	scheduled_at: string;
	location: string;
	match_type: string;
	status: string;
	home_score?: number;
	away_score?: number;
	notes?: string;
	home_team: Team;
	away_team?: Team;
	match_requests?: MatchRequest[];
}

interface Props {
	match: Match;
	isHomeLeader: boolean;
	isAwayLeader: boolean;
	isLeader: boolean;
	eligibleTeams: Team[];
	homeLineup: LineupPlayer[];
	awayLineup: LineupPlayer[];
	events: MatchEvent[];
}

const getStatusColor = (status: string): string => {
	switch (status) {
		case "available":
			return "bg-green-500/10 text-green-700 dark:text-green-400";
		case "confirmed":
			return "bg-blue-500/10 text-blue-700 dark:text-blue-400";
		case "in_progress":
			return "bg-orange-500/10 text-orange-700 dark:text-orange-400";
		case "completed":
			return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
		case "cancelled":
			return "bg-red-500/10 text-red-700 dark:text-red-400";
		default:
			return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
	}
};

const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString("es-ES", {
		weekday: "long",
		month: "long",
		day: "numeric",
		year: "numeric",
	});
};

const formatTime = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleTimeString("es-ES", {
		hour: "numeric",
		minute: "2-digit",
	});
};

export default function Show({
	match,
	isHomeLeader,
	isAwayLeader,
	isLeader,
	eligibleTeams,
	homeLineup,
	awayLineup,
	events,
}: Props) {
	const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
		.props;
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showCompleteDialog, setShowCompleteDialog] = useState(false);

	// Check if match time has been reached
	const matchTime = new Date(match.scheduled_at);
	const currentTime = new Date();
	const matchHasStarted = currentTime >= matchTime;

	const breadcrumbs: BreadcrumbItem[] = [
		{
			title: "Partidos",
			href: matches.index().url,
		},
		{
			title: `${match.home_team.name}${match.away_team ? ` vs ${match.away_team.name}` : ""}`,
			href: matches.show(match.id).url,
		},
	];

	useEffect(() => {
		if (flash?.success) {
			toast.success(flash.success);
		}
		if (flash?.error) {
			toast.error(flash.error);
		}
	}, [flash]);

	const handleAcceptRequest = (requestId: number) => {
		router.post(
			matchRequests.accept(requestId).url,
			{},
			{
				onSuccess: () => {
					toast.success("¡Solicitud de partido aceptada! El partido está confirmado.");
				},
				onError: () => {
					toast.error("Error al aceptar la solicitud");
				},
			},
		);
	};

	const handleRejectRequest = (requestId: number) => {
		router.post(
			matchRequests.reject(requestId).url,
			{},
			{
				onSuccess: () => {
					toast.success("Solicitud de partido rechazada");
				},
				onError: () => {
					toast.error("Error al rechazar la solicitud");
				},
			},
		);
	};

	const handleCancelMatch = () => {
		router.post(
			matches.cancel(match.id).url,
			{},
			{
				onSuccess: () => {
					setShowCancelDialog(false);
					toast.success("Partido cancelado exitosamente");
				},
				onError: () => {
					setShowCancelDialog(false);
					toast.error("Error al cancelar el partido");
				},
			},
		);
	};

	const handleCompleteMatch = () => {
		router.post(
			matches.complete(match.id).url,
			{},
			{
				onSuccess: () => {
					setShowCompleteDialog(false);
					toast.success("¡Partido completado exitosamente!");
				},
				onError: () => {
					setShowCompleteDialog(false);
					toast.error("Error al completar el partido");
				},
			},
		);
	};

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head
				title={`${match.home_team.name}${match.away_team ? ` vs ${match.away_team.name}` : ""}`}
			/>
			<div className="flex h-full flex-1 flex-col gap-4 p-4 overflow-auto">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">
							{match.home_team.name}
							{match.away_team && <> vs {match.away_team.name}</>}
							{!match.away_team && " - Buscando Rival"}
						</h1>
						<div className="mt-2 flex flex-wrap gap-2">
							<VariantBadge variant={match.variant} />
							<Badge variant="outline" className={getStatusColor(match.status)}>
								{match.status === "available" && "Disponible"}
								{match.status === "confirmed" && "Confirmado"}
								{match.status === "in_progress" && "En Vivo"}
								{match.status === "completed" && "Completado"}
								{match.status === "cancelled" && "Cancelado"}
							</Badge>
							<Badge variant="outline">
								{match.match_type === "friendly" ? "Amistoso" : "Competitivo"}
							</Badge>
						</div>
					</div>
					<div className="flex gap-2">
						{isHomeLeader && match.status === "available" && (
							<>
								<Button asChild variant="outline">
									<Link href={matches.edit(match.id).url}>
										<Edit className="mr-2 h-4 w-4" />
										Editar
									</Link>
								</Button>
								<Button
									variant="destructive"
									onClick={() => setShowCancelDialog(true)}
								>
									<X className="mr-2 h-4 w-4" />
									Cancelar Partido
								</Button>
							</>
						)}
					{isLeader && match.status === "in_progress" && (
						<Button 
							onClick={() => setShowCompleteDialog(true)}
							disabled={!matchHasStarted}
							title={!matchHasStarted ? "No se puede completar el partido antes de que comience" : ""}
						>
							<Trophy className="mr-2 h-4 w-4" />
							Completar Partido
						</Button>
					)}
						{!isLeader &&
							match.status === "available" &&
							eligibleTeams.length > 0 && (
								<CreateMatchRequestDialog
									matchId={match.id}
									eligibleTeams={eligibleTeams}
								/>
							)}
					</div>
				</div>

				<div className="grid gap-4 lg:grid-cols-3">
					<div className="space-y-4 lg:col-span-2">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle>Información del Partido</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div className="flex items-center gap-3">
									<Calendar className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Fecha</p>
										<p className="text-sm text-muted-foreground">
											{formatDate(match.scheduled_at)}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<Clock className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Hora</p>
										<p className="text-sm text-muted-foreground">
											{formatTime(match.scheduled_at)}
										</p>
									</div>
								</div>
								<div className="flex items-center gap-3">
									<MapPin className="h-5 w-5 text-muted-foreground" />
									<div>
										<p className="text-sm font-medium">Ubicación</p>
										<p className="text-sm text-muted-foreground">
											{match.location}
										</p>
									</div>
								</div>
								{match.notes && (
									<div className="pt-3 border-t">
										<p className="text-sm font-medium mb-2">Notas</p>
										<p className="text-sm text-muted-foreground">
											{match.notes}
										</p>
									</div>
								)}
							</CardContent>
						</Card>

						{(match.status === "confirmed" ||
							match.status === "in_progress") && (
							<ScoreTracker match={match} isLeader={isLeader} />
						)}
						
						{match.status === "completed" && (
							<>
								<ScoreTracker match={match} isLeader={isLeader} />
								<MatchEventsManager
									match={match}
									homeLineup={homeLineup}
									awayLineup={awayLineup}
									events={events}
									isHomeLeader={isHomeLeader}
									isAwayLeader={isAwayLeader}
								/>
							</>
						)}

						{isHomeLeader && 
							match.status === "available" && 
							match.match_requests && 
							match.match_requests.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle>Solicitudes de Partido</CardTitle>
									<CardDescription>
										Equipos interesados en jugar este partido
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="space-y-3">
										{match.match_requests.map((request) => (
											<div
												key={request.id}
												className="flex items-start gap-3 rounded-lg border bg-card p-4"
											>
												<TeamAvatar
													name={request.requesting_team.name}
													logoUrl={request.requesting_team.logo_url}
													size="md"
												/>
												<div className="flex-1 min-w-0">
													<p className="font-medium">
														{request.requesting_team.name}
													</p>
													{request.message && (
														<p className="mt-1 text-sm text-muted-foreground">
															{request.message}
														</p>
													)}
													<div className="flex gap-2 mt-3">
														<Button
															size="sm"
															onClick={() => handleAcceptRequest(request.id)}
														>
															Aceptar
														</Button>
														<Button
															size="sm"
															variant="outline"
															onClick={() => handleRejectRequest(request.id)}
														>
															Rechazar
														</Button>
													</div>
												</div>
											</div>
										))}
									</div>
								</CardContent>
							</Card>
						)}
					</div>

					<div className="space-y-4">
						<Card>
							<CardHeader className="pb-3">
								<CardTitle>Equipos</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3">
								<div>
									<p className="text-sm font-medium mb-2">Equipo Local</p>
									<Link
										href={`/teams/${match.home_team.id}`}
										className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
									>
										<TeamAvatar
											name={match.home_team.name}
											logoUrl={match.home_team.logo_url}
											size="md"
										/>
										<span className="font-medium">{match.home_team.name}</span>
									</Link>
								</div>
								{match.away_team && (
									<div>
										<p className="text-sm font-medium mb-2">Equipo Visitante</p>
										<Link
											href={`/teams/${match.away_team.id}`}
											className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/50"
										>
											<TeamAvatar
												name={match.away_team.name}
												logoUrl={match.away_team.logo_url}
												size="md"
											/>
											<span className="font-medium">
												{match.away_team.name}
											</span>
										</Link>
									</div>
								)}
							</CardContent>
						</Card>

						{isLeader && 
							(match.status === "confirmed" || match.status === "in_progress") && (
							<Card>
								<CardHeader className="pb-3">
									<CardTitle>Gestión de Alineación</CardTitle>
									<CardDescription>
										Selecciona jugadores para el partido
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									<Button asChild className="w-full" size="sm">
										<Link href={matches.lineup.edit(match.id).url}>
											<Users className="mr-2 h-4 w-4" />
											Gestionar Alineación
										</Link>
									</Button>
									{homeLineup.length > 0 && (
										<p className="text-xs text-muted-foreground">
											{match.home_team.name}: {homeLineup.length} jugadores
										</p>
									)}
									{awayLineup.length > 0 && match.away_team && (
										<p className="text-xs text-muted-foreground">
											{match.away_team.name}: {awayLineup.length} jugadores
										</p>
									)}
								</CardContent>
							</Card>
						)}
					</div>
				</div>

				<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Cancelar Partido</AlertDialogTitle>
							<AlertDialogDescription>
								¿Estás seguro de que quieres cancelar este partido? Esta acción no se puede
								deshacer y todas las solicitudes pendientes serán eliminadas.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction
								onClick={handleCancelMatch}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								Cancelar Partido
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>

				<AlertDialog
					open={showCompleteDialog}
					onOpenChange={setShowCompleteDialog}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Completar Partido</AlertDialogTitle>
							<AlertDialogDescription>
								¿Estás seguro de que quieres marcar este partido como completado? Asegúrate
								de que el marcador final sea correcto antes de completar.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancelar</AlertDialogCancel>
							<AlertDialogAction onClick={handleCompleteMatch}>
								Completar Partido
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</AppLayout>
	);
}

