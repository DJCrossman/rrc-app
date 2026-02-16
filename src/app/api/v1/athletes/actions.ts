"use server";
import { DateTime, Interval } from "luxon";
import { activitiesDBSchema, usersSchema } from "@/schemas";
import {
	type Athlete,
	type AthleteStats,
	athleteDBSchema,
	athleteSchema,
	athletesSchema,
	type CreateAthlete,
} from "@/schemas/athlete.schema";
import { membershipsSchema } from "@/schemas/memberships.schema";
import { getActivities } from "../activities/actions";
import activitiesData from "../activities/activities.json";
import memberships from "../memberships/memberships.json";
import users from "../users/users.json";
import athletes from "./athletes.json";

const membershipsParsed = membershipsSchema.parse(memberships);
const usersParsed = usersSchema.parse(users);
const activitiesDBParsed = activitiesDBSchema.parse(activitiesData);
const athletesParsed = athletesSchema.parse(
	athletes.map((athlete) => {
		const athleteEntity = athleteDBSchema.parse(athlete);
		const user = usersParsed.find((user) => user.id === athleteEntity.userId);
		const name = user?.roles.includes("admin")
			? [
					user?.firstName,
					user?.nickname ? `(${user?.nickname})` : "",
					user?.lastName,
				]
					.filter(Boolean)
					.join(" ")
			: user?.nickname || user?.firstName;
		const activeMembership = membershipsParsed.find(
			(membership) =>
				membership.athleteId === athleteEntity.id &&
				Interval.fromDateTimes(
					DateTime.fromISO(membership.startDate),
					DateTime.fromISO(membership.endDate),
				).contains(DateTime.now()),
		);
		const programType = membershipsParsed[0]?.programType;
		return athleteSchema.parse({
			...user,
			...athlete,
			userId: athleteEntity.userId,
			name,
			activeMembership,
			programType,
		});
	}),
);

export const getAthletes = async () => {
	return {
		data: athletesParsed,
	};
};

export async function getAthleteById(id?: number): Promise<Athlete | null> {
	const athlete = athletesParsed.find((athlete) => athlete.id === id);
	return athlete ?? null;
}

export async function getAthleteByUserId(userId: number): Promise<Athlete> {
	const athlete = athletesParsed.find((athlete) => athlete.userId === userId);

	if (!athlete) {
		throw new Error("Athlete not found");
	}

	return athlete;
}

export const createAthlete = async (data: CreateAthlete): Promise<Athlete> => {
	const name = data?.roles.includes("admin")
		? [
				data?.firstName,
				data?.nickname ? `(${data?.nickname})` : "",
				data?.lastName,
			]
				.filter(Boolean)
				.join(" ")
		: data?.nickname || data?.firstName;
	const athlete = athleteSchema.parse({
		id: athletesParsed.length + 1,
		userId: usersParsed.length + 1,
		name,
		...data,
	});
	athletesParsed.push(athlete);
	return athlete;
};

export const updateAthlete = async (data: Athlete): Promise<Athlete> => {
	const athleteIndex = athletesParsed.findIndex(
		(athlete) => athlete.id === data.id,
	);
	if (athleteIndex === -1) {
		throw new Error("Athlete not found");
	}
	const updatedAthlete = athleteSchema.parse({
		...athletesParsed[athleteIndex],
		...data,
	});
	athletesParsed[athleteIndex] = updatedAthlete;
	return updatedAthlete;
};

export const getAthleteStats = async (
	athleteId: number,
): Promise<AthleteStats> => {
	const { data: activities } = await getActivities({ athleteId });

	// Filter for erg activities only
	const ergActivities = activities.filter(
		(activity) => activity.type === "erg",
	);

	// Helper function to get effective duration for an activity
	const getEffectiveDuration = (
		activity: (typeof ergActivities)[number],
		targetDistance: number,
	): { duration: number; date: string; activityId: number } | null => {
		// Check if it's a single piece matching the target distance exactly
		if (activity.distance === targetDistance) {
			return {
				duration: activity.elaspedTime,
				date: activity.startDate,
				activityId: activity.id,
			};
		}

		// Check for Concept2 intervals - all must be the same distance as target
		const activityDB = activitiesDBParsed.find((a) => a.id === activity.id);
		if (
			activityDB?.type === "erg" &&
			activityDB.conceptTwoData?.workout?.intervals
		) {
			const intervals = activityDB.conceptTwoData.workout.intervals;

			// Check if ALL intervals are the target distance
			const allMatchTarget = intervals.every(
				(interval) =>
					interval.type === "distance" && interval.distance === targetDistance,
			);

			if (allMatchTarget && intervals.length > 0) {
				// Calculate average time (intervals are in seconds, convert to milliseconds)
				const totalTimeMs = intervals.reduce(
					(sum, interval) => sum + interval.time * 1000,
					0,
				);
				const avgTimeMs = totalTimeMs / intervals.length;

				return {
					duration: avgTimeMs,
					date: activity.startDate,
					activityId: activity.id,
				};
			}
		}

		return null;
	};

	// Calculate stats for 2K (2000m)
	const twoKmActivities = ergActivities
		.map((activity) => getEffectiveDuration(activity, 2000))
		.filter((stat): stat is NonNullable<typeof stat> => stat !== null);

	const lastTwoKmRaceDuration =
		twoKmActivities.length > 0
			? twoKmActivities.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0]
			: null;

	const bestTwoKmRaceDuration =
		twoKmActivities.length > 0
			? twoKmActivities.sort((a, b) => a.duration - b.duration)[0]
			: null;

	// Calculate stats for 6K (6000m)
	const sixKmActivities = ergActivities
		.map((activity) => getEffectiveDuration(activity, 6000))
		.filter((stat): stat is NonNullable<typeof stat> => stat !== null);

	const lastSixKmRaceDuration =
		sixKmActivities.length > 0
			? sixKmActivities.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				)[0]
			: null;

	const bestSixKmRaceDuration =
		sixKmActivities.length > 0
			? sixKmActivities.sort((a, b) => a.duration - b.duration)[0]
			: null;

	return {
		lastTwoKmRaceDuration,
		bestTwoKmRaceDuration,
		lastSixKmRaceDuration,
		bestSixKmRaceDuration,
	};
};
