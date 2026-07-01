import { DateTime } from "luxon";
import { paginate } from "@/lib/pagination";
import type { AuthenticatedContext } from "@/server/context";
import { mapToAthleteDto } from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function getLeaderboardQuery(
	_input: undefined,
	{ db }: AuthenticatedContext,
) {
	const [allAthletes, totalCount] = await Promise.all([
		db.athlete.findMany({
			include: {
				memberships: { include: { program: true } },
				activities: {
					select: {
						distance: true,
						elapsedTime: true,
						type: true,
						startDate: true,
					},
				},
			},
			orderBy: { id: "asc" },
		}),
		db.athlete.count(),
	]);

	const data = allAthletes.map((row) => {
		const athleteDto = mapToAthleteDto(row);
		const ergActivities = row.activities.filter((a) => a.type === "erg");
		const meters = row.activities.reduce((sum, a) => sum + a.distance, 0);

		const twoKms = ergActivities
			.filter((a) => a.distance === 2000)
			.map((a) => a.elapsedTime);
		const sixKms = ergActivities
			.filter((a) => a.distance === 6000)
			.map((a) => a.elapsedTime);

		const activityDays = new Set(
			row.activities.map((a) => a.startDate.toISOString().split("T")[0]),
		);
		let streak = 0;
		let streakCursor = DateTime.now().startOf("day");
		while (activityDays.has(streakCursor.toISODate() ?? "")) {
			streak++;
			streakCursor = streakCursor.minus({ days: 1 });
		}

		return {
			id: athleteDto.id,
			name: athleteDto.name,
			heightInCm: athleteDto.heightInCm,
			weightInKg: athleteDto.weightInKg,
			memberships: athleteDto.memberships,
			activeMembership: athleteDto.activeMembership,
			meters,
			points: 0,
			bestTwoKm: twoKms.length > 0 ? Math.min(...twoKms) : undefined,
			bestSixKm: sixKms.length > 0 ? Math.min(...sixKms) : undefined,
			streak,
		};
	});

	return paginate({ data, totalCount });
}
