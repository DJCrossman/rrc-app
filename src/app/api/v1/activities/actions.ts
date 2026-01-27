"use server";
import {
	type Activity,
	activitiesDBSchema,
	activityDBSchema,
	activitySchema,
	boatsSchema,
	type CreateActivity,
	ergsSchema,
	type UpdateActivity,
	usersSchema,
} from "@/schemas";
import {
	athleteDBSchema,
	athleteSchema,
	athletesSchema,
} from "@/schemas/athlete.schema";
import { workoutsSchema } from "@/schemas/workouts.schema";
import athletes from "../athletes/athletes.json";
import boats from "../boats/boats.json";
import ergs from "../ergs/ergs.json";
import users from "../users/users.json";
import workoutsData from "../workouts/workouts.json";
import activities from "./activities.json";

const usersParsed = usersSchema.parse(users);
const activitiesParsed = activitiesDBSchema.parse(activities);
const workoutsParsed = workoutsSchema.parse(workoutsData);
const athletesParsed = athletesSchema.parse(
	athletes.map((athlete) => {
		const athleteEntity = athleteDBSchema.parse(athlete);
		const user = usersParsed.find((user) => user.id === athleteEntity.userId);
		return athleteSchema.parse({
			...user,
			...athlete,
			userId: athleteEntity.userId,
			name: user?.nickname || user?.firstName,
		});
	}),
);
const boatsParsed = boatsSchema.parse(boats);
const ergsParsed = ergsSchema.parse(ergs);

export const getActivities = async ({
	boatId,
	athleteId,
	ergId,
}: {
	boatId?: number;
	athleteId?: number;
	ergId?: number;
}) => {
	const activities = activitiesParsed.map((activity) => {
		const athlete =
			athletesParsed.find((athlete) => athlete.id === activity.athleteId) ??
			null;

		if (activity.type === "water") {
			const boat =
				boatsParsed.find((boat) => boat.id === activity.boatId) ?? null;
			if (!boat) {
				return null;
			}
			return activitySchema.parse({
				id: activity.id,
				athlete,
				boat,
				erg: null,
				workout: null,
				workoutType: "distance",
				isStrava: activity.stravaId !== null,
				name: activity.name,
				type: "water",
				startDate: activity.startDate,
				timezone: activity.timezone,
				elaspedTime: activity.elaspedTime,
				distance: activity.distance,
			});
		} else {
			const erg = ergsParsed.find((erg) => erg.id === activity.ergId) ?? null;
			if (!erg) {
				return null;
			}
			return activitySchema.parse({
				id: activity.id,
				athlete,
				boat: null,
				erg,
				workout: null,
				workoutType: activity.workoutType,
				isStrava: activity.stravaId !== null,
				name: activity.name,
				type: "erg",
				startDate: activity.startDate,
				timezone: activity.timezone,
				elaspedTime: activity.elaspedTime,
				distance: activity.distance,
			});
		}
	});

	const filteredActivities = activities
		.filter((activity): activity is Activity => {
			if (!activity) {
				return false;
			}
			if (boatId) {
				return activity.type === "water" && activity.boat?.id === boatId;
			}
			if (athleteId) {
				return activity.athlete?.id === athleteId;
			}
			if (ergId) {
				return activity.type === "erg" && activity.erg?.id === ergId;
			}
			return true;
		})
		.sort(
			(a, b) =>
				new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
		);
	return {
		data: filteredActivities,
	};
};

export async function getActivityById(id?: number): Promise<Activity | null> {
	if (!id) return null;

	const activityDB = activitiesParsed.find((activity) => activity.id === id);
	if (!activityDB) return null;

	const athlete =
		athletesParsed.find((athlete) => athlete.id === activityDB.athleteId) ??
		null;
	const workout =
		workoutsParsed.find((workout) => workout.id === activityDB.workoutId) ??
		null;

	if (activityDB.type === "water") {
		const boat =
			boatsParsed.find((boat) => boat.id === activityDB.boatId) ?? null;
		if (!boat || !athlete) return null;

		return activitySchema.parse({
			id: activityDB.id,
			athlete,
			boat,
			erg: null,
			workout,
			workoutType: activityDB.workoutType,
			isStrava: activityDB.stravaId !== null,
			name: activityDB.name,
			type: "water",
			startDate: activityDB.startDate,
			timezone: activityDB.timezone,
			elaspedTime: activityDB.elaspedTime,
			distance: activityDB.distance,
		});
	} else {
		const erg = ergsParsed.find((erg) => erg.id === activityDB.ergId) ?? null;
		if (!erg || !athlete) return null;

		return activitySchema.parse({
			id: activityDB.id,
			athlete,
			boat: null,
			erg,
			workout,
			workoutType: activityDB.workoutType,
			isStrava: activityDB.stravaId !== null,
			name: activityDB.name,
			type: "erg",
			startDate: activityDB.startDate,
			timezone: activityDB.timezone,
			elaspedTime: activityDB.elaspedTime,
			distance: activityDB.distance,
		});
	}
}

export const createActivity = async (
	data: CreateActivity,
): Promise<Activity> => {
	// Create the DB entity
	const activityDB = activityDBSchema.parse({
		id: activitiesParsed.length + 1,
		name: data.name,
		startDate: data.startDate,
		timezone: data.timezone,
		workoutType: data.workoutType,
		elaspedTime: data.elapsedTime,
		distance: data.distance,
		athleteId: data.athleteId,
		workoutId: data.workoutId,
		stravaId: null,
		stravaData: null,
		conceptTwoId: null,
		conceptTwoData: null,
		type: data.type,
		...(data.type === "water"
			? { boatId: data.boatId }
			: { ergId: data.ergId }),
	});

	activitiesParsed.push(activityDB);

	// Return the full activity object
	const activity = await getActivityById(activityDB.id);
	if (!activity) {
		throw new Error("Failed to create activity");
	}
	return activity;
};

export const updateActivity = async (
	data: UpdateActivity,
): Promise<Activity> => {
	const activityIndex = activitiesParsed.findIndex(
		(activity) => activity.id === data.id,
	);
	if (activityIndex === -1) {
		throw new Error("Activity not found");
	}

	// Update the DB entity
	const updatedActivityDB = activityDBSchema.parse({
		...activitiesParsed[activityIndex],
		name: data.name,
		startDate: data.startDate,
		timezone: data.timezone,
		workoutType: data.workoutType,
		elaspedTime: data.elapsedTime,
		distance: data.distance,
		athleteId: data.athleteId,
		workoutId: data.workoutId || null,
		type: data.type,
		...(data.type === "water"
			? { boatId: data.boatId }
			: { ergId: data.ergId }),
	});

	activitiesParsed[activityIndex] = updatedActivityDB;

	// Return the full activity object
	const activity = await getActivityById(data.id);
	if (!activity) {
		throw new Error("Failed to update activity");
	}
	return activity;
};

export const deleteActivity = async (id: number): Promise<void> => {
	const activityIndex = activitiesParsed.findIndex(
		(activity) => activity.id === id,
	);
	if (activityIndex === -1) {
		throw new Error("Activity not found");
	}
	activitiesParsed.splice(activityIndex, 1);
};
