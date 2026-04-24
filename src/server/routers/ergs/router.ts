import { router } from "@/server/trpc";
import { createErgProcedure } from "./commands/create-erg/create-erg.procedure";
import { deleteErgProcedure } from "./commands/delete-erg/delete-erg.procedure";
import { updateErgProcedure } from "./commands/update-erg/update-erg.procedure";
import { getErgByIdProcedure } from "./queries/get-erg-by-id/get-erg-by-id.procedure";
import { getErgsProcedure } from "./queries/get-ergs/get-ergs.procedure";

export const ergsRouter = router({
	getErgs: getErgsProcedure,
	getErgById: getErgByIdProcedure,
	createErg: createErgProcedure,
	updateErg: updateErgProcedure,
	deleteErg: deleteErgProcedure,
});
