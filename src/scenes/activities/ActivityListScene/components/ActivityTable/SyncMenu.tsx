"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrentUser } from "@/hooks/useAuth";
import { type SyncSource, useSyncStatus } from "@/hooks/useSyncStatus";
import { trpcClient } from "@/lib/trpc/client";

export function SyncMenu() {
	const { user } = useCurrentUser();
	const { runningSources, cooldownSources } = useSyncStatus();
	const utils = trpcClient.useUtils();

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

	const isSyncing = (source: SyncSource) => {
		if (source === "strava" && stravaSync.isPending) return true;
		if (source === "concept2" && concept2Sync.isPending) return true;
		return runningSources.has(source);
	};
	const isLocked = (source: SyncSource) =>
		isSyncing(source) || cooldownSources.has(source);

	const startSync = (source: SyncSource) => {
		if (isLocked(source)) return;
		if (source === "strava") stravaSync.mutate();
		else if (source === "concept2") concept2Sync.mutate();
	};

	if (!user.stravaConnected && !user.concept2Connected) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className="rounded-l-none border-l-0 px-2"
					aria-label="Sync activities"
				>
					<IconChevronDown />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{user.stravaConnected && (
					<SyncMenuItem
						label="Sync Strava"
						source="strava"
						syncing={isSyncing("strava")}
						coolingDown={cooldownSources.has("strava")}
						disabled={isLocked("strava")}
						onSelect={() => startSync("strava")}
					/>
				)}
				{user.concept2Connected && (
					<SyncMenuItem
						label="Sync Concept2"
						source="concept2"
						syncing={isSyncing("concept2")}
						coolingDown={cooldownSources.has("concept2")}
						disabled={isLocked("concept2")}
						onSelect={() => startSync("concept2")}
					/>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function SyncMenuItem({
	label,
	syncing,
	coolingDown,
	disabled,
	onSelect,
}: {
	label: string;
	source: SyncSource;
	syncing: boolean;
	coolingDown: boolean;
	disabled: boolean;
	onSelect: () => void;
}) {
	return (
		<DropdownMenuItem disabled={disabled} onSelect={onSelect}>
			{syncing ? (
				<>
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					{label} (syncing…)
				</>
			) : coolingDown ? (
				<>{label} (cooling down)</>
			) : (
				label
			)}
		</DropdownMenuItem>
	);
}
