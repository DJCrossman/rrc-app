import { adminProcedure } from "@/server/common/procedures/admin.procedure";
import {
	getActivitiesInputSchema,
	getActivitiesQuery,
} from "./get-activities.query";

export const getActivitiesAdminProcedure = adminProcedure
	.input(getActivitiesInputSchema.optional())
	.query(({ ctx, input = {} }) => getActivitiesQuery(input, ctx));
