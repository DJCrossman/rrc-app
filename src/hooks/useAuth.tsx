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
	authenticated: boolean;
};

type UseAuthResult = AuthBase & { user: CurrentAthlete | null };

type AuthMeResponse = {
	user: CurrentAthlete | null;
	isAdmin: boolean;
	hasAthlete: boolean;
};

type AuthState = AuthMeResponse & { authenticated: boolean };

const SIGNED_OUT_STATE: AuthState = {
	user: null,
	isAdmin: false,
	hasAthlete: false,
	authenticated: false,
};

export function useAuth(opts?: { ensureSignedIn?: boolean }): UseAuthResult {
	const { ensureSignedIn = false } = opts ?? {};
	const { data, error, isPending, fetchStatus } = useQuery({
		queryKey: generateQueryKey({ type: "currentUser" }),
		enabled: ensureSignedIn,
		queryFn: async (): Promise<AuthState> => {
			const response = await fetch("/api/v1/users/me");
			if (response.status === 401) {
				return SIGNED_OUT_STATE;
			}
			if (!response.ok) {
				const errorBody: { message?: string } = await response.json();
				throw new Error(errorBody.message ?? "Failed to fetch user data");
			}
			const body: AuthMeResponse = await response.json();
			return { ...body, authenticated: true };
		},
	});

	return {
		user: data?.user ?? null,
		isAdmin: data?.isAdmin ?? false,
		hasAthlete: data?.hasAthlete ?? false,
		authenticated: data?.authenticated ?? false,
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
