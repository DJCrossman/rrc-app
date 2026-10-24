import { type AfterableBuilder, wrapBuilder } from "../builder";
import type { ViewerContext } from "../context";
import { requireAuthAndAthleteOrAdmin } from "../middleware/auth";
import { baseProcedure } from "../trpc";

export const viewerProcedure: AfterableBuilder<ViewerContext, undefined> =
	wrapBuilder<ViewerContext, undefined>(
		baseProcedure.use(requireAuthAndAthleteOrAdmin),
	);
