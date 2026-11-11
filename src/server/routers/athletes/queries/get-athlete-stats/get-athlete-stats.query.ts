import type { AthleteStats, GetAthleteStatsInput } from "@/schemas";
import type { Context } from "@/server/context";
import { isErgTest } from "@/server/routers/analytics/common/is-erg-test";

export async function getAthleteStatsQuery(
	input: GetAthleteStatsInput,
	{ db }: Context,
): Promise<AthleteStats> {
	const ergActivities = await db.activity.findMany({
		where: { athleteId: input.athleteId, type: "erg" },
		orderBy: { startDate: "desc" },
		select: {
			id: true,
			type: true,
			distance: true,
			elapsedTime: true,
			startDate: true,
			conceptTwoData: true,
		},
	});

	const getEffectiveDuration = (
		activity: (typeof ergActivities)[number],
		targetDistance: number,
	): { duration: number; date: string; activityId: string } | undefined => {
		if (isErgTest(activity, targetDistance)) {
			return {
				duration: activity.elapsedTime,
				date: activity.startDate.toISOString(),
				activityId: activity.id,
			};
		}

		return undefined;
	};

	const twoKmActivities = ergActivities
		.map((a) => getEffectiveDuration(a, 2000))
		.filter((s): s is NonNullable<typeof s> => s !== undefined);

	const sixKmActivities = ergActivities
		.map((a) => getEffectiveDuration(a, 6000))
		.filter((s): s is NonNullable<typeof s> => s !== undefined);

	const lastTwoKmRaceDuration =
		twoKmActivities.length > 0
			? twoKmActivities.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0]
			: undefined;

	const bestTwoKmRaceDuration =
		twoKmActivities.length > 0
			? twoKmActivities.sort((a, b) => a.duration - b.duration)[0]
			: undefined;

	const lastSixKmRaceDuration =
		sixKmActivities.length > 0
			? sixKmActivities.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0]
			: undefined;

	const bestSixKmRaceDuration =
		sixKmActivities.length > 0
			? sixKmActivities.sort((a, b) => a.duration - b.duration)[0]
			: undefined;

	return {
		lastTwoKmRaceDuration,
		bestTwoKmRaceDuration,
		lastSixKmRaceDuration,
		bestSixKmRaceDuration,
	};
}
