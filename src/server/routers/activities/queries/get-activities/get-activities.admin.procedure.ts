import { getActivitiesInputSchema } from "@/schemas";
import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import { getActivitiesQuery } from "./get-activities.query";

export const getActivitiesAdminProcedure = adminProcedure
	.input(getActivitiesInputSchema.optional())
	.query(({ ctx, input }) => getActivitiesQuery(input ?? {}, ctx));
