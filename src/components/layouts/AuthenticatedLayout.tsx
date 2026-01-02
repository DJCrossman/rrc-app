"use client";
import { CurrentUserProvider, useAuth } from "@/hooks/useAuth";

export const AuthenticatedLayout = ({
	children,
}: {
	children: React.ReactNode;
}) => {
	const { user, isFetching, error, ...auth } = useAuth();
	if (isFetching) {
		// TODO: Show loading state
		return null;
	}
	if (error) {
		// TODO: Handle error state (e.g., show error message, redirect to login, etc.)
		throw error;
	}
	if (!user) {
		// TODO: Redirect to login page
		return null;
	}
	return (
		<CurrentUserProvider {...auth} user={user}>
			{children}
		</CurrentUserProvider>
	);
};
