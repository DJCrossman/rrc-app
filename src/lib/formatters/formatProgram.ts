import type { Athlete } from "@/lib/trpc/types";

export const formatProgram = (program: Athlete["programType"]) => {
	if (!program) return "";
	return program.charAt(0).toUpperCase() + program.slice(1);
};
