import type { Athlete } from "@/app/api/v1/athletes/actions";

export const formatProgram = (program: Athlete["programType"]) => {
	if (!program) return "";
	return program.charAt(0).toUpperCase() + program.slice(1);
};
