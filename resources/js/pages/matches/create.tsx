import { Head, router, useForm } from "@inertiajs/react";
import { CalendarIcon } from "lucide-react";
import { useEffect } from "react";
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

const breadcrumbs: BreadcrumbItem[] = [
	{
		title: "Matches",
		href: matches.index().url,
	},
	{
		title: "Post Match",
		href: matches.create().url,
	},
];

interface Team {
	id: number;
	name: string;
	variant: string;
	logo_url?: string;
	team_members: Array<{
		id: number;
		user: {
			id: number;
			name: string;
		};
	}>;
}

interface Props {
	teams: Team[];
}

export default function Create({ teams }: Props) {
	const { data, setData, post, processing, errors } = useForm({
		team_id: teams.length > 0 ? teams[0].id.toString() : "",
		scheduled_at: "",
		location: "",
		location_coords: "",
		match_type: "friendly",
		notes: "",
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		post(matches.store().url, {
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
			<Head title="Post Match" />
			<div className="flex h-full flex-1 flex-col gap-6 p-6">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Post Match Availability
					</h1>
					<p className="text-muted-foreground">
						Create a match listing for other teams to request
					</p>
				</div>

				<Card className="max-w-2xl">
					<CardHeader>
						<CardTitle>Match Details</CardTitle>
						<CardDescription>
							Fill in the details for your match availability
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="team_id">Your Team</Label>
								<Select
									value={data.team_id}
									onValueChange={(value) => setData("team_id", value)}
								>
									<SelectTrigger id="team_id">
										<SelectValue placeholder="Select a team" />
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

						<div className="space-y-2">
							<Label htmlFor="scheduled_at">Match Date & Time</Label>
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
								<Label htmlFor="location">Location</Label>
								<Input
									id="location"
									type="text"
									placeholder="Enter match location"
									value={data.location}
									onChange={(e) => setData("location", e.target.value)}
								/>
								{errors.location && (
									<p className="text-sm text-destructive">{errors.location}</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="match_type">Match Type</Label>
								<Select
									value={data.match_type}
									onValueChange={(value) => setData("match_type", value)}
								>
									<SelectTrigger id="match_type">
										<SelectValue placeholder="Select match type" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="friendly">Friendly</SelectItem>
										<SelectItem value="competitive">Competitive</SelectItem>
									</SelectContent>
								</Select>
								{errors.match_type && (
									<p className="text-sm text-destructive">
										{errors.match_type}
									</p>
								)}
							</div>

							<div className="space-y-2">
								<Label htmlFor="notes">Notes (Optional)</Label>
								<Textarea
									id="notes"
									placeholder="Add any additional information about the match..."
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
									{processing ? "Creating..." : "Post Match"}
								</Button>
								<Button
									type="button"
									variant="outline"
									onClick={() => router.visit(matches.index().url)}
								>
									Cancel
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>
		</AppLayout>
	);
}

