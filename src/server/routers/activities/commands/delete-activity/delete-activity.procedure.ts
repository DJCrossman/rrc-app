import { TRPCError } from "@trpc/server";
import { deleteActivityInputSchema } from "@/schemas";
import { authenticatedProcedure } from "@/server/common/procedures/authenticated.procedure";
import { deleteActivityCommand } from "./delete-activity.command";

export const deleteActivityProcedure = authenticatedProcedure
	.input(deleteActivityInputSchema)
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
				message: "Cannot delete another athlete's activity",
			});
		}
		return deleteActivityCommand(input, ctx);
	});
