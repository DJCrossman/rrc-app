"use client";

import { ErrorFallback } from "@/components/error-fallback";
import { FeedbackDrawer } from "@/components/feedback-drawer";
import { Toaster } from "@/components/ui/sonner";
import { TRPCReactProvider } from "@/lib/trpc/Provider";
import "./globals.css";

export default function GlobalError({
	error,
	retry,
}: {
	error: Error & { digest?: string };
	retry: () => void;
}) {
	return (
		<html lang="en">
			<body className="antialiased dark">
				<title>Something went wrong</title>
				<TRPCReactProvider>
					<ErrorFallback error={error} retry={retry} />
					<FeedbackDrawer />
					<Toaster />
				</TRPCReactProvider>
			</body>
		</html>
	);
}
