import { DateTime, Interval } from "luxon";
import type { Prisma } from "@/generated/prisma/client";

export const athleteInclude = {
	memberships: { include: { program: true } },
} as const;

export type AthleteRow = Prisma.athleteGetPayload<{
	include: typeof athleteInclude;
}>;

export function mapToAthleteDto(row: AthleteRow) {
	const now = DateTime.now();

	const activeMembership = row.memberships
		.map((m) => ({
			id: m.id,
			athleteId: m.athleteId,
			programId: m.programId,
			name: m.program.name,
			description: m.program.description,
			programType: m.program.programType,
			startDate: m.program.startDate.toISOString(),
			endDate: m.program.endDate.toISOString(),
		}))
		.find((m) =>
			Interval.fromDateTimes(
				DateTime.fromISO(m.startDate),
				DateTime.fromISO(m.endDate),
			).contains(now),
		);

	return {
		id: row.id,
		firstName: row.firstName,
		lastName: row.lastName,
		nickname: row.nickname,
		name: row.nickname || row.firstName,
		phone: row.phone,
		email: row.email,
		role: row.role,
		gender: row.gender,
		dateOfBirth: row.dateOfBirth.toISOString(),
		dateJoined: row.dateJoined?.toISOString(),
		heightInCm: row.heightInCm,
		weightInKg: row.weightInKg,
		activeMembership,
		programType: activeMembership?.programType,
	};
}
