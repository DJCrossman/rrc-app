import { router } from "@/server/trpc";
import { getProgramsProcedure } from "./queries/get-programs/get-programs.procedure";

export const programsRouter = router({
	getPrograms: getProgramsProcedure,
});
