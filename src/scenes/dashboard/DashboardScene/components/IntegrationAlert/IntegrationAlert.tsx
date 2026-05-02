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
	const [dismissed, setDismissed] = useState(false);

	useEffect(() => {
		setDismissed(window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "true");
	}, []);

	const missing: string[] = [];
	if (!user.concept2Connected) missing.push("Concept2");
	if (!user.stravaConnected) missing.push("Strava");

	if (missing.length === 0 || dismissed) return null;

	const onDismiss = () => {
		window.localStorage.setItem(DISMISSED_STORAGE_KEY, "true");
		setDismissed(true);
	};

	const missingLabel = missing.join(" and ");

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
