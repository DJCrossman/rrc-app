import { DateTime } from "luxon";

export interface ProgramWindow {
	startDate: Date | null;
	endDate: Date | null;
}

export interface ProgramMembership {
	athleteId: string;
	programId: string;
	program: ProgramWindow;
}

export interface CoachCandidate {
	role: string;
	memberships: { program: ProgramWindow & { name: string } }[];
}

export function todayIsoDate(): string {
	return DateTime.now().toISODate();
}

export function isProgramActive(
	program: ProgramWindow,
	today: string = todayIsoDate(),
): boolean {
	const start = program.startDate ? toIsoDate(program.startDate) : null;
	const end = program.endDate ? toIsoDate(program.endDate) : null;
	return (!start || start <= today) && (!end || today <= end);
}

export function resolveGroupMemberIds({
	programIds,
	memberships,
	today = todayIsoDate(),
}: {
	programIds: string[];
	memberships: ProgramMembership[];
	today?: string;
}): string[] {
	const rulePrograms = new Set(programIds);
	return [
		...new Set(
			memberships
				.filter(
					(m) =>
						rulePrograms.has(m.programId) && isProgramActive(m.program, today),
				)
				.map((m) => m.athleteId),
		),
	];
}

export function resolveAthleteGroupIds({
	memberships,
	groupPrograms,
	today = todayIsoDate(),
}: {
	memberships: Omit<ProgramMembership, "athleteId">[];
	groupPrograms: { groupId: string; programId: string }[];
	today?: string;
}): string[] {
	const activeProgramIds = new Set(
		memberships
			.filter((m) => isProgramActive(m.program, today))
			.map((m) => m.programId),
	);
	return [
		...new Set(
			groupPrograms
				.filter((rule) => activeProgramIds.has(rule.programId))
				.map((rule) => rule.groupId),
		),
	];
}

export function isCoach(
	athlete: CoachCandidate,
	today: string = todayIsoDate(),
): boolean {
	return (
		athlete.role === "admin" ||
		athlete.memberships.some(
			(m) => isProgramActive(m.program, today) && /coach/i.test(m.program.name),
		)
	);
}

function toIsoDate(date: Date): string {
	return date.toISOString().slice(0, 10);
}
