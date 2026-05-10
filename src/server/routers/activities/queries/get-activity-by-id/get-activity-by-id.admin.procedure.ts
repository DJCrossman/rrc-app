import { getActivityByIdInputSchema } from "@/schemas";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { getActivityByIdQuery } from "./get-activity-by-id.query";

export const getActivityByIdAdminProcedure = adminProcedure
	.input(getActivityByIdInputSchema)
	.query(({ ctx, input }) => getActivityByIdQuery(input, ctx));
