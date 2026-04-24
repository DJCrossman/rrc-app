import { DateTime } from "luxon";
import type { Context } from "@/server/context";
import { mapToAthleteDto } from "@/server/routers/athletes/common/map-to-athlete-dto";

export async function getAnalyticsQuery(
	_input: undefined,
	{ db, userId }: Context,
) {
	if (!userId) throw new Error("Unauthenticated");
	const athlete = await db.athlete.findUnique({
		where: { userId },
	});
	const athleteId = athlete?.id;

	const now = DateTime.now();
	const currStart = now.startOf("month").toJSDate();
	const prevStart = now.minus({ months: 1 }).startOf("month").toJSDate();
	const prevEnd = now.startOf("month").toJSDate();
	const thirtyDaysAgo = now.minus({ days: 30 }).startOf("day").toJSDate();

	const [currAgg, prevAgg] = await Promise.all([
		athleteId
			? db.activity.aggregate({
					where: { athleteId, startDate: { gte: currStart } },
					_sum: { distance: true, elapsedTime: true },
					_count: { id: true },
				})
			: null,
		athleteId
			? db.activity.aggregate({
					where: { athleteId, startDate: { gte: prevStart, lt: prevEnd } },
					_sum: { distance: true, elapsedTime: true },
					_count: { id: true },
				})
			: null,
	]);

	const totalMeters = {
		amount: currAgg?._sum.distance ?? 0,
		change: (currAgg?._sum.distance ?? 0) - (prevAgg?._sum.distance ?? 0),
	};
	const totalActivities = {
		amount: currAgg?._count.id ?? 0,
		change: (currAgg?._count.id ?? 0) - (prevAgg?._count.id ?? 0),
	};
	const totalDuration = {
		amount: currAgg?._sum.elapsedTime ?? 0,
		change: (currAgg?._sum.elapsedTime ?? 0) - (prevAgg?._sum.elapsedTime ?? 0),
	};

	const allDates = athleteId
		? await db.activity.findMany({
				where: { athleteId },
				select: { startDate: true },
				orderBy: { startDate: "desc" },
			})
		: [];

	const uniqueDays = [
		...new Set(allDates.map((a) => a.startDate.toISOString().split("T")[0])),
	].sort((a, b) => b.localeCompare(a));

	let currentStreak = 0;
	let cursor = now.startOf("day");
	for (const day of uniqueDays) {
		const cursorStr = cursor.toISODate();
		if (day === cursorStr) {
			currentStreak++;
			cursor = cursor.minus({ days: 1 });
		} else if (day < (cursorStr ?? "")) {
			break;
		}
	}

	const weekDays = Array.from({ length: 7 }, (_, i) => {
		const date = now.minus({ days: 6 - i }).startOf("day");
		const isoDate = date.toISODate() ?? "";
		return {
			date: isoDate,
			hasActivity: uniqueDays.includes(isoDate),
		};
	});

	const [lastTwoKmRow, lastSixKmRow, prevTwoKmRow, prevSixKmRow] =
		await Promise.all([
			athleteId
				? db.activity.findFirst({
						where: { athleteId, type: "erg", distance: 2000 },
						orderBy: { startDate: "desc" },
					})
				: null,
			athleteId
				? db.activity.findFirst({
						where: { athleteId, type: "erg", distance: 6000 },
						orderBy: { startDate: "desc" },
					})
				: null,
			athleteId
				? db.activity.findFirst({
						where: {
							athleteId,
							type: "erg",
							distance: 2000,
							startDate: { lt: currStart },
						},
						orderBy: { startDate: "desc" },
					})
				: null,
			athleteId
				? db.activity.findFirst({
						where: {
							athleteId,
							type: "erg",
							distance: 6000,
							startDate: { lt: currStart },
						},
						orderBy: { startDate: "desc" },
					})
				: null,
		]);

	const lastTwoKm = lastTwoKmRow
		? {
				duration: lastTwoKmRow.elapsedTime,
				date: lastTwoKmRow.startDate.toISOString(),
				activityId: lastTwoKmRow.id,
				change:
					lastTwoKmRow.elapsedTime -
					(prevTwoKmRow?.elapsedTime ?? lastTwoKmRow.elapsedTime),
			}
		: undefined;

	const lastSixKm = lastSixKmRow
		? {
				duration: lastSixKmRow.elapsedTime,
				date: lastSixKmRow.startDate.toISOString(),
				activityId: lastSixKmRow.id,
				change:
					lastSixKmRow.elapsedTime -
					(prevSixKmRow?.elapsedTime ?? lastSixKmRow.elapsedTime),
			}
		: undefined;

	const seriesRows = athleteId
		? await db.activity.findMany({
				where: { athleteId, startDate: { gte: thirtyDaysAgo } },
				select: { startDate: true, type: true, distance: true },
				orderBy: { startDate: "asc" },
			})
		: [];

	const seriesMap = new Map<string, { boat: number; erg: number }>();
	for (const row of seriesRows) {
		const day = row.startDate.toISOString().split("T")[0];
		const entry = seriesMap.get(day) ?? { boat: 0, erg: 0 };
		if (row.type === "water") entry.boat += row.distance;
		else entry.erg += row.distance;
		seriesMap.set(day, entry);
	}
	const metersTimeSeries = Array.from(seriesMap.entries()).map(([date, v]) => ({
		date,
		...v,
	}));

	const allAthletes = await db.athlete.findMany({
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
	});

	const leaderboard = allAthletes.map((row) => {
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
			programType: athleteDto.programType,
			activeMembership: athleteDto.activeMembership,
			meters,
			points: 0,
			bestTwoKm: twoKms.length > 0 ? Math.min(...twoKms) : undefined,
			bestSixKm: sixKms.length > 0 ? Math.min(...sixKms) : undefined,
			streak,
		};
	});

	return {
		analyticMetrics: {
			totalMeters,
			totalActivities,
			totalDuration,
			activeStreak: { currentStreak, weekDays },
			lastTwoKm,
			lastSixKm,
		},
		metersTimeSeries,
		leaderboard,
	};
}
