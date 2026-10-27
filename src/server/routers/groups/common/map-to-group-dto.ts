import type { Prisma } from "@/generated/prisma/client";
import type { AthleteRow } from "@/server/routers/athletes/common/map-to-athlete-dto";
import { isProgramActive } from "./group-membership";

export const groupInclude = {
	programs: { include: { program: true } },
} as const;

export type GroupRow = Prisma.groupGetPayload<{
	include: typeof groupInclude;
}>;

export function mapToGroupDto(row: GroupRow, memberCount: number) {
	return {
		id: row.id,
		name: row.name,
		programs: row.programs
			.map(({ program }) => ({ id: program.id, name: program.name }))
			.sort((a, b) => a.name.localeCompare(b.name)),
		memberCount,
	};
}

export function mapToGroupMemberDto(
	athlete: AthleteRow,
	ruleProgramIds: Set<string>,
) {
	const firstName = athlete.nickname || athlete.firstName;
	const activePrograms = athlete.memberships
		.filter((m) => isProgramActive(m.program))
		.map((m) => m.program);
	const program =
		activePrograms.find((p) => ruleProgramIds.has(p.id)) ?? activePrograms[0];

	return {
		id: athlete.id,
		name: [firstName, athlete.lastName].filter(Boolean).join(" "),
		initials:
			`${firstName.charAt(0)}${athlete.lastName.charAt(0)}`.toUpperCase(),
		program: program?.name ?? null,
	};
}
