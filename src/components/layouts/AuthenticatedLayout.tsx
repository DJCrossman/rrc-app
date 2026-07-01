"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CurrentUserProvider, useAuth } from "@/hooks/useAuth";
import { SyncStatusProvider } from "@/hooks/useSyncStatus";

const PUBLIC_ROUTES = new Set(["/login", "/signup", "/onboarding"]);

export const AuthenticatedLayout = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const pathname = usePathname();
	const router = useRouter();
	const isPublicRoute = PUBLIC_ROUTES.has(pathname);
	const { user, isAdmin, hasAthlete, authenticated, isPending, error } =
		useAuth({
			ensureSignedIn: !isPublicRoute,
		});

	useEffect(() => {
		if (isPending || isPublicRoute) {
			return;
		}
		if (!authenticated) {
			router.replace("/login");
			return;
		}
		// Members without a profile go through onboarding; invited admins skip it.
		if (!hasAthlete && !isAdmin) {
			router.replace("/onboarding");
		}
	}, [authenticated, hasAthlete, isAdmin, isPending, isPublicRoute, router]);

	if (isPublicRoute) {
		return children;
	}

	if (isPending) {
		return null;
	}
	if (error) {
		throw error;
	}
	if (!authenticated || !user) {
		return null;
	}
	return (
		<CurrentUserProvider user={user} isAdmin={isAdmin} hasAthlete={hasAthlete}>
			<SyncStatusProvider>{children}</SyncStatusProvider>
		</CurrentUserProvider>
	);
};
