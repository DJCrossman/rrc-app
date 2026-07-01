"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApplicationIcon } from "@/components/integrations/application-icon";
import { RowingCanadaDescription } from "@/components/integrations/rowing-canada-description";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpcClient } from "@/lib/trpc/client";

interface RowingCanadaStepProps {
	connected: boolean;
	onContinue: () => void;
	onSkip: () => void;
	onBack?: () => void;
	onConnected: () => Promise<void> | void;
}

export function RowingCanadaStep({
	connected,
	onContinue,
	onSkip,
	onBack,
	onConnected,
}: RowingCanadaStepProps) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const connectRca = trpcClient.activities.connectRca.useMutation();
	const syncRca = trpcClient.activities.syncRca.useMutation({
		onSuccess: (result) => {
			const parts = [
				`${result.programs.upserted} programs`,
				`${result.memberships.upserted} memberships`,
			];
			toast.success("Synced Rowing Canada", { description: parts.join(" · ") });
		},
		onError: (syncError) => {
			toast.error("Rowing Canada sync failed", {
				description: syncError.message,
			});
		},
	});

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		if (connected) {
			onContinue();
			return;
		}
		setError(null);
		try {
			await connectRca.mutateAsync({ username, password });
			toast.success("Connected to Rowing Canada");
			setUsername("");
			setPassword("");
			syncRca.mutate();
			await onConnected();
		} catch (connectError) {
			setError(
				connectError instanceof Error
					? connectError.message
					: "Could not connect. Please check your credentials.",
			);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="flex items-center gap-4">
				<ApplicationIcon id="rca" />
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<h2 className="text-2xl font-semibold">Rowing Canada</h2>
						<Badge variant={connected ? "default" : "secondary"}>
							{connected ? "Connected" : "Not connected"}
						</Badge>
					</div>
					<p className="text-sm text-muted-foreground">
						<RowingCanadaDescription />
					</p>
				</div>
			</div>

			{connected ? (
				<p className="text-sm text-muted-foreground">
					Your Rowing Canada account is connected
					{syncRca.isPending ? " and syncing now." : "."}
				</p>
			) : (
				<div className="space-y-3">
					<div className="space-y-2">
						<Label htmlFor="rca-username">Username or Member Number</Label>
						<Input
							id="rca-username"
							type="text"
							autoComplete="username"
							required
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							disabled={connectRca.isPending}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="rca-password">Password</Label>
						<Input
							id="rca-password"
							type="password"
							autoComplete="current-password"
							required
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							disabled={connectRca.isPending}
						/>
					</div>
					{error && (
						<p className="text-sm text-destructive" role="alert">
							{error}
						</p>
					)}
				</div>
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
						<Button type="submit" disabled={connectRca.isPending}>
							{connectRca.isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Connecting…
								</>
							) : (
								"Connect"
							)}
						</Button>
					</div>
				)}
			</div>
		</form>
	);
}
