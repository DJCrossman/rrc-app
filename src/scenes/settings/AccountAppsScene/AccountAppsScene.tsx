"use client";

import { IconBrandStrava } from "@tabler/icons-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/useAuth";

type IntegrationApplication = {
	id: "concept2" | "strava";
	name: string;
	description: string;
};

const IntegrationApplications: IntegrationApplication[] = [
	{
		id: "concept2",
		name: "Concept2",
		description:
			"Sync your erg workouts and performance data from Concept2 Logbook",
	},
	{
		id: "strava",
		name: "Strava",
		description:
			"Connect your Strava account to sync activities and training data",
	},
];

const checkIfConnected = ({
	user,
	app: application,
}: {
	user: ReturnType<typeof useCurrentUser>["user"];
	app: IntegrationApplication;
}): boolean => {
	if (application.id === "concept2") {
		return user.concept2Connected;
	}

	if (application.id === "strava") {
		return user.stravaConnected;
	}

	return false;
};

export const AccountAppsScene = () => {
	const { user } = useCurrentUser();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedApp, setSelectedApp] = useState<IntegrationApplication>();

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold tracking-tight">
					Connected Applications
				</h2>
				<p className="text-muted-foreground">
					Manage your third-party app integrations
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{IntegrationApplications.map((app) => {
					const isConnected = checkIfConnected({ user, app });
					return (
						<Card key={app.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-4">
										<ApplicationIcon id={app.id} />
										<div>
											<CardTitle>{app.name}</CardTitle>
											<Badge
												variant={isConnected ? "default" : "secondary"}
												className="mt-2"
											>
												{isConnected ? "Connected" : "Not Connected"}
											</Badge>
										</div>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<CardDescription>{app.description}</CardDescription>
							</CardContent>
							<CardFooter>
								<Button
									onClick={() => {
										if (isConnected) {
											// Show disconnect confirmation dialog
											setSelectedApp(app);
											setDialogOpen(true);
										} else {
											toast.success(`Connected to ${app?.name}`, {
												description:
													"Your account has been successfully linked",
											});
										}
									}}
									variant={isConnected ? "outline" : "default"}
									className="w-full"
								>
									{isConnected ? "Disconnect" : "Connect"}
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Disconnect {selectedApp?.name}?</DialogTitle>
						<DialogDescription>
							Are you sure you want to disconnect your {selectedApp?.name}{" "}
							account? This will stop syncing data from this service.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDialogOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (selectedApp) {
									toast.success(`Disconnected from ${selectedApp.name}`, {
										description: "Your account has been unlinked",
									});
								}
								setDialogOpen(false);
								setSelectedApp(undefined);
							}}
						>
							Disconnect
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

const ApplicationIcon = ({ id }: { id: string }) => {
	switch (id) {
		case "concept2":
			return (
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
					<span className="text-2xl font-bold">C2</span>
				</div>
			);
		case "strava":
			return (
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FC4C02]">
					<IconBrandStrava className="h-8 w-8 text-white" />
				</div>
			);
		default:
			return (
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
					<span className="text-2xl font-bold">?</span>
				</div>
			);
	}
};
