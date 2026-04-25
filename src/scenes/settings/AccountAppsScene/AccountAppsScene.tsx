"use client";

import { IconBrandStrava } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
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
import { type SyncSource, useSyncStatus } from "@/hooks/useSyncStatus";
import { trpcClient } from "@/lib/trpc/client";

export type IntegrationApplication = {
	id: SyncSource;
	name: string;
	description: string;
	authUrl: string;
};

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

export const AccountAppsScene = ({
	integrations,
}: {
	integrations: IntegrationApplication[];
}) => {
	const { user } = useCurrentUser();
	const utils = trpcClient.useUtils();
	const { runningSources, cooldownSources } = useSyncStatus();
	const [dialogOpen, setDialogOpen] = useState(false);
	const [selectedApp, setSelectedApp] = useState<IntegrationApplication>();

	const onSyncSettled = () => {
		utils.activities.getActivities.invalidate();
		utils.activities.getPendingInboxBatches.invalidate();
	};

	const stravaSync = trpcClient.activities.syncStravaActivities.useMutation({
		onSuccess: onSyncSettled,
		onError: onSyncSettled,
	});

	const concept2Sync = trpcClient.activities.syncConcept2Activities.useMutation(
		{ onSuccess: onSyncSettled, onError: onSyncSettled },
	);

	const isSyncing = (source: SyncSource): boolean => {
		if (source === "strava" && stravaSync.isPending) return true;
		if (source === "concept2" && concept2Sync.isPending) return true;
		return runningSources.has(source);
	};

	const isLocked = (source: SyncSource): boolean =>
		isSyncing(source) || cooldownSources.has(source);

	const startSync = (source: SyncSource) => {
		if (isLocked(source)) return;
		if (source === "strava") stravaSync.mutate();
		else concept2Sync.mutate();
	};

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
				{integrations.map((app) => {
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
							<CardFooter className="gap-2">
								{!isConnected && app.authUrl && (
									<Button asChild className="w-full">
										<Link href={app.authUrl}>Connect</Link>
									</Button>
								)}
								{!isConnected && !app.authUrl && (
									<Button
										onClick={() => {
											toast.success(`Connected to ${app?.name}`, {
												description:
													"Your account has been successfully linked",
											});
										}}
										className="w-full"
									>
										Connect
									</Button>
								)}
								{isConnected && (
									<>
										<Button
											onClick={() => startSync(app.id)}
											disabled={isLocked(app.id)}
											className="flex-1"
										>
											{isSyncing(app.id) ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Syncing…
												</>
											) : cooldownSources.has(app.id) ? (
												"Sync (cooling down)"
											) : (
												"Sync"
											)}
										</Button>
										<Button
											variant="outline"
											className="flex-1"
											onClick={() => {
												setSelectedApp(app);
												setDialogOpen(true);
											}}
										>
											Disconnect
										</Button>
									</>
								)}
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
