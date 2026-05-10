import { type AfterableBuilder, wrapBuilder } from "../builder";
import type { UnauthenticatedContext } from "../context";
import { baseProcedure } from "../trpc";

export const unauthenticatedProcedure: AfterableBuilder<
	UnauthenticatedContext,
	undefined
> = wrapBuilder<UnauthenticatedContext, undefined>(baseProcedure);
