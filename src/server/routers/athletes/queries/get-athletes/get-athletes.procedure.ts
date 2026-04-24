import { protectedProcedure } from "@/server/procedures";
import { getAthletesQuery } from "./get-athletes.query";

export const getAthletesProcedure = protectedProcedure.query(({ ctx }) =>
	getAthletesQuery(undefined, ctx),
);
