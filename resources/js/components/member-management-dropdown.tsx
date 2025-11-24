import { router } from "@inertiajs/react";
import {
	ArrowLeftRight,
	MoreVertical,
	Shield,
	Target,
	Trash2,
	User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import teams from "@/routes/teams";

interface TeamMember {
	id: number;
	user_id: number;
	team_id: number;
	role: string;
	position?: string | null;
	user: {
		id: number;
		name: string;
		email: string;
	};
}

interface MemberManagementDropdownProps {
	member: TeamMember;
	teamId: number;
	isCaptain: boolean;
	isLeader: boolean;
	currentUserId: number;
}

export function MemberManagementDropdown({
	member,
	teamId,
	isCaptain,
	isLeader,
	currentUserId,
}: MemberManagementDropdownProps) {
	const isCurrentUser = member.user_id === currentUserId;
	const isMemberCaptain = member.role === "captain";
	const [showTransferDialog, setShowTransferDialog] = useState(false);
	const [showRemoveDialog, setShowRemoveDialog] = useState(false);

	const handleRoleChange = (role: string) => {
		router.put(
			teams.members.updateRole({ teamId, userId: member.user_id }).url,
			{ role },
			{
				preserveScroll: true,
				onSuccess: () => {
					toast.success("Role updated successfully!");
				},
				onError: (errors: any) => {
					const errorMessage = errors?.message || "Failed to update role";
					toast.error(errorMessage);
				},
			},
		);
	};

	const handlePositionChange = (position: string | null) => {
		router.put(
			teams.members.updatePosition({ teamId, userId: member.user_id }).url,
			{ position },
			{
				preserveScroll: true,
				onSuccess: () => {
					toast.success("Position updated successfully!");
				},
				onError: (errors: any) => {
					const errorMessage = errors?.message || "Failed to update position";
					toast.error(errorMessage);
				},
			},
		);
	};

	const handleTransferCaptaincy = () => {
		router.post(
			teams.transferCaptaincy(teamId).url,
			{ new_captain_id: member.user_id },
			{
				preserveScroll: true,
				onSuccess: () => {
					setShowTransferDialog(false);
					toast.success("Captaincy transferred successfully!");
				},
				onError: (errors: any) => {
					setShowTransferDialog(false);
					const errorMessage =
						errors?.message || "Failed to transfer captaincy";
					toast.error(errorMessage);
				},
			},
		);
	};

	const handleRemoveMember = () => {
		router.delete(
			teams.members.remove({ teamId, userId: member.user_id }).url,
			{
				preserveScroll: true,
				onSuccess: () => {
					setShowRemoveDialog(false);
					toast.success("Member removed successfully!");
				},
				onError: (errors: any) => {
					setShowRemoveDialog(false);
					const errorMessage = errors?.message || "Failed to remove member";
					toast.error(errorMessage);
				},
			},
		);
	};

	// Don't show dropdown for non-leaders or if it's the captain viewing their own card
	if (!isLeader || (isMemberCaptain && isCurrentUser)) {
		return null;
	}

	return (
		<>
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="sm" className="h-8 w-8 p-0">
						<MoreVertical className="h-4 w-4" />
						<span className="sr-only">Abrir menú</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-56">
					<DropdownMenuLabel>Gestionar Miembro</DropdownMenuLabel>
					<DropdownMenuSeparator />

					{/* Change Role - Only captain can do this, and not for themselves */}
					{isCaptain && !isMemberCaptain && (
						<DropdownMenuSub>
							<DropdownMenuSubTrigger>
								<Shield className="mr-2 h-4 w-4" />
								Cambiar Rol
							</DropdownMenuSubTrigger>
							<DropdownMenuSubContent>
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										handleRoleChange("co_captain");
									}}
									disabled={member.role === "co_captain"}
								>
									<Shield className="mr-2 h-4 w-4" />
									Vice-Capitán
								</DropdownMenuItem>
								<DropdownMenuItem
									onSelect={(e) => {
										e.preventDefault();
										handleRoleChange("player");
									}}
									disabled={member.role === "player"}
								>
									<User className="mr-2 h-4 w-4" />
									Jugador
								</DropdownMenuItem>
							</DropdownMenuSubContent>
						</DropdownMenuSub>
					)}

					{/* Set Position - Both captain and co-captain can do this */}
					<DropdownMenuSub>
						<DropdownMenuSubTrigger>
							<Target className="mr-2 h-4 w-4" />
							Asignar Posición
						</DropdownMenuSubTrigger>
						<DropdownMenuSubContent>
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									handlePositionChange("goalkeeper");
								}}
								disabled={member.position === "goalkeeper"}
							>
								🧤 Portero
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									handlePositionChange("defender");
								}}
								disabled={member.position === "defender"}
							>
								🛡️ Defensor
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									handlePositionChange("midfielder");
								}}
								disabled={member.position === "midfielder"}
							>
								⚡ Mediocampista
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									handlePositionChange("forward");
								}}
								disabled={member.position === "forward"}
							>
								⚽ Delantero
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									handlePositionChange(null);
								}}
								disabled={!member.position}
							>
								Limpiar Posición
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuSub>

					{/* Transfer Captaincy - Only captain can do this, and only for non-captains */}
					{isCaptain && !isMemberCaptain && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onSelect={(e) => {
									e.preventDefault();
									setShowTransferDialog(true);
								}}
							>
								<ArrowLeftRight className="mr-2 h-4 w-4" />
								Transferir Capitanía
							</DropdownMenuItem>
						</>
					)}

					{/* Remove Member - Leaders can do this, but cannot remove captain */}
					{!isMemberCaptain && (
						<>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								variant="destructive"
								onSelect={(e) => {
									e.preventDefault();
									setShowRemoveDialog(true);
								}}
							>
								<Trash2 className="mr-2 h-4 w-4" />
								Remover del Equipo
							</DropdownMenuItem>
						</>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Transfer Captaincy Confirmation Dialog */}
			<AlertDialog
				open={showTransferDialog}
				onOpenChange={setShowTransferDialog}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Transferir Capitanía</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estás seguro de que quieres transferir la capitanía a{" "}
							<span className="font-semibold">{member.user.name}</span>? Te
							convertirás en un jugador regular después de esta acción.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleTransferCaptaincy}>
							Transferir Capitanía
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Remove Member Confirmation Dialog */}
			<AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remover Miembro del Equipo</AlertDialogTitle>
						<AlertDialogDescription>
							¿Estás seguro de que quieres remover a{" "}
							<span className="font-semibold">{member.user.name}</span> del
							equipo? Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemoveMember}
							className="bg-destructive text-foreground hover:bg-destructive/90"
						>
							Remover Miembro
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
