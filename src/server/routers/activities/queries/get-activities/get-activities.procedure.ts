import { authenticatedProcedure } from "@/server/common/procedures/authenticated.procedure";
import {
	getActivitiesInputSchema,
	getActivitiesQuery,
} from "./get-activities.query";

export const getActivitiesProcedure = authenticatedProcedure
	.input(getActivitiesInputSchema.optional())
	.query(({ ctx, input = {} }) =>
		getActivitiesQuery({ ...input, athleteId: ctx.athlete.id }, ctx),
	);
