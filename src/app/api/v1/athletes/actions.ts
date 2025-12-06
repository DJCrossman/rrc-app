"use server";
import { DateTime, Interval } from "luxon";
import { usersSchema } from "@/schemas";
import {
	type Athlete,
	athleteDBSchema,
	athleteSchema,
	athletesSchema,
	type CreateAthlete,
} from "@/schemas/athlete.schema";
import { membershipsSchema } from "@/schemas/memberships.schema";
import memberships from "../memberships/memberships.json";
import users from "../users/users.json";
import athletes from "./athletes.json";

const membershipsParsed = membershipsSchema.parse(memberships);
const usersParsed = usersSchema.parse(users);
const athletesParsed = athletesSchema.parse(
	athletes.map((athlete) => {
		const athleteEntity = athleteDBSchema.parse(athlete);
		const user = usersParsed.find((user) => user.id === athleteEntity.userId);
		const name = user?.roles.includes("admin")
			? [
					user?.firstName,
					user?.nickName ? `(${user?.nickName})` : "",
					user?.lastName,
				]
					.filter(Boolean)
					.join(" ")
			: user?.nickName || user?.firstName;
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

export const createAthlete = async (data: CreateAthlete): Promise<Athlete> => {
	const name = data?.roles.includes("admin")
		? [
				data?.firstName,
				data?.nickName ? `(${data?.nickName})` : "",
				data?.lastName,
			]
				.filter(Boolean)
				.join(" ")
		: data?.nickName || data?.firstName;
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
