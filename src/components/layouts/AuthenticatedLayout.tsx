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
	const { user, isAdmin, hasAthlete, isPending, error } = useAuth({
		ensureSignedIn: !isPublicRoute,
	});

	useEffect(() => {
		if (!isPending && !user && !isPublicRoute) {
			router.replace("/login");
		}
	}, [isPending, isPublicRoute, router, user]);

	if (isPublicRoute) {
		return children;
	}

	if (isPending) {
		return null;
	}
	if (error) {
		throw error;
	}
	if (!user) {
		return null;
	}
	return (
		<CurrentUserProvider user={user} isAdmin={isAdmin} hasAthlete={hasAthlete}>
			<SyncStatusProvider>{children}</SyncStatusProvider>
		</CurrentUserProvider>
	);
};
