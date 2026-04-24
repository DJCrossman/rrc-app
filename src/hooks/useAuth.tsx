"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { generateQueryKey } from "@/lib/keygen";
import type { CurrentAthlete } from "@/lib/trpc/types";

type AuthBase = {
	error: Error | null;
	isFetching: boolean;
};

export function useAuth(opts: {
	ensureSignedIn: true;
}): AuthBase & { user: CurrentAthlete };
export function useAuth(opts?: {
	ensureSignedIn?: boolean;
}): AuthBase & { user: CurrentAthlete | null };
export function useAuth({
	ensureSignedIn = false,
}: {
	ensureSignedIn?: boolean;
} = {}) {
	const { data, error, isFetching } = useQuery({
		queryKey: generateQueryKey({ type: "currentUser" }),
		enabled: ensureSignedIn,
		queryFn: async (): Promise<CurrentAthlete | null> => {
			const response = await fetch("/api/v1/users/me");
			const data = await response.json();
			if (response.status === 401) {
				if (ensureSignedIn) {
					throw new Error("User is not signed in.");
				}
				return null;
			}
			if (!response.ok) {
				throw new Error(data.message || "Failed to fetch user data");
			}
			return data;
		},
	});

	return {
		user: data ?? null,
		error,
		isFetching,
	};
}

type CurrentUser = Omit<
	ReturnType<typeof useAuth>,
	"user" | "error" | "isFetching"
> & {
	user: NonNullable<ReturnType<typeof useAuth>["user"]>;
};

const CurrentUserContext = createContext<CurrentUser | null>(null);
export const CurrentUserProvider = ({
	children,
	...value
}: React.PropsWithChildren<CurrentUser>) => (
	<CurrentUserContext.Provider value={value}>
		{children}
	</CurrentUserContext.Provider>
);

export const useCurrentUser = (): CurrentUser => {
	const context = useContext(CurrentUserContext);
	if (!context) {
		throw new Error("useCurrentUser must be used within a CurrentUserProvider");
	}
	return context;
};
