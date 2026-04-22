"use server";
import { requireAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { AthleteStats, CreateAthlete } from "@/schemas/athlete.schema";
import { concept2ActivitySchema } from "@/schemas/concept2Activity.schema";
import { athleteInclude, mapToAthleteDto } from "./utils";

export const getAthletes = async () => {
	await requireAuth();

	const rows = await db.athlete.findMany({
		orderBy: { id: "asc" },
		include: athleteInclude,
	});

	return {
		data: rows.map(mapToAthleteDto),
	};
};

export async function getAthleteById(id?: string) {
	await requireAuth();
	if (!id) return null;

	const row = await db.athlete.findUnique({
		where: { id },
		include: athleteInclude,
	});
	return row ? mapToAthleteDto(row) : null;
}

export async function getAthleteByUserId(userId: string) {
	const row = await db.athlete.findUnique({
		where: { clerkUserId: userId },
		include: athleteInclude,
	});

	if (!row) {
		throw new Error(`Athlete not found for userId ${userId}`);
	}

	return mapToAthleteDto(row);
}

export async function getCurrentAthlete() {
	const userId = await requireAuth();
	return getAthleteByUserId(userId);
}

export const createAthlete = async (data: CreateAthlete) => {
	await requireAuth();

	const row = await db.athlete.create({
		data: {
			firstName: data.firstName,
			lastName: data.lastName,
			nickname: data.nickname,
			phone: data.phone,
			gender: data.gender,
			dateOfBirth: new Date(data.dateOfBirth),
			dateJoined: data.dateJoined ? new Date(data.dateJoined) : undefined,
			heightInCm: data.heightInCm,
			weightInKg: data.weightInKg,
		},
		include: athleteInclude,
	});

	return mapToAthleteDto(row);
};

export const updateAthlete = async (data: Athlete) => {
	await requireAuth();

	const row = await db.athlete.update({
		where: { id: data.id },
		data: {
			firstName: data.firstName,
			lastName: data.lastName,
			nickname: data.nickname,
			phone: data.phone,
			gender: data.gender,
			dateOfBirth: new Date(data.dateOfBirth),
			dateJoined: data.dateJoined ? new Date(data.dateJoined) : undefined,
			heightInCm: data.heightInCm,
			weightInKg: data.weightInKg,
		},
		include: athleteInclude,
	});

	return mapToAthleteDto(row);
};

export const getAthleteStats = async (
	athleteId: string,
): Promise<AthleteStats> => {
	const ergActivities = await db.activity.findMany({
		where: { athleteId, type: "erg" },
		orderBy: { startDate: "desc" },
		select: {
			id: true,
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
		if (activity.distance === targetDistance) {
			return {
				duration: activity.elapsedTime,
				date: activity.startDate.toISOString(),
				activityId: activity.id,
			};
		}

		if (activity.conceptTwoData) {
			const parsed = concept2ActivitySchema.safeParse(activity.conceptTwoData);
			if (parsed.success) {
				const intervals = parsed.data.workout?.intervals;
				if (intervals && intervals.length > 0) {
					const allMatchTarget = intervals.every(
						(interval) =>
							interval.type === "distance" &&
							interval.distance === targetDistance,
					);
					if (allMatchTarget) {
						const totalTimeMs = intervals.reduce(
							(sum, interval) => sum + interval.time * 1000,
							0,
						);
						return {
							duration: totalTimeMs / intervals.length,
							date: activity.startDate.toISOString(),
							activityId: activity.id,
						};
					}
				}
			}
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
};

export type Athlete = NonNullable<Awaited<ReturnType<typeof getAthleteById>>>;
export type Athletes = Awaited<ReturnType<typeof getAthletes>>["data"];
