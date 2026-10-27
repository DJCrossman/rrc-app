import { TRPCError } from "@trpc/server";
import { getActivityByIdInputSchema } from "@/schemas";
import { viewerProcedure } from "@/server/procedures";
import {
	activityInclude,
	mapToActivityDto,
} from "@/server/routers/activities/common/map-to-activity-dto";

export const getActivityByIdProcedure = viewerProcedure
	.input(getActivityByIdInputSchema)
	.query(async ({ ctx, input }) => {
		if (!input.id) return null;
		const row = await ctx.db.activity.findUnique({
			where: { id: input.id },
			include: activityInclude,
		});
		if (!row) return null;
		if (!ctx.user.isAdmin && row.athleteId !== ctx.athlete?.id) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "Cannot view another athlete's activity",
			});
		}
		return mapToActivityDto(row);
	});
