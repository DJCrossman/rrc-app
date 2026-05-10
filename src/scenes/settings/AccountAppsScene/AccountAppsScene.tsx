"use client";

import { IconBrandStrava } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/hooks/useAuth";
import { type SyncSource, useSyncStatus } from "@/hooks/useSyncStatus";
import { trpcClient } from "@/lib/trpc/client";

export type IntegrationApplication =
	| {
			id: SyncSource;
			name: string;
			description: string;
			authType: "oauth";
			authUrl: string;
	  }
	| {
			id: SyncSource;
			name: string;
			description: string;
			authType: "credentials";
			connectUrl: string;
	  };

const checkIfConnected = ({
	user,
	app: application,
}: {
	user: ReturnType<typeof useCurrentUser>["user"];
	app: IntegrationApplication;
}): boolean => {
	if (application.id === "concept2") return user.concept2Connected;
	if (application.id === "strava") return user.stravaConnected;
	if (application.id === "rca") return user.rcaConnected;
	return false;
};

export const AccountAppsScene = ({
	integrations,
}: {
	integrations: IntegrationApplication[];
}) => {
	const { user, hasAthlete } = useCurrentUser();
	const utils = trpcClient.useUtils();
	const queryClient = useQueryClient();
	const { runningSources, cooldownSources } = useSyncStatus();
	const [disconnectDialogOpen, setDisconnectDialogOpen] = useState(false);
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

	const rcaSync = trpcClient.activities.syncRca.useMutation({
		onSuccess: (result) => {
			const parts = [
				`${result.programs.upserted} programs`,
				`${result.memberships.upserted} memberships`,
			];
			if (result.memberships.skipped > 0) {
				parts.push(`${result.memberships.skipped} skipped`);
			}
			toast.success("Synced Rowing Canada", {
				description: parts.join(" · "),
			});
			queryClient.invalidateQueries();
		},
		onError: (error) => {
			toast.error("Rowing Canada sync failed", {
				description: error.message,
			});
			queryClient.invalidateQueries();
		},
	});

	const stravaDisconnect = trpcClient.activities.disconnectStrava.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success(`Disconnected from Strava`, {
				description: "Your account has been unlinked",
			});
		},
	});

	const concept2Disconnect =
		trpcClient.activities.disconnectConcept2.useMutation({
			onSuccess: () => {
				queryClient.invalidateQueries();
				toast.success(`Disconnected from Concept2`, {
					description: "Your account has been unlinked",
				});
			},
		});

	const rcaDisconnect = trpcClient.activities.disconnectRca.useMutation({
		onSuccess: () => {
			queryClient.invalidateQueries();
			toast.success(`Disconnected from Rowing Canada`, {
				description: "Your account has been unlinked",
			});
		},
	});

	const isSyncing = (source: SyncSource): boolean => {
		if (source === "strava" && stravaSync.isPending) return true;
		if (source === "concept2" && concept2Sync.isPending) return true;
		if (source === "rca" && rcaSync.isPending) return true;
		return runningSources.has(source);
	};

	const isLocked = (source: SyncSource): boolean =>
		isSyncing(source) || cooldownSources.has(source);

	const startSync = (source: SyncSource) => {
		if (isLocked(source)) return;
		if (source === "strava") stravaSync.mutate();
		else if (source === "concept2") concept2Sync.mutate();
		else if (source === "rca") rcaSync.mutate();
	};

	const isDisconnecting =
		stravaDisconnect.isPending ||
		concept2Disconnect.isPending ||
		rcaDisconnect.isPending;

	const supportsSync = (source: SyncSource): boolean =>
		source === "strava" || source === "concept2" || source === "rca";

	const handleCredentialConnected = (app: IntegrationApplication) => {
		queryClient.invalidateQueries();
		if (app.id === "rca") rcaSync.mutate();
	};

	if (!hasAthlete) {
		return (
			<div className="space-y-6">
				<div>
					<h2 className="text-2xl font-bold tracking-tight">
						Connected Applications
					</h2>
					<p className="text-muted-foreground">
						You're signed in as an admin and don't have a personal athlete
						profile. Connect integrations from a member account instead.
					</p>
				</div>
			</div>
		);
	}

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
					const showCredentialForm =
						!isConnected && app.authType === "credentials";
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
							<CardContent className="space-y-4">
								<CardDescription>{app.description}</CardDescription>
								{showCredentialForm && (
									<CredentialsForm
										app={app}
										onConnected={() => handleCredentialConnected(app)}
									/>
								)}
							</CardContent>
							<CardFooter className="gap-2">
								{!isConnected && app.authType === "oauth" && (
									<Button asChild className="w-full">
										<Link href={app.authUrl}>Connect</Link>
									</Button>
								)}
								{isConnected && (
									<>
										{supportsSync(app.id) && (
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
										)}
										<Button
											variant="outline"
											className="flex-1"
											onClick={() => {
												setSelectedApp(app);
												setDisconnectDialogOpen(true);
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

			<Dialog
				open={disconnectDialogOpen}
				onOpenChange={setDisconnectDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Disconnect {selectedApp?.name}?</DialogTitle>
						<DialogDescription>
							Are you sure you want to disconnect your {selectedApp?.name}{" "}
							account? This will stop syncing data from this service.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDisconnectDialogOpen(false)}
							disabled={isDisconnecting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (!selectedApp) return;
								const mutation =
									selectedApp.id === "strava"
										? stravaDisconnect
										: selectedApp.id === "concept2"
											? concept2Disconnect
											: rcaDisconnect;
								mutation.mutate(undefined, {
									onSettled: () => {
										setDisconnectDialogOpen(false);
										setSelectedApp(undefined);
									},
								});
							}}
							disabled={isDisconnecting}
						>
							{isDisconnecting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Disconnecting…
								</>
							) : (
								"Disconnect"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

const CredentialsForm = ({
	app,
	onConnected,
}: {
	app: Extract<IntegrationApplication, { authType: "credentials" }>;
	onConnected: () => void;
}) => {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const inputId = `${app.id}-username`;
	const passwordId = `${app.id}-password`;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		try {
			const response = await fetch(app.connectUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			if (!response.ok) {
				setError(
					response.status === 401
						? "Invalid username or password"
						: "Could not reach the service. Please try again.",
				);
				return;
			}
			toast.success(`Connected to ${app.name}`, {
				description: "Your account has been successfully linked",
			});
			setUsername("");
			setPassword("");
			onConnected();
		} catch {
			setError("Network error. Please try again.");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-3">
			<div className="space-y-2">
				<Label htmlFor={inputId}>Username or Member Number</Label>
				<Input
					id={inputId}
					type="text"
					autoComplete="username"
					required
					value={username}
					onChange={(e) => setUsername(e.target.value)}
					disabled={submitting}
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={passwordId}>Password</Label>
				<Input
					id={passwordId}
					type="password"
					autoComplete="current-password"
					required
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					disabled={submitting}
				/>
			</div>
			{error && (
				<p className="text-sm text-destructive" role="alert">
					{error}
				</p>
			)}
			<Button type="submit" className="w-full" disabled={submitting}>
				{submitting ? (
					<>
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						Connecting…
					</>
				) : (
					"Connect"
				)}
			</Button>
		</form>
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
		case "rca":
			return (
				<div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#C8102E]">
					<span className="text-lg font-bold text-white">RCA</span>
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
