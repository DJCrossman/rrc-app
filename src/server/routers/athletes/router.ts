import { router } from "@/server/trpc";
import { createAthleteProcedure } from "./commands/create-athlete/create-athlete.procedure";
import { updateAthleteProcedure } from "./commands/update-athlete/update-athlete.procedure";
import { getAthleteByIdProcedure } from "./queries/get-athlete-by-id/get-athlete-by-id.procedure";
import { getAthleteStatsProcedure } from "./queries/get-athlete-stats/get-athlete-stats.procedure";
import { getAthletesProcedure } from "./queries/get-athletes/get-athletes.procedure";
import { getCurrentAthleteProcedure } from "./queries/get-current-athlete/get-current-athlete.procedure";

export const athletesRouter = router({
	getAthletes: getAthletesProcedure,
	getAthleteById: getAthleteByIdProcedure,
	getCurrentAthlete: getCurrentAthleteProcedure,
	getAthleteStats: getAthleteStatsProcedure,
	createAthlete: createAthleteProcedure,
	updateAthlete: updateAthleteProcedure,
});
