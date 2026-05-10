import { type AfterableBuilder, wrapBuilder } from "../builder";
import type { AdminContext } from "../context";
import { requireAuthAndAdmin } from "../middleware/auth";
import { baseProcedure } from "../trpc";

export const adminProcedure: AfterableBuilder<AdminContext, undefined> =
	wrapBuilder<AdminContext, undefined>(baseProcedure.use(requireAuthAndAdmin));
