import type { Athlete } from "@/lib/trpc/types";

export const formatRole = (role: Athlete["role"]) => {
	return role.charAt(0).toUpperCase() + role.slice(1);
};
