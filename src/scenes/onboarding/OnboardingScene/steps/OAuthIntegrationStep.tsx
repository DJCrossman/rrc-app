"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ApplicationIcon } from "@/components/integrations/application-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpcClient } from "@/lib/trpc/client";

type OAuthProvider = "strava" | "concept2";

const PROVIDER_CONFIG: Record<
	OAuthProvider,
	{ name: string; description: string }
> = {
	strava: {
		name: "Strava",
		description:
			"Connect your Strava account to sync activities and training data.",
	},
	concept2: {
		name: "Concept2",
		description:
			"Sync your erg workouts and performance data from Concept2 Logbook.",
	},
};

interface OAuthIntegrationStepProps {
	provider: OAuthProvider;
	connected: boolean;
	onContinue: () => void;
	onSkip: () => void;
	onBack?: () => void;
}

export function OAuthIntegrationStep({
	provider,
	connected,
	onContinue,
	onSkip,
	onBack,
}: OAuthIntegrationStepProps) {
	const config = PROVIDER_CONFIG[provider];
	const returnTo = `/onboarding?step=${provider}`;
	const authorizeUrl = `/api/v1/${provider}/authorize?returnTo=${encodeURIComponent(returnTo)}`;

	const stravaSync = trpcClient.activities.syncStravaActivities.useMutation();
	const concept2Sync =
		trpcClient.activities.syncConcept2Activities.useMutation();
	const sync = provider === "strava" ? stravaSync : concept2Sync;

	const handleSync = () => {
		sync.mutate(undefined, {
			onSuccess: () => {
				toast.success(`Syncing ${config.name}`, {
					description: "New activities will appear shortly.",
				});
			},
			onError: (error) => {
				toast.error(`${config.name} sync failed`, {
					description: error.message,
				});
			},
		});
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<ApplicationIcon id={provider} />
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<h2 className="text-2xl font-semibold">{config.name}</h2>
						<Badge variant={connected ? "default" : "secondary"}>
							{connected ? "Connected" : "Not connected"}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">{config.description}</p>
				</div>
			</div>

			{connected ? (
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Your {config.name} account is connected. Sync now to import your
						recent activities.
					</p>
					<Button
						type="button"
						variant="secondary"
						onClick={handleSync}
						disabled={sync.isPending}
					>
						{sync.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Syncing…
							</>
						) : (
							"Sync now"
						)}
					</Button>
				</div>
			) : (
				<p className="text-sm text-muted-foreground">
					Connect your {config.name} account to import your activities.
				</p>
			)}

			<div className="flex items-center justify-between gap-2">
				{onBack ? (
					<Button type="button" variant="ghost" onClick={onBack}>
						Back
					</Button>
				) : (
					<span />
				)}
				{connected ? (
					<Button type="button" onClick={onContinue}>
						Continue
					</Button>
				) : (
					<div className="flex gap-2">
						<Button type="button" variant="outline" onClick={onSkip}>
							Skip for now
						</Button>
						<Button asChild>
							<a href={authorizeUrl}>Connect {config.name}</a>
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}
