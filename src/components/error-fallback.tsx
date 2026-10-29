"use client";

import { IconAlertTriangle } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { openFeedback, toReportedError } from "@/lib/feedback";

export const ErrorFallback = ({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) => (
	<div className="flex min-h-svh flex-col items-center justify-center gap-5 p-6 text-center">
		<span className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
			<IconAlertTriangle className="size-6" />
		</span>
		<div className="flex max-w-sm flex-col gap-1.5">
			<h1 className="text-xl font-semibold">Something went wrong</h1>
			<p className="text-sm text-muted-foreground">
				Try again, or report it so we can fix it.
			</p>
			{error.digest && (
				<p className="font-mono text-xs text-muted-foreground">
					Ref {error.digest}
				</p>
			)}
		</div>
		<div className="flex gap-2">
			<Button variant="outline" onClick={() => retry()}>
				Try again
			</Button>
			<Button onClick={() => openFeedback({ error: toReportedError(error) })}>
				Report problem
			</Button>
		</div>
	</div>
);
