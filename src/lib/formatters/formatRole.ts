import type { Athlete } from "@/schemas";

export const formatRole = (role: Athlete["role"]) => {
	return role.charAt(0).toUpperCase() + role.slice(1);
};
