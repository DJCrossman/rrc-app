import type { Context } from "@/server/context";
import {
	type AthleteRow,
	athleteInclude,
} from "@/server/routers/athletes/common/map-to-athlete-dto";
import {
	resolveAthleteGroupIds,
	resolveGroupMemberIds,
} from "./group-membership";

export type GroupsDb = Pick<
	Context["db"],
	"athlete" | "group" | "group_program" | "membership"
>;

export async function getGroupMembers(
	db: GroupsDb,
	groupId: string,
): Promise<AthleteRow[]> {
	return db.athlete.findMany({
		where: { id: { in: await getGroupMemberIds(db, groupId) } },
		include: athleteInclude,
		orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
	});
}

export async function getGroupMemberIds(
	db: GroupsDb,
	groupId: string,
): Promise<string[]> {
	const rules = await db.group_program.findMany({
		where: { groupId },
		select: { programId: true },
	});
	const programIds = rules.map((rule) => rule.programId);
	return resolveGroupMemberIds({
		programIds,
		memberships: await findRuleMemberships(db, programIds),
	});
}

export async function getAthleteGroupIds(
	db: GroupsDb,
	athleteId: string,
): Promise<string[]> {
	const memberships = await db.membership.findMany({
		where: { athleteId },
		select: {
			programId: true,
			program: { select: { startDate: true, endDate: true } },
		},
	});
	const groupPrograms = memberships.length
		? await db.group_program.findMany({
				where: { programId: { in: memberships.map((m) => m.programId) } },
				select: { groupId: true, programId: true },
			})
		: [];
	return resolveAthleteGroupIds({ memberships, groupPrograms });
}

export async function getAthleteGroups(db: GroupsDb, athleteId: string) {
	const groupIds = await getAthleteGroupIds(db, athleteId);
	return db.group.findMany({
		where: { id: { in: groupIds } },
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});
}

export async function findRuleMemberships(db: GroupsDb, programIds: string[]) {
	if (!programIds.length) return [];
	return db.membership.findMany({
		where: { programId: { in: programIds } },
		select: {
			athleteId: true,
			programId: true,
			program: { select: { startDate: true, endDate: true } },
		},
	});
}
