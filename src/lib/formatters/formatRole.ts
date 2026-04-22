import type { Athlete } from "@/app/api/v1/athletes/actions";

export const formatRole = (role: Athlete["role"]) => {
	return role.charAt(0).toUpperCase() + role.slice(1);
};
