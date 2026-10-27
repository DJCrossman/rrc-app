import { viewerProcedure } from "@/server/procedures";
import { resolveActivityAthleteId } from "./activity-scope";
import {
	getActivitiesInputSchema,
	getActivitiesQuery,
} from "./get-activities.query";

export const getActivitiesProcedure = viewerProcedure
	.input(getActivitiesInputSchema.optional())
	.query(({ ctx, input = {} }) =>
		getActivitiesQuery(
			{
				...input,
				athleteId: resolveActivityAthleteId({
					isAdmin: ctx.user.isAdmin,
					currentAthleteId: ctx.athlete?.id ?? null,
					requestedAthleteId: input.athleteId,
				}),
			},
			ctx,
		),
	);
