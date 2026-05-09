"use client";

import { Plug, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/useAuth";
import { routes } from "@/lib/routes";

const DISMISSED_STORAGE_KEY = "dashboard.integrationAlert.dismissed";

export const IntegrationAlert = () => {
	const { user } = useCurrentUser();
	const [dismissedSignature, setDismissedSignature] = useState<string | null>(
		null,
	);

	useEffect(() => {
		setDismissedSignature(window.localStorage.getItem(DISMISSED_STORAGE_KEY));
	}, []);

	const missing: string[] = [];
	if (!user.concept2Connected) missing.push("Concept2");
	if (!user.stravaConnected) missing.push("Strava");
	if (!user.rcaConnected) missing.push("RCA");

	const signature = missing.join(",");

	if (missing.length === 0 || dismissedSignature === signature) return null;

	const onDismiss = () => {
		window.localStorage.setItem(DISMISSED_STORAGE_KEY, signature);
		setDismissedSignature(signature);
	};

	const missingLabel =
		missing.length <= 2
			? missing.join(" and ")
			: `${missing.slice(0, -1).join(", ")}, and ${missing[missing.length - 1]}`;

	return (
		<div className="px-4 lg:px-6">
			<Alert className="relative pr-12">
				<Plug />
				<AlertTitle>Connect your training data</AlertTitle>
				<AlertDescription>
					<span>
						Link your {missingLabel}{" "}
						{missing.length === 1 ? "account" : "accounts"} to automatically
						sync activities to your dashboard.
					</span>
					<Link
						href={routes.settings.apps()}
						className="font-medium text-primary underline underline-offset-4"
					>
						Connect now
					</Link>
				</AlertDescription>
				<Button
					variant="ghost"
					size="icon"
					className="absolute top-2 right-2 size-7"
					onClick={onDismiss}
					aria-label="Dismiss"
				>
					<X className="size-4" />
				</Button>
			</Alert>
		</div>
	);
};
