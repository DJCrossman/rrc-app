import { protectedProcedure } from "@/server/procedures";
import { getCurrentAthleteQuery } from "./get-current-athlete.query";

export const getCurrentAthleteProcedure = protectedProcedure.query(({ ctx }) =>
	getCurrentAthleteQuery(undefined, ctx),
);
