import { Head, Link, usePage } from "@inertiajs/react";
import { ArrowRight, Search, Shield, Star, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { CreateTeamModal } from "@/components/create-team-modal";
import { TeamAvatar } from "@/components/team-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { VariantBadge } from "@/components/variant-badge";
import AppLayout from "@/layouts/app-layout";
import teams from "@/routes/teams";
import type { BreadcrumbItem } from "@/types";

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: "Equipos",
		href: teams.index().url,
	},
];

interface TeamMember {
	id: number;
	user_id: number;
	team_id: number;
	role: string;
	status: string;
	user: {
		id: number;
		name: string;
		email: string;
	};
}

interface Team {
	id: number;
	name: string;
	variant: string;
	logo_url?: string;
	description?: string;
	team_members: TeamMember[];
	max_members?: number;
}

const getMaxMembersForVariant = (variant: string): number => {
	switch (variant) {
		case "football_11":
			return 25;
		case "football_7":
			return 15;
		case "football_5":
			return 10;
		case "futsal":
			return 12;
		default:
			return 25;
	}
};

const getCapacityColor = (current: number, max: number): string => {
	const percentage = (current / max) * 100;
	if (percentage >= 100) return "text-destructive";
	if (percentage >= 80) return "text-orange-500";
	return "text-muted-foreground";
};

interface Props {
	myTeams: Team[];
	discoverTeams: Team[];
}

export default function Index({ myTeams, discoverTeams }: Props) {
	const { auth } = usePage<{ auth: { user: { id: number } } }>().props;
	const [activeView, setActiveView] = useState<"my-teams" | "discover">(
		"my-teams",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedVariant, setSelectedVariant] = useState<string>("all");

	// Filter discover teams based on search and variant
	const filteredDiscoverTeams = useMemo(() => {
		return discoverTeams.filter((team) => {
			const matchesSearch = team.name
				.toLowerCase()
				.includes(searchQuery.toLowerCase());
			const matchesVariant =
				selectedVariant === "all" || team.variant === selectedVariant;
			return matchesSearch && matchesVariant;
		});
	}, [discoverTeams, searchQuery, selectedVariant]);

	const renderTeamCard = (team: Team, showRole: boolean = false) => {
		const maxMembers =
			team.max_members ?? getMaxMembersForVariant(team.variant);
		const currentMembers = team.team_members.length;
		const isFull = currentMembers >= maxMembers;
		const capacityColor = getCapacityColor(currentMembers, maxMembers);

		// Find current user's role in this team
		const userMembership = showRole
			? team.team_members.find((m) => m.user_id === auth.user.id)
			: null;

		return (
			<Card
				key={team.id}
				className="group transition-all hover:shadow-lg hover:border-primary/20"
			>
				<CardHeader className="pb-3">
					<div className="flex items-start gap-3">
						<TeamAvatar name={team.name} logoUrl={team.logo_url} size="lg" />
						<div className="flex-1 min-w-0">
							<CardTitle className="line-clamp-1 text-lg">
								{team.name}
							</CardTitle>
							<CardDescription className="mt-1 flex flex-wrap items-center gap-2">
								<VariantBadge variant={team.variant} />
								{userMembership && (
									<Badge
										variant={
											userMembership.role === "captain"
												? "default"
												: userMembership.role === "co_captain"
													? "secondary"
													: "outline"
										}
										className="flex items-center gap-1"
									>
										{userMembership.role === "captain" ? (
											<>
												<Star className="h-3 w-3" />
												<span>Capitán</span>
											</>
										) : userMembership.role === "co_captain" ? (
											<>
												<Shield className="h-3 w-3" />
												<span>Vice-Capitán</span>
											</>
										) : (
											<span>Jugador</span>
										)}
									</Badge>
								)}
							</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{team.description && (
						<p className="line-clamp-2 text-sm text-muted-foreground">
							{team.description}
						</p>
					)}

					<div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
						<div className="flex items-center gap-2">
							<Users className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Miembros</span>
						</div>
						<div className="flex items-center gap-1">
							<span className={`text-sm font-bold ${capacityColor}`}>
								{currentMembers}/{maxMembers}
							</span>
							{isFull && (
								<span className="text-xs text-destructive font-medium ml-1">
									(Completo)
								</span>
							)}
						</div>
					</div>

					<Button asChild variant="outline" className="w-full">
						<Link href={teams.show(team.id).url}>
							Ver Equipo
							<ArrowRight className="ml-2 h-4 w-4" />
						</Link>
					</Button>
				</CardContent>
			</Card>
		);
	};

	return (
		<AppLayout breadcrumbs={breadcrumbs}>
			<Head title="Equipos" />
			<div className="flex h-full flex-1 flex-col gap-6 p-6">
				{/* Header */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div>
						<h1 className="text-3xl font-bold tracking-tight">Equipos</h1>
						<p className="text-muted-foreground">
							Gestiona tus equipos y descubre nuevos
						</p>
					</div>
					<CreateTeamModal />
				</div>

				{/* Toggle Group */}
				<div className="flex items-center justify-between gap-4">
					<ToggleGroup
						type="single"
						value={activeView}
						onValueChange={(value) => {
							if (value) setActiveView(value as "my-teams" | "discover");
						}}
						className="justify-start"
					>
						<ToggleGroupItem
							value="my-teams"
							aria-label="Mis Equipos"
							className="gap-2"
						>
							<Users className="h-4 w-4" />
							Mis Equipos
							<span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
								{myTeams.length}
							</span>
						</ToggleGroupItem>
						<ToggleGroupItem
							value="discover"
							aria-label="Descubrir Equipos"
							className="gap-2"
						>
							<Search className="h-4 w-4" />
							Descubrir
							<span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
								{filteredDiscoverTeams.length}
							</span>
						</ToggleGroupItem>
					</ToggleGroup>
				</div>

				{/* My Teams View */}
				{activeView === "my-teams" && (
					<div className="space-y-6">
						{myTeams.length === 0 ? (
							<Card className="flex flex-col items-center justify-center py-12">
								<CardContent className="flex flex-col items-center gap-4 pt-6">
									<div className="rounded-full bg-muted p-4">
										<Users className="h-8 w-8 text-muted-foreground" />
									</div>
									<div className="text-center">
										<h3 className="text-lg font-semibold">Aún no tienes equipos</h3>
										<p className="text-sm text-muted-foreground">
											Crea tu primer equipo o descubre equipos para unirte
										</p>
									</div>
									<CreateTeamModal />
								</CardContent>
							</Card>
						) : (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{myTeams.map((team) => renderTeamCard(team, true))}
							</div>
						)}
					</div>
				)}

				{/* Discover Teams View */}
				{activeView === "discover" && (
					<div className="space-y-6">
						{/* Filters */}
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
							{/* Search Input */}
							<div className="relative flex-1">
								<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									placeholder="Buscar equipos por nombre..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>

							{/* Variant Filter */}
							<Select
								value={selectedVariant}
								onValueChange={setSelectedVariant}
							>
								<SelectTrigger className="w-full sm:w-[180px]">
									<SelectValue placeholder="Seleccionar variante" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">Todas las variantes</SelectItem>
									<SelectItem value="football_11">Fútbol 11</SelectItem>
									<SelectItem value="football_7">Fútbol 7</SelectItem>
									<SelectItem value="football_5">Fútbol 5</SelectItem>
									<SelectItem value="futsal">Futsal</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Results */}
						{discoverTeams.length === 0 ? (
							<Card className="flex flex-col items-center justify-center py-12">
								<CardContent className="flex flex-col items-center gap-4 pt-6">
									<div className="rounded-full bg-muted p-4">
										<Search className="h-8 w-8 text-muted-foreground" />
									</div>
									<div className="text-center">
										<h3 className="text-lg font-semibold">
											No hay equipos disponibles
										</h3>
										<p className="text-sm text-muted-foreground">
											No hay equipos disponibles para unirse en este momento
										</p>
									</div>
								</CardContent>
							</Card>
						) : filteredDiscoverTeams.length === 0 ? (
							<Card className="flex flex-col items-center justify-center py-12">
								<CardContent className="flex flex-col items-center gap-4 pt-6">
									<div className="rounded-full bg-muted p-4">
										<Search className="h-8 w-8 text-muted-foreground" />
									</div>
									<div className="text-center">
										<h3 className="text-lg font-semibold">No se encontraron equipos</h3>
										<p className="text-sm text-muted-foreground">
											Intenta ajustar tus criterios de búsqueda o filtro
										</p>
									</div>
									<Button
										variant="outline"
										onClick={() => {
											setSearchQuery("");
											setSelectedVariant("all");
										}}
									>
										Limpiar Filtros
									</Button>
								</CardContent>
							</Card>
						) : (
							<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
								{filteredDiscoverTeams.map((team) => renderTeamCard(team))}
							</div>
						)}
					</div>
				)}
			</div>
		</AppLayout>
	);
}
