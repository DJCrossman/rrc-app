import { getActivitiesInputSchema } from "@/schemas";
import { protectedProcedure } from "@/server/procedures";
import { getActivitiesQuery } from "./get-activities.query";

export const getActivitiesProcedure = protectedProcedure
	.input(getActivitiesInputSchema.optional())
	.query(({ ctx, input }) => getActivitiesQuery(input ?? {}, ctx));
