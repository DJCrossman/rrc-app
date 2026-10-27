import { viewerProcedure } from "@/server/procedures";
import { getCurrentAthleteQuery } from "./get-current-athlete.query";

export const getCurrentAthleteProcedure = viewerProcedure.query(({ ctx }) =>
	getCurrentAthleteQuery(undefined, ctx),
);
