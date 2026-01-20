import { Head, Link, router, useForm, usePage } from "@inertiajs/react";
import {
	Calendar,
	Clock,
	Edit,
	MapPin,
	Minus,
	Phone,
	Plus,
	Shield,
	Swords,
	Trophy,
	Users,
	X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AvailabilityList } from "@/components/availability-list";
import { AvailabilitySelector } from "@/components/availability-selector";
import { AvailabilityStatsComponent } from "@/components/availability-stats";
import { CreateMatchRequestDialog } from "@/components/create-match-request-dialog";
import { MatchEventsManager } from "@/components/match-events-manager";
import { TeamAvatar } from "@/components/team-avatar";
import { UserNameLink } from "@/components/user-name-link";
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
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/user-avatar";
import { VariantBadge } from "@/components/variant-badge";
import AppLayout from "@/layouts/app-layout";
import matchRequests from "@/routes/match-requests";
import matches from "@/routes/matches";
import type {
	AvailabilityStats,
	BreadcrumbItem,
	MatchAvailability,
} from "@/types";

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

interface OpposingTeamLeader {
	id: number;
	user_id: number;
	role: string;
	user: {
		id: number;
		name: string;
		phone_number?: string;
	};
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
	opposingTeamLeaders?: OpposingTeamLeader[];
	homeAvailability: MatchAvailability[];
	awayAvailability: MatchAvailability[];
	userAvailability: MatchAvailability | null;
	userTeamId: number | null;
	homeAvailabilityStats: AvailabilityStats;
	awayAvailabilityStats: AvailabilityStats | null;
}

const getStatusColor = (status: string): string => {
	switch (status) {
		case "available":
			return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20";
		case "confirmed":
			return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20";
		case "in_progress":
			return "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20";
		case "completed":
			return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
		case "cancelled":
			return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20";
		default:
			return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20";
	}
};

const getStatusText = (status: string): string => {
	switch (status) {
		case "available":
			return "Disponible";
		case "confirmed":
			return "Confirmado";
		case "in_progress":
			return "En Vivo";
		case "completed":
			return "Completado";
		case "cancelled":
			return "Cancelado";
		default:
			return status;
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

const formatPhoneForWhatsApp = (phone: string): string => {
	// Remove all non-digit characters except +
	const cleaned = phone.replace(/[^\d+]/g, "");
	// If it doesn't start with +, assume it's a local number and add country code
	// For now, we'll just return the cleaned number
	return cleaned;
};

const getWhatsAppUrl = (phone: string): string => {
	const formatted = formatPhoneForWhatsApp(phone);
	return `https://wa.me/${formatted}`;
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
	opposingTeamLeaders = [],
	homeAvailability,
	awayAvailability,
	userAvailability,
	userTeamId,
	homeAvailabilityStats,
	awayAvailabilityStats,
}: Props) {
	const { flash } = usePage<{ flash: { success?: string; error?: string } }>()
		.props;
	const [showCancelDialog, setShowCancelDialog] = useState(false);
	const [showCompleteDialog, setShowCompleteDialog] = useState(false);

	// Score tracking
	const {
		data: scoreData,
		setData: setScoreData,
		post: postScore,
		processing: scoreProcessing,
	} = useForm({
		home_score: match.home_score ?? 0,
		away_score: match.away_score ?? 0,
	});

	const [countdown, setCountdown] = useState<string>("");
	const [matchHasStarted, setMatchHasStarted] = useState(false);

	// Check if match time has been reached and calculate countdown
	useEffect(() => {
		const updateCountdown = () => {
			const matchTime = new Date(match.scheduled_at);
			const currentTime = new Date();
			const timeDiff = matchTime.getTime() - currentTime.getTime();

			if (timeDiff <= 0) {
				setMatchHasStarted(true);
				setCountdown("");
				return;
			}

			setMatchHasStarted(false);

			// Calculate time units
			const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
			const hours = Math.floor(
				(timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
			);
			const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

			// Format countdown string
			if (days > 0) {
				setCountdown(`${days}d ${hours}h ${minutes}m`);
			} else if (hours > 0) {
				setCountdown(`${hours}h ${minutes}m`);
			} else if (minutes > 0) {
				setCountdown(`${minutes}m ${seconds}s`);
			} else {
				setCountdown(`${seconds}s`);
			}
		};

		// Update immediately
		updateCountdown();

		// Update every second
		const interval = setInterval(updateCountdown, 1000);

		return () => clearInterval(interval);
	}, [match.scheduled_at]);

	// Update score data when match scores change
	useEffect(() => {
		setScoreData({
			home_score: match.home_score ?? 0,
			away_score: match.away_score ?? 0,
		});
	}, [match.home_score, match.away_score, setScoreData]);

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
					toast.success(
						"¡Solicitud de partido aceptada! El partido está confirmado.",
					);
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

	const handleUpdateScore = () => {
		postScore(matches.updateScore(match.id).url, {
			onSuccess: () => {
				toast.success("¡Marcador actualizado con éxito!");
			},
			onError: (errors) => {
				const firstError = Object.values(errors)[0];
				if (firstError) {
					toast.error(firstError as string);
				}
			},
		});
	};

	const incrementHomeScore = () => {
		setScoreData("home_score", scoreData.home_score + 1);
	};

	const decrementHomeScore = () => {
		if (scoreData.home_score > 0) {
			setScoreData("home_score", scoreData.home_score - 1);
		}
	};

	const incrementAwayScore = () => {
		setScoreData("away_score", scoreData.away_score + 1);
	};

	const decrementAwayScore = () => {
		if (scoreData.away_score > 0) {
			setScoreData("away_score", scoreData.away_score - 1);
		}
	};

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head
				title={`${match.home_team.name}${match.away_team ? ` vs ${match.away_team.name}` : ""}`}
			/>

			<div className="flex h-full flex-1 flex-col gap-6 overflow-auto p-4 md:p-6">
				{/* Hero Section - Match Header */}
				<div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-background via-background to-muted/20 p-6 md:p-8">
					<div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
					<div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

					<div className="relative">
						{/* Insignias de Estado */}
						<div className="mb-4 flex flex-wrap items-center gap-2">
							<Badge className={getStatusColor(match.status)}>
								{getStatusText(match.status)}
							</Badge>
							<VariantBadge variant={match.variant} />
							<Badge variant="outline">
								{match.match_type === "friendly" ? "Amistoso" : "Competitivo"}
							</Badge>
						</div>

						{/* Enfrentamiento */}
						<div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr,auto,1fr]">
							{/* Equipo Local */}
							<Link
								href={`/teams/${match.home_team.id}`}
								className="group flex flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-muted/50 md:flex-row md:justify-end"
							>
								<TeamAvatar
									name={match.home_team.name}
									logoUrl={match.home_team.logo_url}
									size="lg"
									className="h-20 w-20"
								/>
								<div className="text-center md:text-right">
									<h2 className="text-2xl font-bold">{match.home_team.name}</h2>
									<div className="mt-1 flex items-center justify-center gap-1 md:justify-end">
										<Shield className="h-4 w-4 text-muted-foreground" />
										<p className="text-sm text-muted-foreground">Local</p>
									</div>
								</div>
							</Link>

							{/* Marcador Integrado */}
							<div className="flex flex-col items-center justify-center gap-3">
								{match.status === "confirmed" ||
								match.status === "in_progress" ||
								match.status === "completed" ? (
									<>
										{/* Countdown Timer */}
										{!matchHasStarted &&
											countdown &&
											match.status !== "completed" && (
												<div className="flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-xs backdrop-blur-sm">
													<Clock className="h-3 w-3 text-muted-foreground" />
													<span className="font-medium">{countdown}</span>
												</div>
											)}

										{/* Score Display */}
										<div className="rounded-xl border bg-card/80 px-4 py-3 shadow-lg backdrop-blur-sm md:px-6">
											<div className="flex items-center gap-3 md:gap-4">
												{/* Home Score */}
												<div className="flex items-center gap-2">
													{isLeader && match.status !== "completed" && (
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 rounded-full"
															onClick={decrementHomeScore}
															disabled={
																scoreProcessing ||
																scoreData.home_score === 0 ||
																!matchHasStarted
															}
														>
															<Minus className="h-3.5 w-3.5" />
														</Button>
													)}
													<div
														className={`flex h-12 w-12 items-center justify-center rounded-lg text-3xl font-bold md:h-14 md:w-14 ${
															match.status === "completed" &&
															match.home_score !== undefined &&
															match.away_score !== undefined &&
															match.home_score > match.away_score
																? "text-primary"
																: ""
														}`}
													>
														{scoreData.home_score}
													</div>
													{isLeader && match.status !== "completed" && (
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 rounded-full"
															onClick={incrementHomeScore}
															disabled={scoreProcessing || !matchHasStarted}
														>
															<Plus className="h-3.5 w-3.5" />
														</Button>
													)}
												</div>

												<span className="text-xl font-bold text-muted-foreground md:text-2xl">
													-
												</span>

												{/* Away Score */}
												<div className="flex items-center gap-2">
													{isLeader && match.status !== "completed" && (
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 rounded-full"
															onClick={decrementAwayScore}
															disabled={
																scoreProcessing ||
																scoreData.away_score === 0 ||
																!matchHasStarted
															}
														>
															<Minus className="h-3.5 w-3.5" />
														</Button>
													)}
													<div
														className={`flex h-12 w-12 items-center justify-center rounded-lg text-3xl font-bold md:h-14 md:w-14 ${
															match.status === "completed" &&
															match.home_score !== undefined &&
															match.away_score !== undefined &&
															match.away_score > match.home_score
																? "text-primary"
																: ""
														}`}
													>
														{scoreData.away_score}
													</div>
													{isLeader && match.status !== "completed" && (
														<Button
															variant="ghost"
															size="icon"
															className="h-7 w-7 rounded-full"
															onClick={incrementAwayScore}
															disabled={scoreProcessing || !matchHasStarted}
														>
															<Plus className="h-3.5 w-3.5" />
														</Button>
													)}
												</div>
											</div>
										</div>

										{/* Update Score Button */}
										{isLeader && match.status !== "completed" && (
											<Button
												size="sm"
												onClick={handleUpdateScore}
												disabled={
													scoreProcessing ||
													!matchHasStarted ||
													(scoreData.home_score === match.home_score &&
														scoreData.away_score === match.away_score)
												}
												className="text-xs"
											>
												{scoreProcessing
													? "Actualizando..."
													: !matchHasStarted
														? "Partido No Iniciado"
														: "Actualizar Marcador"}
											</Button>
										)}
									</>
								) : (
									<div className="rounded-full border bg-card p-4 shadow-sm">
										<Swords className="h-8 w-8 text-muted-foreground" />
									</div>
								)}
							</div>

							{/* Equipo Visitante */}
							{match.away_team ? (
								<Link
									href={`/teams/${match.away_team.id}`}
									className="group flex flex-col items-center gap-3 rounded-lg p-4 transition-colors hover:bg-muted/50 md:flex-row"
								>
									<TeamAvatar
										name={match.away_team.name}
										logoUrl={match.away_team.logo_url}
										size="lg"
										className="h-20 w-20"
									/>
									<div className="text-center md:text-left">
										<h2 className="text-2xl font-bold">
											{match.away_team.name}
										</h2>
										<p className="mt-1 text-sm text-muted-foreground">
											Visitante
										</p>
									</div>
								</Link>
							) : (
								<div className="flex flex-col items-center gap-3 rounded-lg border-2 border-dashed bg-muted/30 p-6 md:flex-row">
									<div className="rounded-full bg-muted p-4">
										<Users className="h-8 w-8 text-muted-foreground" />
									</div>
									<div className="text-center md:text-left">
										<h3 className="text-lg font-semibold">Buscando Rival</h3>
										<p className="text-sm text-muted-foreground">
											Esperando solicitudes de equipos
										</p>
									</div>
								</div>
							)}
						</div>

						{/* Información del Partido */}
						<div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm">
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">
									{formatDate(match.scheduled_at)}
								</span>
							</div>
							<Separator orientation="vertical" className="h-4" />
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">
									{formatTime(match.scheduled_at)}
								</span>
							</div>
							<Separator orientation="vertical" className="h-4" />
							<div className="flex items-center gap-2">
								<MapPin className="h-4 w-4 text-muted-foreground" />
								<span className="font-medium">{match.location}</span>
							</div>
						</div>

						{/* Botones de Acción */}
						<div className="mt-6 flex flex-wrap justify-center gap-3">
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
									title={
										!matchHasStarted
											? "No se puede completar el partido antes de que comience"
											: ""
									}
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
				</div>

				{/* Contenido Principal */}
				<div className="grid gap-6 lg:grid-cols-3">
					{/* Columna Izquierda - Contenido Principal */}
					<div className="space-y-6 lg:col-span-2">
						{/* Eventos del Partido (Solo Completados) */}
						{match.status === "completed" && (
							<MatchEventsManager
								match={match}
								homeLineup={homeLineup}
								awayLineup={awayLineup}
								events={events}
								isHomeLeader={isHomeLeader}
								isAwayLeader={isAwayLeader}
							/>
						)}

						{/* Solicitudes de Partido */}
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
													className="flex items-start gap-4 rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
												>
													<TeamAvatar
														name={request.requesting_team.name}
														logoUrl={request.requesting_team.logo_url}
														size="md"
													/>
													<div className="min-w-0 flex-1">
														<p className="font-semibold">
															{request.requesting_team.name}
														</p>
														{request.message && (
															<p className="mt-1 text-sm text-muted-foreground">
																{request.message}
															</p>
														)}
														<div className="mt-3 flex gap-2">
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

						{/* Contacto del Equipo Rival */}
						{isLeader &&
							(match.status === "confirmed" ||
								match.status === "in_progress" ||
								match.status === "completed") &&
							opposingTeamLeaders.length > 0 && (
								<Card>
									<CardHeader>
										<CardTitle>Contacto del Equipo Rival</CardTitle>
										<CardDescription>
											Coordina los detalles del partido con los líderes del
											equipo oponente
										</CardDescription>
									</CardHeader>
									<CardContent>
										<div className="space-y-3">
											{opposingTeamLeaders.map((leader) => (
												<div
													key={leader.id}
													className="flex items-center justify-between rounded-lg border bg-card p-4"
												>
													<div className="flex items-center gap-3">
														<UserAvatar name={leader.user.name} size="sm" />
														<div>
															<p className="font-medium">
																<UserNameLink user={leader.user} />
															</p>
															<div className="mt-1 flex items-center gap-2">
																<Badge variant="outline" className="text-xs">
																	{leader.role === "captain"
																		? "Capitán"
																		: "Subcapitán"}
																</Badge>
																{leader.user.phone_number && (
																	<div className="flex items-center gap-1 text-sm text-muted-foreground">
																		<Phone className="h-3 w-3" />
																		<span>{leader.user.phone_number}</span>
																	</div>
																)}
															</div>
														</div>
													</div>
													{leader.user.phone_number && (
														<Button asChild variant="outline" size="sm">
															<a
																href={getWhatsAppUrl(leader.user.phone_number)}
																target="_blank"
																rel="noopener noreferrer"
															>
																<Phone className="mr-2 h-4 w-4" />
																WhatsApp
															</a>
														</Button>
													)}
												</div>
											))}
										</div>
									</CardContent>
								</Card>
							)}

						{/* Notas Adicionales */}
						{match.notes && (
							<Card>
								<CardHeader>
									<CardTitle>Notas del Partido</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm whitespace-pre-wrap text-muted-foreground">
										{match.notes}
									</p>
								</CardContent>
							</Card>
						)}
					</div>

					{/* Columna Derecha - Barra Lateral */}
					<div className="space-y-6">
						{/* Selector de Disponibilidad */}
						{(match.status === "confirmed" || match.status === "available") &&
							userTeamId && (
								<AvailabilitySelector
									matchId={match.id}
									teamId={userTeamId}
									currentStatus={userAvailability ?? undefined}
								/>
							)}

						{/* Estadísticas de Disponibilidad - Equipo Local */}
						{(match.status === "confirmed" || match.status === "available") &&
							homeAvailabilityStats && (
								<AvailabilityStatsComponent
									stats={homeAvailabilityStats}
									teamName={match.home_team.name}
									isLeader={isHomeLeader}
								/>
							)}

						{/* Estadísticas de Disponibilidad - Equipo Visitante */}
						{match.away_team &&
							awayAvailabilityStats &&
							(match.status === "confirmed" ||
								match.status === "available") && (
								<AvailabilityStatsComponent
									stats={awayAvailabilityStats}
									teamName={match.away_team.name}
									isLeader={isAwayLeader}
								/>
							)}

						{/* Lista de Disponibilidad - Equipo Local */}
						{isHomeLeader &&
							homeAvailability.length > 0 &&
							(match.status === "confirmed" ||
								match.status === "available") && (
								<AvailabilityList
									availability={homeAvailability}
									teamName={match.home_team.name}
								/>
							)}

						{/* Lista de Disponibilidad - Equipo Visitante */}
						{isAwayLeader &&
							awayAvailability.length > 0 &&
							match.away_team &&
							(match.status === "confirmed" ||
								match.status === "available") && (
								<AvailabilityList
									availability={awayAvailability}
									teamName={match.away_team.name}
								/>
							)}

						{/* Gestión de Alineación */}
						{isLeader &&
							(match.status === "confirmed" ||
								match.status === "in_progress") && (
								<Card>
									<CardHeader>
										<CardTitle>Gestión de Alineación</CardTitle>
										<CardDescription>
											Selecciona los jugadores para el partido
										</CardDescription>
									</CardHeader>
									<CardContent className="space-y-3">
										<Button asChild className="w-full">
											<Link href={matches.lineup.edit(match.id).url}>
												<Users className="mr-2 h-4 w-4" />
												Gestionar Alineación
											</Link>
										</Button>
										{(homeLineup.length > 0 || awayLineup.length > 0) && (
											<div className="space-y-1 rounded-lg border bg-muted/50 p-3">
												{homeLineup.length > 0 && (
													<p className="text-sm">
														<span className="font-medium">
															{match.home_team.name}:
														</span>{" "}
														<span className="text-muted-foreground">
															{homeLineup.length} jugadores
														</span>
													</p>
												)}
												{awayLineup.length > 0 && match.away_team && (
													<p className="text-sm">
														<span className="font-medium">
															{match.away_team.name}:
														</span>{" "}
														<span className="text-muted-foreground">
															{awayLineup.length} jugadores
														</span>
													</p>
												)}
											</div>
										)}
									</CardContent>
								</Card>
							)}
					</div>
				</div>
			</div>

			{/* Diálogo de Cancelación */}
			<AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Cancelar Partido</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estás seguro de que quieres cancelar este partido? Esta acción no
							se puede deshacer y todas las solicitudes pendientes serán
							eliminadas.
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

			{/* Diálogo de Finalización */}
			<AlertDialog
				open={showCompleteDialog}
				onOpenChange={setShowCompleteDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Completar Partido</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estás seguro de que quieres marcar este partido como completado?
							Asegúrate de que el marcador final sea correcto antes de
							completar.
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
		</AppLayout>
	);
}
