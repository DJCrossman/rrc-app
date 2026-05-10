import { createActivitySchema } from "@/schemas";
import { authenticatedProcedure } from "@/server/common/procedures/authenticated.procedure";
import { createActivityCommand } from "./create-activity.command";

export const createActivityProcedure = authenticatedProcedure
	.input(createActivitySchema)
	.mutation(({ ctx, input }) =>
		createActivityCommand({ ...input, athleteId: ctx.athlete.id }, ctx),
	);
