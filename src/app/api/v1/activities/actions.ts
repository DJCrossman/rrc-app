"use server";
import {
	type Activity,
	activitiesDBSchema,
	activitySchema,
	boatsSchema,
	ergsSchema,
	usersSchema,
} from "@/schemas";
import {
	athleteDBSchema,
	athleteSchema,
	athletesSchema,
} from "@/schemas/athlete.schema";
import athletes from "../athletes/athletes.json";
import boats from "../boats/boats.json";
import ergs from "../ergs/ergs.json";
import users from "../users/users.json";
import activities from "./activities.json";

const usersParsed = usersSchema.parse(users);
const activitiesParsed = activitiesDBSchema.parse(activities);
const athletesParsed = athletesSchema.parse(
	athletes.map((athlete) => {
		const athleteEntity = athleteDBSchema.parse(athlete);
		const user = usersParsed.find((user) => user.id === athleteEntity.userId);
		return athleteSchema.parse({
			...user,
			...athlete,
			userId: athleteEntity.userId,
			name: user?.nickName || user?.firstName,
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
