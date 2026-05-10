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

	const memberships = row.memberships
		.map((m) => ({
			id: m.id,
			athleteId: m.athleteId,
			programId: m.programId,
			name: m.program.name,
			description: m.program.description,
			startDate: m.program.startDate?.toISOString() ?? null,
			endDate: m.program.endDate?.toISOString() ?? null,
		}))
		.sort((a, b) => {
			if (a.startDate && b.startDate)
				return b.startDate.localeCompare(a.startDate);
			if (a.startDate) return -1;
			if (b.startDate) return 1;
			return 0;
		});

	const activeMembership = memberships.find((m) => {
		if (!m.startDate || !m.endDate) return false;
		return Interval.fromDateTimes(
			DateTime.fromISO(m.startDate),
			DateTime.fromISO(m.endDate),
		).contains(now);
	});

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
		memberships,
		activeMembership,
	};
}
