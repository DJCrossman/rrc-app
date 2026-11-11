import { viewerProcedure } from "@/server/procedures";
import { resolveActivityAthleteIds } from "./activity-scope";
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
				athleteId: undefined,
				athleteIds: resolveActivityAthleteIds({
					isAdmin: ctx.user.isAdmin,
					currentAthleteId: ctx.athlete?.id ?? null,
					requestedAthleteIds: [
						...(input.athleteId ? [input.athleteId] : []),
						...(input.athleteIds ?? []),
					],
				}),
			},
			ctx,
		),
	);
