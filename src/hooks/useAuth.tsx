"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "@/app/api/v1/users/actions";
import { generateQueryKey } from "@/lib/keygen";
import type { UserRole } from "@/schemas";

export const useAuth = () => {
	const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

	const { data, error, isFetching } = useQuery({
		queryKey: generateQueryKey({ type: "currentUser" }),
		queryFn: async () => getCurrentUser(),
	});

	useEffect(() => {
		if (data) {
			setCurrentRole(data.roles[0] ?? null);
		}
	}, [data]);

	const switchRole = (role: UserRole) => {
		setCurrentRole(role);
	};

	return {
		user: data,
		error,
		isFetching,
		currentRole,
		switchRole,
	};
};

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
