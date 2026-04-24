import { router } from "@/server/trpc";
import { createBoatProcedure } from "./commands/create-boat/create-boat.procedure";
import { updateBoatProcedure } from "./commands/update-boat/update-boat.procedure";
import { getBoatByIdProcedure } from "./queries/get-boat-by-id/get-boat-by-id.procedure";
import { getBoatsProcedure } from "./queries/get-boats/get-boats.procedure";

export const boatsRouter = router({
	getBoats: getBoatsProcedure,
	getBoatById: getBoatByIdProcedure,
	createBoat: createBoatProcedure,
	updateBoat: updateBoatProcedure,
});
