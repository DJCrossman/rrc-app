import { type AfterableBuilder, wrapBuilder } from "../builder";
import type { AuthenticatedContext } from "../context";
import { requireAuthAndAthlete } from "../middleware/auth";
import { baseProcedure } from "../trpc";

export const authenticatedProcedure: AfterableBuilder<
	AuthenticatedContext,
	undefined
> = wrapBuilder<AuthenticatedContext, undefined>(
	baseProcedure.use(requireAuthAndAthlete),
);
