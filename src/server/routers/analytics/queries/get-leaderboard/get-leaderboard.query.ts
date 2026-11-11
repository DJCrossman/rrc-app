import { DateTime } from "luxon";
import { paginate } from "@/lib/pagination";
import { AnalyticsPeriodDays, type GetLeaderboardInput } from "@/schemas";
import type { Context } from "@/server/context";
import { mapToAthleteWithGroups } from "@/server/routers/athletes/common/map-to-athlete-with-groups";
import { findGroupRules } from "@/server/routers/groups/common";
import { getWeekStreak } from "../../common/get-week-streak";
import { isErgTest } from "../../common/is-erg-test";

export async function getLeaderboardQuery(
	{ period }: GetLeaderboardInput,
	{ db }: Context,
) {
	const [allAthletes, totalCount, rules] = await Promise.all([
		db.athlete.findMany({
			include: {
				memberships: { include: { program: true } },
				activities: {
					select: {
						distance: true,
						elapsedTime: true,
						type: true,
						startDate: true,
						conceptTwoData: true,
					},
				},
			},
			orderBy: { id: "asc" },
		}),
		db.athlete.count(),
		findGroupRules(db),
	]);

	const now = DateTime.now();
	const since = now
		.minus({ days: AnalyticsPeriodDays[period] })
		.startOf("day")
		.toJSDate();
	const data = allAthletes.map((row) => {
		const athleteDto = mapToAthleteWithGroups(row, rules);
		const meters = row.activities
			.filter((a) => a.startDate >= since)
			.reduce((sum, a) => sum + a.distance, 0);

		const twoKms = row.activities
			.filter((a) => isErgTest(a, 2000))
			.map((a) => a.elapsedTime);
		const sixKms = row.activities
			.filter((a) => isErgTest(a, 6000))
			.map((a) => a.elapsedTime);

		const streak = getWeekStreak(
			row.activities.map((a) => a.startDate),
			now,
		);

		return {
			id: athleteDto.id,
			name: athleteDto.name,
			heightInCm: athleteDto.heightInCm,
			weightInKg: athleteDto.weightInKg,
			groups: athleteDto.groups,
			meters,
			points: 0,
			bestTwoKm: twoKms.length > 0 ? Math.min(...twoKms) : undefined,
			bestSixKm: sixKms.length > 0 ? Math.min(...sixKms) : undefined,
			streak,
		};
	});

	return paginate({ data, totalCount });
}
