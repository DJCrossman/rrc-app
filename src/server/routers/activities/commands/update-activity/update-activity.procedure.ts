import { TRPCError } from "@trpc/server";
import { updateActivitySchema } from "@/schemas";
import { authenticatedProcedure } from "@/server/common/procedures/authenticated.procedure";
import { updateActivityCommand } from "./update-activity.command";

export const updateActivityProcedure = authenticatedProcedure
	.input(updateActivitySchema)
	.mutation(async ({ ctx, input }) => {
		const existing = await ctx.db.activity.findUnique({
			where: { id: input.id },
			select: { athleteId: true },
		});
		if (!existing) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Activity not found",
			});
		}
		if (existing.athleteId !== ctx.athlete.id) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Cannot update another athlete's activity",
			});
		}
		return updateActivityCommand({ ...input, athleteId: ctx.athlete.id }, ctx);
	});
