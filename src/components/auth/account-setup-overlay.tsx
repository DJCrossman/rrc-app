"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { envVars } from "@/lib/env";
import { generateQueryKey } from "@/lib/keygen";

/**
 * Clerk requires org membership, so a brand-new user's session stays `pending`
 * (reads as not-signed-in) until an active org is set. The default-org
 * membership is created server-side on the onboarding page; this overlay just
 * activates it, which clears the pending session task so onboarding can proceed.
 */
export function AccountSetupOverlay() {
	const { isLoaded, isSignedIn } = useAuth();
	const clerk = useClerk();
	const queryClient = useQueryClient();
	const started = useRef(false);
	const [failed, setFailed] = useState(false);

	const pending = isLoaded && !isSignedIn;

	const runSetup = useCallback(async () => {
		setFailed(false);
		try {
			// The default-org membership is created server-side on the onboarding
			// page; reload so the client sees it, then activate to clear the task.
			await fetch("/api/v1/auth/join-default-org", { method: "POST" });
			await clerk.session?.reload();
			await clerk.setActive({
				organization: envVars.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID,
			});
			await queryClient.invalidateQueries({
				queryKey: generateQueryKey({ type: "currentUser" }),
			});
		} catch {
			setFailed(true);
		}
	}, [clerk, queryClient]);

	useEffect(() => {
		if (pending && !started.current) {
			started.current = true;
			runSetup();
		}
	}, [pending, runSetup]);

	if (!pending) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background text-center">
			{failed ? (
				<>
					<p className="text-sm text-muted-foreground">
						We couldn't finish setting up your account.
					</p>
					<button
						type="button"
						className="text-sm underline hover:text-primary"
						onClick={() => runSetup()}
					>
						Try again
					</button>
				</>
			) : (
				<>
					<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">Finishing sign-up…</p>
				</>
			)}
		</div>
	);
}
