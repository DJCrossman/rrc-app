"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { CurrentUserProvider, useAuth } from "@/hooks/useAuth";
import { SyncStatusProvider } from "@/hooks/useSyncStatus";

const PUBLIC_ROUTES = new Set(["/login", "/signup"]);

export const AuthenticatedLayout = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const pathname = usePathname();
	const router = useRouter();
	const isPublicRoute = PUBLIC_ROUTES.has(pathname);
	const { user, isPending, error, ...auth } = useAuth({
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
		// TODO: Show loading state
		return null;
	}
	if (error) {
		// TODO: Handle error state (e.g., show error message, redirect to login, etc.)
		throw error;
	}
	if (!user) {
		return null;
	}
	return (
		<CurrentUserProvider {...auth} user={user}>
			<SyncStatusProvider>{children}</SyncStatusProvider>
		</CurrentUserProvider>
	);
};
