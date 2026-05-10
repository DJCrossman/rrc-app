"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { generateQueryKey } from "@/lib/keygen";
import type { CurrentAthlete } from "@/lib/trpc/types";

type AuthBase = {
	error: Error | null;
	isPending: boolean;
	isAdmin: boolean;
	hasAthlete: boolean;
};

type UseAuthResult = AuthBase & { user: CurrentAthlete | null };

type AuthMeResponse = {
	user: CurrentAthlete | null;
	isAdmin: boolean;
	hasAthlete: boolean;
};

const DEFAULT_RESPONSE: AuthMeResponse = {
	user: null,
	isAdmin: false,
	hasAthlete: false,
};

export function useAuth(opts?: { ensureSignedIn?: boolean }): UseAuthResult {
	const { ensureSignedIn = false } = opts ?? {};
	const { data, error, isPending, fetchStatus } = useQuery({
		queryKey: generateQueryKey({ type: "currentUser" }),
		enabled: ensureSignedIn,
		queryFn: async (): Promise<AuthMeResponse> => {
			const response = await fetch("/api/v1/users/me");
			if (response.status === 401) {
				if (ensureSignedIn) {
					throw new Error("User is not signed in.");
				}
				return DEFAULT_RESPONSE;
			}
			if (!response.ok) {
				const errorBody: { message?: string } = await response.json();
				throw new Error(errorBody.message ?? "Failed to fetch user data");
			}
			const data: AuthMeResponse = await response.json();
			return data;
		},
	});

	return {
		user: data?.user ?? null,
		isAdmin: data?.isAdmin ?? false,
		hasAthlete: data?.hasAthlete ?? false,
		error,
		isPending: isPending && fetchStatus !== "idle",
	};
}

type CurrentUserContextValue = {
	user: CurrentAthlete;
	isAdmin: boolean;
	hasAthlete: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export const CurrentUserProvider = ({
	children,
	user,
	isAdmin,
	hasAthlete,
}: React.PropsWithChildren<CurrentUserContextValue>) => (
	<CurrentUserContext.Provider value={{ user, isAdmin, hasAthlete }}>
		{children}
	</CurrentUserContext.Provider>
);

export const useCurrentUser = (): CurrentUserContextValue => {
	const context = useContext(CurrentUserContext);
	if (!context) {
		throw new Error("useCurrentUser must be used within a CurrentUserProvider");
	}
	return context;
};
